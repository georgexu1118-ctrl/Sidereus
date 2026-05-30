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
}

const REPORT_SECTIONS = [
  'Executive Summary',
  'Investment Thesis',
  'Industry Overview',
  'Company Overview',
  'Competitive Positioning',
  'Management Analysis',
  'Financial Analysis',
  'Valuation',
  'Bull Case',
  'Base Case',
  'Bear Case',
  'Catalysts',
  'Risks',
  'Variant Perception',
  'Key Monitoring Indicators',
  'Investment Conclusion',
  'Appendix',
]

const SEC_HEADERS = {
  'User-Agent': process.env.SEC_USER_AGENT || 'Sidereus Research contact@example.com',
  Accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
}

function detectDomain(ticker: string, domain?: string) {
  if (domain) return domain
  const symbol = ticker.toUpperCase()
  if (['NVDA', 'AMD', 'AVGO', 'ASML', 'ARM', 'LITE', 'COHR', 'AXTI', 'SNDK'].includes(symbol)) return 'AI Supply Chain'
  if (['VRT', 'SMCI', 'CRWV', 'EQIX', 'DLR', 'DELL', 'HPE'].includes(symbol)) return 'Data Center Ecosystem'
  if (['MRNA', 'REGN', 'VRTX', 'GILD', 'ALNY', 'ABVX', 'BNTX', 'BIIB'].includes(symbol)) return 'Biotechnology'
  return 'Frontier Technology'
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, cache: 'no-store' })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.json()
}

async function fetchText(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, cache: 'no-store' })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return res.text()
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

async function fetchYahooQuote(ticker: string) {
  try {
    const data = await fetchJson(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ticker)}`)
    return data?.quoteResponse?.result?.[0] || null
  } catch {
    return null
  }
}

async function fetchYahooNews(ticker: string) {
  try {
    const data = await fetchJson(`https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&quotesCount=1&newsCount=8`)
    return (data?.news || []).slice(0, 8)
  } catch {
    return []
  }
}

async function fetchSecContext(ticker: string): Promise<ContextBundle['sec']> {
  try {
    const tickers = await fetchJson('https://www.sec.gov/files/company_tickers.json', { headers: SEC_HEADERS })
    const match = Object.values(tickers as Record<string, { ticker: string; cik_str: number; title: string }>).find(
      (entry) => entry.ticker?.toUpperCase() === ticker
    )

    if (!match) return { filings: [] }

    const cik = String(match.cik_str).padStart(10, '0')
    const submissions = await fetchJson(`https://data.sec.gov/submissions/CIK${cik}.json`, { headers: SEC_HEADERS })
    const recent = submissions?.filings?.recent
    const filings = Array.from({ length: Math.min(recent?.form?.length || 0, 40) })
      .map((_, index) => ({
        form: recent.form[index],
        filingDate: recent.filingDate[index],
        reportDate: recent.reportDate[index],
        accessionNumber: recent.accessionNumber[index],
        primaryDocument: recent.primaryDocument[index],
      }))
      .filter((filing) => ['10-K', '10-Q', '8-K', '20-F', '6-K'].includes(String(filing.form)))
      .slice(0, 8)

    const primary = filings.find((filing) => ['10-K', '10-Q', '20-F'].includes(String(filing.form))) || filings[0]
    let filingExcerpt = ''
    let filingUrl = ''

    if (primary?.accessionNumber && primary?.primaryDocument) {
      const cikNoLeading = String(match.cik_str)
      const accession = String(primary.accessionNumber).replace(/-/g, '')
      filingUrl = `https://www.sec.gov/Archives/edgar/data/${cikNoLeading}/${accession}/${primary.primaryDocument}`
      const filingText = await fetchText(filingUrl, { headers: SEC_HEADERS })
      filingExcerpt = stripHtml(filingText).slice(0, 18000)
    }

    return {
      cik,
      companyName: match.title,
      filings,
      filingExcerpt,
      filingUrl,
    }
  } catch {
    return { filings: [] }
  }
}

async function collectContext(ticker: string): Promise<ContextBundle> {
  const [quote, news, sec] = await Promise.all([
    fetchYahooQuote(ticker),
    fetchYahooNews(ticker),
    fetchSecContext(ticker),
  ])

  return { quote, news, sec }
}

function contextToMarkdown(context: ContextBundle) {
  return [
    '## Market Quote Snapshot',
    JSON.stringify(context.quote, null, 2),
    '',
    '## Recent News Headlines',
    JSON.stringify(context.news, null, 2),
    '',
    '## SEC Filing Metadata',
    JSON.stringify(context.sec.filings, null, 2),
    '',
    context.sec.filingUrl ? `Primary filing URL: ${context.sec.filingUrl}` : '',
    '',
    '## SEC Filing Excerpt',
    context.sec.filingExcerpt || 'No filing excerpt available.',
  ].join('\n')
}

function fallbackReport(ticker: string, domain: string) {
  return `# ${ticker} Institutional Equity Research

## Executive Summary
Sidereus is configured for 5-8 page institutional research, but no live LLM provider is available in the server environment yet.

## Research Standard
The production path collects public market data, recent news, and SEC filing evidence; uses OpenAI gpt-4o-mini for extraction; then uses Claude Sonnet for thesis generation, skeptical analysis, and final report synthesis.

## Domain
${domain}

## Required Next Step
Set ANTHROPIC_API_KEY and OPENAI_API_KEY as server-side Vercel environment variables, then redeploy. Do not expose keys with NEXT_PUBLIC prefixes.`
}

function buildExtractionPrompt(ticker: string, domain: string, contextMarkdown: string) {
  return `You are the OpenAI extraction layer for Sidereus. Extract evidence for an institutional equity research report.

Ticker: ${ticker}
Domain: ${domain}

Use the public context below. Do not invent facts. If a claim is not supported, mark it as "needs verification".

Return markdown with these sections:
1. Filing evidence bullets with source form/date.
2. Earnings and management signals inferred from filings/news.
3. Supply chain / customer / supplier / competitor map where inferable.
4. Financial and valuation inputs available from quote data.
5. Risks and red flags.
6. Evidence gaps the final analyst must not overclaim.

Context:
${contextMarkdown}`
}

function buildFinalPrompt(ticker: string, domain: string, contextMarkdown: string, evidenceMarkdown: string) {
  return `You are the Chief Architect and lead analyst of Sidereus, a world-class institutional equity research platform.

Mission: produce a differentiated, evidence-backed, hedge-fund-quality and sell-side-quality research report.

Ticker: ${ticker}
Domain: ${domain}
Default length: 5-8 pages. Write roughly 3,500-5,500 words in markdown. Do not be brief.

Core rule:
The objective is not information retrieval. The objective is differentiated investment insight.

Use the public evidence packet and context below. Anchor claims to filings, market data, or news where available. If evidence is incomplete, state the limitation instead of hallucinating. Give a price target at the end.

Required sections:
${REPORT_SECTIONS.map((section) => `- ${section}`).join('\n')}

Analytical requirements:
- Executive Summary must include rating stance, key controversy, and price target.
- Investment Thesis must be variant-perception driven.
- Valuation must include bull/base/bear framework, key assumptions, and expected return vs current price when current price is available.
- Skeptical Analyst Engine must attack the thesis and identify invalidation triggers.
- Risks must separate thesis-breaking risks from ordinary volatility.
- For AI supply chain / semiconductors / data center companies, map customers, suppliers, competitors, revenue exposure, product dependencies, manufacturing dependencies, geographic risks, and second-order beneficiaries.
- For biotechnology companies, analyze mechanism, trial design, endpoints, regulatory pathway, probability of success, TAM, pipeline economics, DCF/rNPV framing, and standard of care.
- Appendix must include an evidence log and "items requiring further diligence".

OpenAI evidence extraction:
${evidenceMarkdown}

Raw public context:
${contextMarkdown}

Return only markdown.`
}

async function callOpenAIExtraction(ticker: string, domain: string, contextMarkdown: string) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OpenAI
  if (!apiKey) return ''

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: 3500,
      messages: [
        { role: 'system', content: 'You extract evidence for institutional equity research. Return only markdown.' },
        { role: 'user', content: buildExtractionPrompt(ticker, domain, contextMarkdown) },
      ],
    }),
  })

  if (!res.ok) return ''
  const data = await res.json()
  return data?.choices?.[0]?.message?.content?.trim() || ''
}

async function callAnthropicFinal(ticker: string, domain: string, contextMarkdown: string, evidenceMarkdown: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.Claude
  if (!apiKey) return null

  const model = process.env.ANTHROPIC_MODEL || process.env.ANTHROPIC_FAST_MODEL || 'claude-3-5-sonnet-latest'
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      temperature: 0.35,
      messages: [{ role: 'user', content: buildFinalPrompt(ticker, domain, contextMarkdown, evidenceMarkdown) }],
    }),
  })

  if (!res.ok) return null
  const data = await res.json()
  const text = data?.content?.map((part: { text?: string }) => part.text || '').join('\n').trim()
  return text || null
}

async function callOpenAIFinal(ticker: string, domain: string, contextMarkdown: string, evidenceMarkdown: string) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OpenAI
  if (!apiKey) return null

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      max_tokens: 10000,
      messages: [
        { role: 'system', content: 'You are an institutional equity research analyst. Return only markdown.' },
        { role: 'user', content: buildFinalPrompt(ticker, domain, contextMarkdown, evidenceMarkdown) },
      ],
    }),
  })

  if (!res.ok) return null
  const data = await res.json()
  return data?.choices?.[0]?.message?.content?.trim() || null
}

function normalizeBackendResponse(data: Record<string, unknown>, ticker: string, domain: string) {
  const reportMarkdown =
    typeof data.reportMarkdown === 'string' ? data.reportMarkdown :
    typeof data.report === 'string' ? data.report :
    typeof data.markdown === 'string' ? data.markdown :
    fallbackReport(ticker, domain)

  return {
    status: 'ready',
    ticker,
    domain,
    companyName: typeof data.companyName === 'string' ? data.companyName : ticker,
    reportMarkdown,
    sections: REPORT_SECTIONS,
    provider: 'python-backend',
    generatedAt: new Date().toISOString(),
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as GenerateBody
    const ticker = body.ticker?.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, '')

    if (!ticker) {
      return NextResponse.json({ error: 'ticker is required' }, { status: 400 })
    }

    const domain = detectDomain(ticker, body.domain)
    const backendUrl = process.env.BACKEND_API_URL
    const backendSecret = process.env.BACKEND_API_SECRET

    if (backendUrl) {
      const upstream = await fetch(`${backendUrl}/api/research/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(backendSecret ? { 'X-Internal-Secret': backendSecret } : {}),
        },
        body: JSON.stringify({ ticker, domain, fast: !!body.fast, targetLength: '5-8 pages' }),
      })

      if (!upstream.ok) {
        const err = await upstream.text()
        return NextResponse.json({ error: err }, { status: upstream.status })
      }

      const data = await upstream.json()
      return NextResponse.json(normalizeBackendResponse(data, ticker, domain))
    }

    const context = await collectContext(ticker)
    const contextMarkdown = contextToMarkdown(context)
    const evidenceMarkdown = await callOpenAIExtraction(ticker, domain, contextMarkdown)
    const finalReport =
      await callAnthropicFinal(ticker, domain, contextMarkdown, evidenceMarkdown) ||
      await callOpenAIFinal(ticker, domain, contextMarkdown, evidenceMarkdown)

    if (finalReport) {
      return NextResponse.json({
        status: 'ready',
        ticker,
        domain,
        companyName: context.sec.companyName || String(context.quote?.longName || context.quote?.shortName || ticker),
        reportMarkdown: finalReport,
        sections: REPORT_SECTIONS,
        provider: evidenceMarkdown ? 'openai-extraction-anthropic-final' : 'llm-final',
        generatedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      status: 'demo',
      ticker,
      domain,
      companyName: context.sec.companyName || ticker,
      reportMarkdown: fallbackReport(ticker, domain),
      sections: REPORT_SECTIONS,
      provider: 'demo',
      generatedAt: new Date().toISOString(),
      message: 'Set server-side ANTHROPIC_API_KEY and OPENAI_API_KEY to enable 5-8 page live research generation.',
    })
  } catch (err) {
    console.error('[research/generate]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
