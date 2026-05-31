import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300

type GenerateBody = {
  ticker: string
  domain?: string
  fast?: boolean
}

type ContextBundle = {
  quote: Record<string, unknown> | null
  news: Array<Record<string, unknown>>
  sec: {
    cik?: string
    companyName?: string
    filings: Array<Record<string, unknown>>
    filingExcerpt?: string
    filingUrl?: string
  }
  arxiv: Array<{ title: string; summary: string; url: string }>
}

// New report structure — narrative-first, no valuation, no conclusion.
const REPORT_SECTIONS = [
  'Price / Share',
  'Company Overview',
  'Technology Masterclass',
  'Supply Chain Analysis',
  'Investment Analysis',
  'Management Team',
]

const SEC_HEADERS = {
  'User-Agent': process.env.SEC_USER_AGENT || 'Sidereus Research contact@example.com',
  Accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
}

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || process.env.ANTHROPIC_FAST_MODEL || 'claude-3-5-sonnet-latest'
const OPENAI_MINI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const FAST_CONTEXT_TIMEOUT_MS = 7000
const FAST_MANAGEMENT_TIMEOUT_MS = 2500
const FAST_MODEL_TIMEOUT_MS = 22000

function detectDomain(ticker: string, domain?: string) {
  if (domain) return domain
  const symbol = ticker.toUpperCase()
  if (['NVDA', 'AMD', 'AVGO', 'ASML', 'ARM', 'LITE', 'COHR', 'AXTI', 'SNDK', 'AAOI', 'MRVL', 'MU'].includes(symbol)) return 'AI Supply Chain'
  if (['VRT', 'SMCI', 'CRWV', 'EQIX', 'DLR', 'DELL', 'HPE'].includes(symbol)) return 'Data Center Ecosystem'
  if (['MRNA', 'REGN', 'VRTX', 'GILD', 'ALNY', 'ABVX', 'BNTX', 'BIIB'].includes(symbol)) return 'Biotechnology'
  return 'Frontier Technology'
}

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = 8000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, {
      ...init,
      signal: init?.signal ?? controller.signal,
      cache: init?.cache ?? 'no-store',
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(fallback), timeoutMs)
    promise
      .then((value) => resolve(value))
      .catch(() => resolve(fallback))
      .finally(() => clearTimeout(timeout))
  })
}

async function fetchJson(url: string, init?: RequestInit, timeoutMs = 8000) {
  const res = await fetchWithTimeout(url, init, timeoutMs)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.json()
}

async function fetchText(url: string, init?: RequestInit, timeoutMs = 8000) {
  const res = await fetchWithTimeout(url, init, timeoutMs)
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.text()
}

function normalizeReportMarkdown(markdown: string) {
  const parts = markdown.split(/(```[\s\S]*?```)/g)
  const normalized = parts.map((part) => {
    if (part.startsWith('```')) return part
    const lines = part.split('\n')
    const out: string[] = []
    let paragraph: string[] = []

    const flushParagraph = () => {
      if (!paragraph.length) return
      out.push(paragraph.join(' ').replace(/\s+/g, ' ').trim())
      out.push('')
      paragraph = []
    }

    for (const rawLine of lines) {
      const line = rawLine.trim()
      const isStructural =
        line === '' ||
        /^#{1,6}\s/.test(line) ||
        /^[-*+]\s/.test(line) ||
        /^\d+\.\s/.test(line) ||
        /^\|/.test(line) ||
        /^>\s?/.test(line) ||
        /^---+$/.test(line)

      if (isStructural) {
        flushParagraph()
        out.push(line)
        continue
      }
      paragraph.push(line)
    }
    flushParagraph()
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  })
  return normalized.join('\n\n').replace(/\n{3,}/g, '\n\n').trim()
}

function stripHtml(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── Yahoo Finance (yfinance-style): price / share + market cap ──
// Mirrors how ranaroussi/yfinance authenticates: fetch an A1 cookie, request
// a crumb, then hit the v7 quote endpoint with that crumb. Falls back to the
// no-auth v8 chart endpoint (price only) if the crumb flow is unavailable.
const YF_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

let yfCrumbCache: { crumb: string; cookie: string; ts: number } | null = null

async function getYahooCrumb(): Promise<{ crumb: string; cookie: string } | null> {
  // Cache the crumb for 10 minutes within a warm lambda.
  if (yfCrumbCache && Date.now() - yfCrumbCache.ts < 600_000) {
    return { crumb: yfCrumbCache.crumb, cookie: yfCrumbCache.cookie }
  }
  try {
    const cookieRes = await fetchWithTimeout('https://fc.yahoo.com', { headers: { 'User-Agent': YF_UA } }, 3500)
    const setCookie =
      (cookieRes.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie?.().join('; ') ||
      cookieRes.headers.get('set-cookie') ||
      ''
    const cookie = setCookie.split(';')[0] || setCookie
    const crumbRes = await fetchWithTimeout('https://query1.finance.yahoo.com/v1/test/getcrumb', {
      headers: { 'User-Agent': YF_UA, Cookie: cookie },
    }, 3500)
    const crumb = (await crumbRes.text()).trim()
    if (!crumb || crumb.includes('<') || crumb.length > 40) return null
    yfCrumbCache = { crumb, cookie, ts: Date.now() }
    return { crumb, cookie }
  } catch {
    return null
  }
}

async function fetchYahooQuote(ticker: string) {
  // Primary: v7 quote with crumb (full object incl. marketCap).
  try {
    const auth = await getYahooCrumb()
    if (auth) {
      const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ticker)}&crumb=${encodeURIComponent(auth.crumb)}`
      const res = await fetchWithTimeout(url, { headers: { 'User-Agent': YF_UA, Cookie: auth.cookie } }, 3500)
      if (res.ok) {
        const data = await res.json()
        const q = data?.quoteResponse?.result?.[0]
        if (q?.regularMarketPrice != null) return q
      }
    }
  } catch {
    /* fall through to chart endpoint */
  }

  // Fallback: v8 chart endpoint (no auth) — price + 52w range, no market cap.
  try {
    const c = await fetchJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`)
    const meta = c?.chart?.result?.[0]?.meta
    if (meta?.regularMarketPrice != null) {
      const prev = meta.chartPreviousClose ?? meta.previousClose
      const changePct = prev ? ((meta.regularMarketPrice - prev) / prev) * 100 : undefined
      return {
        regularMarketPrice: meta.regularMarketPrice,
        regularMarketChangePercent: changePct,
        marketCap: meta.marketCap ?? undefined,
        currency: meta.currency || 'USD',
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
        longName: meta.longName,
        shortName: meta.shortName || meta.symbol,
      }
    }
  } catch {
    /* give up */
  }
  return null
}

async function fetchYahooNews(ticker: string) {
  try {
    const data = await fetchJson(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&quotesCount=1&newsCount=8`)
    return (data?.news || []).slice(0, 8)
  } catch {
    return []
  }
}

function fmtMoney(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n === 0) return 'N/A'
  if (Math.abs(n) >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return `$${n.toFixed(2)}`
}

function priceFactsMarkdown(quote: Record<string, unknown> | null): string {
  if (!quote) return 'Live price data unavailable from Yahoo Finance at generation time.'
  const price = quote.regularMarketPrice
  const currency = (quote.currency as string) || 'USD'
  const marketCap = quote.marketCap
  const change = quote.regularMarketChangePercent
  const lines = [
    `- Current share price: ${typeof price === 'number' ? `$${price.toFixed(2)} ${currency}` : 'N/A'}`,
    typeof change === 'number' ? `- Day change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '',
    `- Market capitalization: ${fmtMoney(marketCap)}`,
    `- 52-week range: ${quote.fiftyTwoWeekLow ? `$${quote.fiftyTwoWeekLow}` : 'N/A'} – ${quote.fiftyTwoWeekHigh ? `$${quote.fiftyTwoWeekHigh}` : 'N/A'}`,
  ].filter(Boolean)
  return lines.join('\n')
}

// ── arXiv: ground the Technology Masterclass in research papers ──
async function fetchArxiv(query: string, timeoutMs = 5000): Promise<ContextBundle['arxiv']> {
  if (!query.trim()) return []
  try {
    const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=4&sortBy=relevance`
    const xml = await fetchText(url, undefined, timeoutMs)
    const entries: ContextBundle['arxiv'] = []
    const entryRe = /<entry>([\s\S]*?)<\/entry>/g
    let m: RegExpExecArray | null
    while ((m = entryRe.exec(xml)) !== null && entries.length < 4) {
      const block = m[1]
      const title = (block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '').replace(/\s+/g, ' ').trim()
      const summary = (block.match(/<summary>([\s\S]*?)<\/summary>/)?.[1] || '').replace(/\s+/g, ' ').trim().slice(0, 400)
      const url2 = (block.match(/<id>([\s\S]*?)<\/id>/)?.[1] || '').trim()
      if (title) entries.push({ title, summary, url: url2 })
    }
    return entries
  } catch {
    return []
  }
}

type ManagementProfile = {
  name: string
  role: string
  linkedinUrl?: string
  snippet?: string
}

async function fetchManagementProfiles(companyName: string, ticker: string) {
  const roles = ['CEO', 'CTO', 'COO', 'CFO']
  const profiles = await Promise.all(roles.map(async (role): Promise<ManagementProfile | null> => {
    try {
      const q = encodeURIComponent(`site:linkedin.com/in ${companyName} ${ticker} ${role}`)
      const html = await fetchText(`https://duckduckgo.com/html/?q=${q}`, undefined, 2500)
      const match = html.match(
        /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i
      )
      if (!match) return null
      const url = match[1]
      const title = stripHtml(match[2])
      const snippet = stripHtml(match[3])
      return {
        name: title,
        role,
        linkedinUrl: url.includes('linkedin.com') ? url : undefined,
        snippet,
      }
    } catch {
      return null
    }
  }))
  return profiles.filter((profile): profile is ManagementProfile => Boolean(profile))
}

async function fetchSecContext(ticker: string, excerptLimit = 22000): Promise<Omit<ContextBundle['sec'], never>> {
  try {
    const tickers = await fetchJson('https://www.sec.gov/files/company_tickers.json', { headers: SEC_HEADERS }, 4500)
    const match = Object.values(tickers as Record<string, { ticker: string; cik_str: number; title: string }>).find(
      (entry) => entry.ticker?.toUpperCase() === ticker
    )
    if (!match) return { filings: [] }

    const cik = String(match.cik_str).padStart(10, '0')
    const submissions = await fetchJson(`https://data.sec.gov/submissions/CIK${cik}.json`, { headers: SEC_HEADERS }, 4500)
    const recent = submissions?.filings?.recent
    const filings = Array.from({ length: Math.min(recent?.form?.length || 0, 40) })
      .map((_, index) => ({
        form: recent.form[index],
        filingDate: recent.filingDate[index],
        reportDate: recent.reportDate[index],
        accessionNumber: recent.accessionNumber[index],
        primaryDocument: recent.primaryDocument[index],
      }))
      .filter((filing) => ['10-K', '10-Q', '8-K', '20-F', '6-K', 'S-1'].includes(String(filing.form)))
      .slice(0, 8)

    const primary = filings.find((filing) => ['10-K', '10-Q', '20-F', 'S-1'].includes(String(filing.form))) || filings[0]
    let filingExcerpt = ''
    let filingUrl = ''

    if (primary?.accessionNumber && primary?.primaryDocument) {
      const cikNoLeading = String(match.cik_str)
      const accession = String(primary.accessionNumber).replace(/-/g, '')
      filingUrl = `https://www.sec.gov/Archives/edgar/data/${cikNoLeading}/${accession}/${primary.primaryDocument}`
      const filingText = await fetchText(filingUrl, { headers: SEC_HEADERS }, 5000)
      filingExcerpt = stripHtml(filingText).slice(0, excerptLimit)
    }

    return { cik, companyName: match.title, filings, filingExcerpt, filingUrl }
  } catch {
    return { filings: [] }
  }
}

async function collectContext(ticker: string, domain: string, fast = false): Promise<ContextBundle> {
  const [quote, news, sec] = await Promise.all([
    fetchYahooQuote(ticker),
    fetchYahooNews(ticker),
    fetchSecContext(ticker, fast ? 6500 : 22000),
  ])
  // arXiv query: company name + domain keywords (best-effort grounding).
  const arxiv = fast ? [] : await fetchArxiv(`${sec.companyName || ticker} ${domain.replace('Ecosystem', '').trim()}`)
  return { quote, news, sec, arxiv }
}

function contextToMarkdown(context: ContextBundle) {
  return [
    '## Live Price (Yahoo Finance)',
    priceFactsMarkdown(context.quote),
    '',
    '## Recent News Headlines',
    JSON.stringify(context.news, null, 2),
    '',
    '## SEC Filing Index',
    JSON.stringify(context.sec.filings, null, 2),
    '',
    context.sec.filingUrl ? `Primary filing URL: ${context.sec.filingUrl}` : '',
    '',
    '## SEC Filing Excerpt (primary document)',
    context.sec.filingExcerpt || 'No filing excerpt available.',
    '',
    '## Relevant Research Papers (arXiv)',
    context.arxiv.length
      ? context.arxiv.map((p) => `- ${p.title} (${p.url})\n  ${p.summary}`).join('\n')
      : 'No arXiv papers retrieved.',
  ].join('\n')
}

// ════════════════════════════════════════════════════════════════
// MODEL PIPELINE PROMPTS
// ════════════════════════════════════════════════════════════════

// STEP 1 — Claude Sonnet: read filings, extract facts.
function buildClaudeExtractionPrompt(ticker: string, domain: string, contextMarkdown: string) {
  return `You are the lead analyst at Sidereus. Read the SEC filings and public context below for ${ticker} (${domain}) and extract a dense, factual evidence pack. Do not write prose for an article yet — extract facts.

Extract, with the source form/date where possible:
1. What the company does, core products, business model, key customers, industry positioning.
2. Technology and engineering details: how the products actually work, the underlying physics/process, manufacturing process steps, performance specifications, the technical moat.
3. Supply chain relationships: named suppliers, manufacturing partners, distribution channels, named end customers, dependencies, bottlenecks.
4. Industry dynamics, competitive landscape, supply-demand trends, technology roadmap, customer adoption signals.
5. Catalysts, risks, anything consensus may be missing, and the factors to monitor — as raw facts (these will be woven into a narrative later, not listed).
6. Cross-reference statements across filings and news; flag confirmed vs. inferred.

Then, on a final line, output exactly:
ARXIV_QUERY: <3-6 technical keywords describing this company's core technology for a research-paper search>

Public context:
${contextMarkdown}`
}

// STEP 2 — GPT-4o Mini: turn facts into diagrams, flowcharts, explainers, tables.
function buildVisualsPrompt(ticker: string, domain: string, factsMarkdown: string) {
  return `You are the technical illustration and diagram layer of Sidereus. Using the extracted facts below for ${ticker}, produce a VISUAL ASSET PACK in markdown. Be technically accurate and educational (university-lecture clarity for non-experts).

Produce these assets, each clearly labelled:

A) TECHNOLOGY DIAGRAMS — 2 to 3 Mermaid diagrams that explain how the core technology works:
   - An engineering / system-architecture diagram (flowchart LR or TB)
   - A manufacturing-process diagram (flowchart showing process steps)
   Use this fence format exactly:
   \`\`\`mermaid
   flowchart LR
       A[Component<br/>detail] --> B[Next stage<br/>detail]
   \`\`\`
   Keep node labels short, use <br/> for line breaks, label edges with the real interface/material.

B) SUPPLY CHAIN FLOWCHART — one rich, multi-branch end-to-end Mermaid map (flowchart LR),
   modelled on a professional analyst's supply-chain map: ${ticker} sits on the left and
   FANS OUT through named intermediaries to many downstream end customers.
   - Use $TICKER notation for public companies (e.g. $NVDA, $AMZN, $MSFT, $GOOGL, $AVGO).
   - Group related paths into labelled subgraph clusters (one per key intermediary/partner),
     each showing that intermediary then its specific downstream customers.
   - Show at least 4-6 distinct parallel branches / customer sets, e.g.
     ${ticker} --> $PARTNER --> {several hyperscalers / OEMs / cloud providers}.
   - Name real companies where known (Microsoft, AWS, Google, Meta, Tencent, Baidu, ByteDance,
     Alibaba, plus integrators/partners specific to ${ticker}'s industry).
   - Highlight ${ticker}'s own nodes with: classDef focal fill:#B5A6D8,stroke:#161310,color:#161310,font-weight:bold;
   Skeleton (replace with the real chain):
   \`\`\`mermaid
   flowchart LR
       classDef focal fill:#B5A6D8,stroke:#161310,color:#161310,font-weight:bold;
       subgraph BM[To Broad Market]
         T1[$TICKER] --> P1[$PARTNER] --> A1[$AMZN]
         P1 --> M1[$MSFT]
         P1 --> G1[$GOOGL]
       end
       subgraph PR[Partner Program]
         T2[$TICKER] --> P2[Integrator] --> C1[Cloud]
       end
       class T1,T2 focal
   \`\`\`

C) TECHNOLOGY EXPLAINERS — 2 short plain-language explainers (3-5 sentences each) of the hardest technical concepts, written so a generalist investor understands them.

D) TABLES — 1-2 GitHub-flavored markdown tables summarizing structured data (e.g. product specs, supply-chain nodes with economics/key players, or competitive comparison).

Rules:
- Mermaid code must be valid (no parentheses inside node text; use <br/> not \\n).
- Do not invent specific financial numbers.
- Output only the asset pack. The diagrams will be embedded verbatim into the final article.

Extracted facts:
${factsMarkdown}`
}

// STEP 3 — Claude Sonnet: write the final institutional article.
function buildFinalPrompt(
  ticker: string,
  domain: string,
  priceFacts: string,
  factsMarkdown: string,
  visualsMarkdown: string,
  arxiv: ContextBundle['arxiv'],
  managementProfiles: ManagementProfile[],
) {
  const arxivBlock = arxiv.length
    ? arxiv.map((p) => `- ${p.title} — ${p.url}`).join('\n')
    : 'No specific papers retrieved; ground technology claims in established engineering principles.'
  const managementBlock = managementProfiles.length
    ? managementProfiles
      .map((m) => `- Role: ${m.role}\n  Candidate: ${m.name}\n  LinkedIn: ${m.linkedinUrl || 'N/A'}\n  Snippet: ${m.snippet || 'N/A'}`)
      .join('\n')
    : 'No LinkedIn snippets were reliably retrieved. If uncertain, state that data is unavailable rather than inventing details.'

  return `You are the lead analyst at Sidereus writing the final institutional research article on ${ticker} (${domain}).

Write in the voice of elite independent buy-side research (Citrini Research, Aleabitoreddit's OSINT supply-chain deep dives, SemiconSam's semiconductor depth): analytical, evidence-driven, thesis-oriented, industry-focused. No marketing language. No bullet-point dumping in the investment section.

FORMATTING (critical):
- Each section title is a level-2 markdown heading: "## Title". The app renders these as bold subtitles.
- Subsection labels inside a section may use a short bold lead-in. Do NOT pepper prose with ** or stray symbols.
- Embed the provided Mermaid diagrams VERBATIM (copy the \`\`\`mermaid ... \`\`\` blocks exactly) into the relevant sections. Do not modify the mermaid code.
- Write full paragraphs with blank lines between paragraphs. Do not hard-wrap every sentence on a separate line.

WRITE EXACTLY THESE SECTIONS, IN ORDER:

## Price / Share
Report the live figures below as a short factual paragraph (current share price and market capitalization). Nothing else — no valuation commentary, no enterprise value.
${priceFacts}

## Company Overview
What the company does, core products, business model, key customers, and industry positioning. Tight and concrete.

## Technology Masterclass
Explain the technology from first principles, like a university lecture. Embed the engineering/system-architecture and manufacturing-process Mermaid diagrams from the visual pack here. Use the technology explainers and tables. Ground claims in engineering principles and, where relevant, the research literature below. Make a generalist genuinely understand how it works.

## Supply Chain Analysis
Embed the end-to-end supply-chain Mermaid flowchart from the visual pack. Walk the chain node by node (upstream suppliers, manufacturing partners, distribution, end customers, dependencies, bottlenecks). For each node explain the economics, the competitive landscape, the key players, and the strategic importance. Use the supply-chain table if provided.

## Investment Analysis
Write as ONE flowing institutional article — NOT a list. Do NOT use separate headings or labels for catalysts, risks, variant perception, or monitoring factors. Integrate all of them naturally into the prose: competitive positioning, industry dynamics, supply-demand trends, technology roadmap, customer adoption, strategic advantages, emerging risks, the variant perception (where you differ from consensus and why), and what to monitor going forward. Evidence-driven and thesis-oriented throughout.

## Management Team
End the report with a management-team section. Cover key executives (CEO, CTO, COO, CFO where applicable), and for each provide a concise profile: education, prior operating experience, and relevance to current strategy. Use the LinkedIn candidate data below plus filing context. If a datapoint is unverified, explicitly label it as "unverified" instead of guessing.

HARD CONSTRAINTS:
- NO financial modeling: do not discuss valuation, price targets, DCF, multiples, margins, or financial forecasts anywhere.
- NO conclusion / summary section. End naturally after the Management Team section.
- Target length: a substantial deep-dive aimed at roughly 1,800-2,800 words so rendered PDF output is typically about 3 pages. Do not be brief.

Research papers for grounding the technology section:
${arxivBlock}

Extracted facts (from the filings):
${factsMarkdown}

Visual asset pack (embed the mermaid diagrams verbatim, use the explainers/tables):
${visualsMarkdown}

LinkedIn management search candidates:
${managementBlock}

Return only the article in markdown.`
}

function buildFastPrompt(
  ticker: string,
  domain: string,
  companyName: string,
  priceFacts: string,
  contextMarkdown: string,
  managementProfiles: ManagementProfile[],
) {
  const managementBlock = managementProfiles.length
    ? managementProfiles
      .map((m) => `- Role: ${m.role}\n  Candidate: ${m.name}\n  LinkedIn: ${m.linkedinUrl || 'N/A'}\n  Snippet: ${m.snippet || 'N/A'}`)
      .join('\n')
    : 'No LinkedIn snippets were reliably retrieved. If uncertain, state that data is unavailable rather than inventing details.'

  return `Write a fast institutional research report on ${companyName} (${ticker}) in the ${domain} domain.

Use the public context below. Prioritize specificity, evidence from filings/news, and a clear investor narrative. Keep the report detailed enough to render to about 3 PDF pages, but concise enough for fast generation.

Formatting rules:
- Return only markdown.
- Use exactly these level-2 headings, in order: Price / Share, Company Overview, Technology Masterclass, Supply Chain Analysis, Investment Analysis, Management Team.
- Put blank lines between paragraphs.
- Include one valid Mermaid flowchart in the Technology Masterclass or Supply Chain Analysis section using this fence format:
\`\`\`mermaid
flowchart LR
  A[Input<br/>short label] --> B[Process<br/>short label]
\`\`\`
- Mermaid node text must not contain parentheses. Use <br/> for line breaks.

Section requirements:
- Price / Share: use only these live facts, no valuation commentary.
${priceFacts}
- Company Overview: business model, products, customers, positioning.
- Technology Masterclass: explain the core technology from first principles for a generalist investor.
- Supply Chain Analysis: map suppliers, manufacturing dependencies, partners, customers, bottlenecks, and who benefits if demand rises.
- Investment Analysis: flowing institutional prose covering catalysts, risks, variant perception, competitive dynamics, and what to monitor. Do not use valuation, DCF, multiples, price targets, or financial forecasts.
- Management Team: end with CEO/CTO/COO/CFO where applicable. Include education and prior experience from the management search candidates below when available; mark uncertain details as "unverified".

Management search candidates:
${managementBlock}

Public context:
${contextMarkdown.slice(0, 14000)}`
}

function fallbackReport(ticker: string, domain: string, priceFacts: string) {
  return `## Price / Share
${priceFacts}

## Company Overview
Sidereus is configured for a multi-model deep dive on ${ticker} (${domain}), but no live LLM provider is available in this environment yet.

## Technology Masterclass
The production pipeline uses Claude Sonnet to read SEC filings (10-K, 10-Q, S-1, 8-K) and extract technology, manufacturing, and supply-chain facts; GPT-4o-mini to render Mermaid diagrams, technology explainers, and tables; then Claude Sonnet to write this institutional article.

## Supply Chain Analysis
Set server-side ANTHROPIC_API_KEY and OPENAI_API_KEY in Vercel environment variables to enable live generation.

## Investment Analysis
Once keys are configured, this section becomes a flowing institutional narrative integrating competitive positioning, industry dynamics, technology roadmap, emerging risks, variant perception, and monitoring factors — with no valuation and no conclusion.

## Management Team
Management-team profiles (CEO/CTO/COO/CFO) are added in live generation with LinkedIn search context when available.
`
}

// ── LLM callers ─────────────────────────────────────────────────
async function callAnthropic(prompt: string, maxTokens: number, timeoutMs = 45000): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.Claude
  if (!apiKey) return null
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      signal: controller.signal,
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: maxTokens,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.content?.map((part: { text?: string }) => part.text || '').join('\n').trim() || null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function callOpenAI(prompt: string, system: string, maxTokens: number, timeoutMs = 45000): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OpenAI
  if (!apiKey) return null
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_MINI_MODEL,
        temperature: 0.2,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data?.choices?.[0]?.message?.content?.trim() || null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function normalizeBackendResponse(data: Record<string, unknown>, ticker: string, domain: string, priceFacts: string) {
  const reportMarkdown =
    typeof data.reportMarkdown === 'string' ? data.reportMarkdown :
    typeof data.report === 'string' ? data.report :
    typeof data.markdown === 'string' ? data.markdown :
    fallbackReport(ticker, domain, priceFacts)

  return {
    status: 'ready',
    ticker,
    domain,
    companyName: typeof data.companyName === 'string' ? data.companyName : ticker,
    reportMarkdown: normalizeReportMarkdown(reportMarkdown),
    sections: REPORT_SECTIONS,
    provider: 'python-backend',
    generatedAt: new Date().toISOString(),
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as GenerateBody
    const ticker = body.ticker?.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, '')
    if (!ticker) return NextResponse.json({ error: 'ticker is required' }, { status: 400 })

    const domain = detectDomain(ticker, body.domain)
    const fastMode = body.fast !== false
    const backendUrl = process.env.BACKEND_API_URL
    const backendSecret = process.env.BACKEND_API_SECRET

    // Collect context up-front so we always have price facts.
    const emptyContext: ContextBundle = { quote: null, news: [], sec: { filings: [] }, arxiv: [] }
    const context = await withTimeout(
      collectContext(ticker, domain, fastMode),
      fastMode ? FAST_CONTEXT_TIMEOUT_MS : 25000,
      emptyContext,
    )
    const priceFacts = priceFactsMarkdown(context.quote)
    const contextMarkdown = contextToMarkdown(context)
    const companyName = context.sec.companyName || String(context.quote?.longName || context.quote?.shortName || ticker)
    const managementProfiles = await withTimeout(
      fetchManagementProfiles(companyName, ticker),
      fastMode ? FAST_MANAGEMENT_TIMEOUT_MS : 9000,
      [] as ManagementProfile[],
    )

    if (fastMode) {
      const prompt = buildFastPrompt(ticker, domain, companyName, priceFacts, contextMarkdown, managementProfiles)
      const fastReport =
        await callOpenAI(
          prompt,
          'You are a fast institutional equity research writer. Return only markdown.',
          6500,
          FAST_MODEL_TIMEOUT_MS,
        ) ||
        await callAnthropic(prompt, 6500, FAST_MODEL_TIMEOUT_MS)

      if (fastReport) {
        return NextResponse.json({
          status: 'ready',
          ticker,
          domain,
          companyName,
          reportMarkdown: normalizeReportMarkdown(fastReport),
          sections: REPORT_SECTIONS,
          provider: 'fast-single-pass',
          generatedAt: new Date().toISOString(),
        })
      }
    }

    // Optional Python backend proxy.
    if (backendUrl) {
      const upstream = await fetch(`${backendUrl}/api/research/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(backendSecret ? { 'X-Internal-Secret': backendSecret } : {}) },
        body: JSON.stringify({ ticker, domain, fast: !!body.fast }),
      })
      if (!upstream.ok) {
        const err = await upstream.text()
        return NextResponse.json({ error: err }, { status: upstream.status })
      }
      const data = await upstream.json()
      return NextResponse.json(normalizeBackendResponse(data, ticker, domain, priceFacts))
    }

    // ── STEP 1: Claude Sonnet reads filings and extracts facts ────
    let factsMarkdown = await callAnthropic(buildClaudeExtractionPrompt(ticker, domain, contextMarkdown), 4096)
    // Fallback: GPT-4o-mini extraction if Claude unavailable.
    if (!factsMarkdown) {
      factsMarkdown = await callOpenAI(
        buildClaudeExtractionPrompt(ticker, domain, contextMarkdown),
        'You extract factual evidence for institutional equity research. Return only markdown.',
        3500,
      )
    }

    // Pull an arXiv query Claude suggested, refine the paper grounding.
    if (factsMarkdown) {
      const q = factsMarkdown.match(/ARXIV_QUERY:\s*(.+)/i)?.[1]?.trim()
      if (q) {
        const refined = await fetchArxiv(q)
        if (refined.length) context.arxiv = refined
      }
    }

    const facts = factsMarkdown || contextMarkdown

    // ── STEP 2: GPT-4o-mini builds diagrams, flowcharts, tables ───
    let visualsMarkdown = await callOpenAI(
      buildVisualsPrompt(ticker, domain, facts),
      'You produce technically accurate Mermaid diagrams, educational explainers, and markdown tables. Return only the asset pack.',
      3500,
    )
    // Fallback: Claude builds visuals if OpenAI unavailable.
    if (!visualsMarkdown) {
      visualsMarkdown = await callAnthropic(buildVisualsPrompt(ticker, domain, facts), 3000)
    }
    const visuals = visualsMarkdown || 'No diagram pack available — describe the technology and supply chain in prose with clear structure.'

    // ── STEP 3: Claude Sonnet writes the final article ────────────
    let finalReport = await callAnthropic(
      buildFinalPrompt(ticker, domain, priceFacts, facts, visuals, context.arxiv, managementProfiles),
      8192,
    )
    // Fallback: GPT-4o-mini writes the final article.
    if (!finalReport) {
      finalReport = await callOpenAI(
        buildFinalPrompt(ticker, domain, priceFacts, facts, visuals, context.arxiv, managementProfiles),
        'You are an institutional equity research analyst. Return only the article in markdown.',
        10000,
      )
    }

    if (finalReport) {
      return NextResponse.json({
        status: 'ready',
        ticker,
        domain,
        companyName,
        reportMarkdown: normalizeReportMarkdown(finalReport),
        sections: REPORT_SECTIONS,
        provider: 'claude-extract+gpt4omini-visuals+claude-narrative',
        generatedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      status: 'demo',
      ticker,
      domain,
      companyName,
      reportMarkdown: fallbackReport(ticker, domain, priceFacts),
      sections: REPORT_SECTIONS,
      provider: 'demo',
      generatedAt: new Date().toISOString(),
      message: 'Set server-side ANTHROPIC_API_KEY and OPENAI_API_KEY to enable the multi-model research pipeline.',
    })
  } catch (err) {
    console.error('[research/generate]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



