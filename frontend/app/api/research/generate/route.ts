import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300

type GenerateBody = {
  ticker: string
  domain?: string
  fast?: boolean
}

type ProductImage = { url: string; name: string }
type ProductData = { images: ProductImage[]; pageText: string }
const EMPTY_PRODUCTS: ProductData = { images: [], pageText: '' }

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
  'Key Market Data',
  'Company Overview',
  'Technology Breakdown',
  'Product Breakdown',
  'Supply Chain Analysis',
  'Investment Analysis',
]

const SEC_HEADERS = {
  'User-Agent': process.env.SEC_USER_AGENT || 'Sidereus Research contact@example.com',
  Accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
}

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || process.env.ANTHROPIC_FAST_MODEL || 'claude-3-5-sonnet-latest'
const OPENAI_MINI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const FAST_CONTEXT_TIMEOUT_MS = 5000
const FAST_MODEL_TIMEOUT_MS = 21000

// European exchange ticker map: bare ticker → Yahoo Finance symbol with exchange suffix.
// Add entries here as new European securities are covered.
const EU_TICKER_MAP: Record<string, string> = {
  'XFAB':    'XFAB.BR',   // X-Fab Silicon Foundries — Euronext Brussels
  'SOITEC':  'SOI.PA',    // Soitec — Euronext Paris
  'BESI':    'BESI.AS',   // BE Semiconductor Industries — Euronext Amsterdam
  'AIXA':    'AIXA.DE',   // Aixtron — XETRA Frankfurt
  'IFX':     'IFX.DE',    // Infineon Technologies — XETRA Frankfurt
  'STM':     'STMEF',     // STMicroelectronics — NYSE ADR (already US-listed)
  'SIVE':    'SIVE.MC',   // Try Euronext/BME Madrid
  'AMS':     'AMS.SW',    // ams OSRAM — SIX Swiss Exchange
  'COMET':   'COTN.SW',   // Comet Holding — SIX Swiss Exchange
  'DISCO':   'DISCO.PA',  // Disco Corporation (EU-listed)
}

// European currency codes — used to detect when a company is European-listed
const EU_CURRENCIES = new Set(['EUR', 'GBP', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF'])

function detectDomain(ticker: string, domain?: string) {
  if (domain) return domain
  const symbol = ticker.toUpperCase().split('.')[0]  // strip exchange suffix for matching
  if (['NVDA', 'AMD', 'AVGO', 'ASML', 'ARM', 'LITE', 'COHR', 'AXTI', 'SNDK', 'AAOI', 'MRVL', 'MU'].includes(symbol)) return 'AI Supply Chain'
  if (['VRT', 'SMCI', 'CRWV', 'EQIX', 'DLR', 'DELL', 'HPE'].includes(symbol)) return 'Data Center Ecosystem'
  if (['MRNA', 'REGN', 'VRTX', 'GILD', 'ALNY', 'ABVX', 'BNTX', 'BIIB'].includes(symbol)) return 'Biotechnology'
  // European specialty semiconductors: analog/mixed-signal, MEMS, SiC, power
  if (['XFAB', 'AIXA', 'IFX', 'BESI', 'SOITEC', 'AMS', 'COMET'].includes(symbol)) return 'Specialty Semiconductors'
  return 'Frontier Technology'
}

// Resolve a bare ticker to its Yahoo Finance symbol (tries EU exchange suffix if needed).
// Returns the resolved ticker and whether it was remapped to a European exchange.
async function resolveYahooTicker(ticker: string): Promise<{ yTicker: string; isEuMapped: boolean }> {
  // Already has an exchange suffix — use as-is
  if (ticker.includes('.')) return { yTicker: ticker, isEuMapped: true }
  // Known European mapping
  if (EU_TICKER_MAP[ticker]) return { yTicker: EU_TICKER_MAP[ticker], isEuMapped: true }
  return { yTicker: ticker, isEuMapped: false }
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
  const normalizedHeadings = markdown
    .replace(/##\s*Price\s*\/\s*Share/gi, '## Key Market Data')
    .replace(/##\s*Technology\s+Masterclass/gi, '## Technology Breakdown')
    .replace(/##\s*Management\s+Team[\s\S]*$/gi, '')
  const parts = normalizedHeadings.split(/(```[\s\S]*?```|\$\$[\s\S]*?\$\$)/g)
  const normalized = parts.map((part) => {
    if (part.startsWith('```') || part.startsWith('$$')) return part
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

// Scrape product images from the company's own website.
// Scoring approach: every img tag is a candidate; URL path + alt text
// determine relevance. This catches sites like ao-inc.com whose images
// live at /assets/product-images/ but aren't inside a class="product…" div.
// IR-page redirects (e.g. axt.com → investors.axt.com) are detected via
// the final response URL and skipped so only real product sites are scraped.
async function fetchProductData(ticker: string): Promise<ProductData> {
  let website: string | null = null
  try {
    const auth = await getYahooCrumb()
    const profileUrl = auth
      ? `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=assetProfile&crumb=${encodeURIComponent(auth.crumb)}`
      : `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=assetProfile`
    const headers: Record<string, string> = { 'User-Agent': YF_UA }
    if (auth) headers['Cookie'] = auth.cookie
    const data = await fetchJson(profileUrl, { headers }, 5000)
    website = data?.quoteSummary?.result?.[0]?.assetProfile?.website ?? null
  } catch {
    return EMPTY_PRODUCTS
  }
  if (!website) return EMPTY_PRODUCTS

  let baseOrigin: string
  try {
    baseOrigin = new URL(website.startsWith('http') ? website : `https://${website}`).origin
  } catch {
    return EMPTY_PRODUCTS
  }

  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
  const seen = new Set<string>()
  const candidates: Array<{ url: string; name: string; score: number }> = []
  let pageText = ''

  // URL/alt text patterns that raise or lower relevance score
  const positive = /product|item|solution|technology|model|device|component|substrate|wafer|crystal|laser|transceiver|module|chip|circuit|photo|feature|gallery|catalog|goods|hardware|element|image-content/i
  const negative = /logo|icon|sprite|banner|arrow|button|flag|avatar|placeholder|blank|spacer|pixel|tracking|analytics|badge|social|share|q4cdn|favicon|spinner|separator/i

  const extractFromHtml = (html: string, resolvedBase: string) => {
    // og:image / twitter:image — highest confidence
    for (const pat of [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"'>]+)["']/i,
      /<meta[^>]+content=["']([^"'>]+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image(?::[^"']+)?["'][^>]+content=["']([^"'>]+)["']/i,
      /<meta[^>]+content=["']([^"'>]+)["'][^>]+name=["']twitter:image/i,
    ]) {
      const m = html.match(pat)
      if (!m?.[1]) continue
      const raw = m[1].trim()
      const url = raw.startsWith('http') ? raw : raw.startsWith('//') ? `https:${raw}` : `${resolvedBase}${raw.startsWith('/') ? '' : '/'}${raw}`
      if (!seen.has(url) && /\.(jpg|jpeg|png|webp)/i.test(url) && !negative.test(url)) {
        seen.add(url)
        candidates.push({ url, name: 'Product', score: 5 })
      }
    }

    // Score every img by URL path relevance — catches product images
    // regardless of which CSS class their container uses.
    const imgRe = /<img[^>]+(?:(?:src|data-src|data-lazy-src)=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"'"]*)["'][^>]*(?:alt=["']([^"']*)["'])?|alt=["']([^"']*)["'][^>]*(?:src|data-src|data-lazy-src)=["']([^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["'])/gi
    let m: RegExpExecArray | null
    while ((m = imgRe.exec(html)) !== null) {
      const src = (m[1] || m[4] || '').trim()
      const alt = (m[2] || m[3] || '').trim()
      if (!src || negative.test(src + ' ' + alt)) continue
      const url = src.startsWith('http') ? src : src.startsWith('//') ? `https:${src}` : `${resolvedBase}${src.startsWith('/') ? '' : '/'}${src}`
      if (seen.has(url)) continue
      seen.add(url)
      let score = 0
      if (positive.test(src)) score += 3
      if (positive.test(alt)) score += 2
      if (alt && !negative.test(alt)) score += 1
      if (score > 0) candidates.push({ url, name: alt || 'Product', score })
    }
  }

  const fetchAndExtract = async (pageUrl: string) => {
    try {
      const res = await fetchWithTimeout(pageUrl, {
        headers: { 'User-Agent': ua, Accept: 'text/html', 'Accept-Language': 'en-US,en;q=0.9' },
      }, 5000)
      if (!res.ok) return
      const finalUrl = res.url  // actual URL after any redirects
      // Skip if we were redirected to an investor-relations page —
      // those contain only logos/icons, not product photography.
      if (finalUrl !== pageUrl && /investor|\.q4cdn\.|ir\./i.test(finalUrl)) return
      const html = await res.text()
      let resolvedBase: string
      try { resolvedBase = new URL(finalUrl).origin } catch { resolvedBase = baseOrigin }
      extractFromHtml(html, resolvedBase)
      if (!pageText) pageText = stripHtml(html).slice(0, 3000)
    } catch { /* ignore */ }
  }

  await fetchAndExtract(baseOrigin)
  if (candidates.length < 4) {
    for (const path of [
      '/products', '/en-us/products', '/solutions', '/technologies', '/en/products', '/products-services',
      // European company paths
      '/en/solutions', '/en-gb/products', '/de/produkte', '/fr/produits',
      '/our-products', '/portfolio', '/product-portfolio', '/applications',
    ]) {
      if (candidates.length >= 8) break
      await fetchAndExtract(baseOrigin + path)
    }
  }

  const top = candidates.sort((a, b) => b.score - a.score).slice(0, 6)
  return { images: top.map(({ url, name }) => ({ url, name })), pageText: pageText.slice(0, 3000) }
}

function currencySymbol(currency: string): string {
  switch (currency) {
    case 'EUR': return '€'
    case 'GBP': return '£'
    case 'CHF': return 'CHF '
    case 'SEK': return 'kr '
    case 'NOK': return 'kr '
    case 'DKK': return 'kr '
    default: return '$'
  }
}

function fmtMoney(value: unknown, currency = 'USD'): string {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n === 0) return 'N/A'
  const sym = currencySymbol(currency)
  if (Math.abs(n) >= 1e12) return `${sym}${(n / 1e12).toFixed(2)}T`
  if (Math.abs(n) >= 1e9) return `${sym}${(n / 1e9).toFixed(2)}B`
  if (Math.abs(n) >= 1e6) return `${sym}${(n / 1e6).toFixed(2)}M`
  return `${sym}${n.toFixed(2)}`
}

function priceFactsMarkdown(quote: Record<string, unknown> | null): string {
  if (!quote) return 'Live price data unavailable from Yahoo Finance at generation time.'
  const price = quote.regularMarketPrice
  const currency = (quote.currency as string) || 'USD'
  const sym = currencySymbol(currency)
  const marketCap = quote.marketCap
  const change = quote.regularMarketChangePercent
  const lines = [
    `- Current share price: ${typeof price === 'number' ? `${sym}${price.toFixed(2)} ${currency}` : 'N/A'}`,
    typeof change === 'number' ? `- Day change: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%` : '',
    `- Market capitalization: ${fmtMoney(marketCap, currency)}`,
    `- 52-week range: ${quote.fiftyTwoWeekLow ? `${sym}${quote.fiftyTwoWeekLow}` : 'N/A'} – ${quote.fiftyTwoWeekHigh ? `${sym}${quote.fiftyTwoWeekHigh}` : 'N/A'}`,
  ].filter(Boolean)
  return lines.join('\n')
}

// ── arXiv: ground the Technology Breakdown in research papers ──
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
function buildClaudeExtractionPrompt(ticker: string, domain: string, contextMarkdown: string, isEuropean: boolean) {
  const euNote = isEuropean ? `
IMPORTANT — EUROPEAN COMPANY: ${ticker} is traded on a European exchange and does NOT file with the US SEC. No SEC filings will be in the context. Compensate by:
- Drawing on the news headlines, company website text, and any available financial data exhaustively.
- Leveraging your knowledge of European semiconductor/technology companies, their customers (Bosch, Continental, STMicroelectronics, Volkswagen Group, Siemens, ASML, Infineon, Renault, Airbus, Safran, etc.), and European industry dynamics (EU Chips Act, automotive electrification, industrial IoT, SiC power devices, MEMS sensors).
- Being more expansive on technology fundamentals and industry context since regulatory filing data is unavailable.
- Distinguishing what is confirmed from public sources vs. inferred from domain knowledge.
` : ''

  return `You are the lead analyst at Sidereus. Read the context below for ${ticker} (${domain}) and extract a dense, factual evidence pack. Do not write prose for an article yet — extract facts.
${euNote}
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

function productBlock(products: ProductData): string {
  if (!products.images.length) return ''
  return [
    '',
    'PRODUCT IMAGES (scraped from the company website — copy these URLs verbatim into the product-grid block):',
    ...products.images.map((img, i) => `  ${i + 1}. ${img.url}  [${img.name}]`),
    '',
    'PRODUCT PAGE TEXT (use this to write product descriptions):',
    products.pageText.slice(0, 1500),
  ].join('\n')
}

// STEP 2 — GPT-4o Mini: turn facts into diagrams, flowcharts, explainers, tables.
function buildVisualsPrompt(ticker: string, domain: string, factsMarkdown: string, isEuropean = false) {
  const euSupplyChainNote = isEuropean ? `
   EUROPEAN SUPPLY CHAIN: ${ticker} is a European company. Name real European and global companies in the supply chain: Bosch, Continental, Volkswagen Group, BMW, Daimler, Siemens, Infineon, STMicroelectronics, NXP, Renesas, Texas Instruments (as competitor/customer), ON Semiconductor, Wolfspeed, ROHM, Mitsubishi Electric, Fuji Electric, Denso, Panasonic, Airbus, Safran, ABB, Schneider Electric, as appropriate to ${ticker}'s actual markets.
   For upstream suppliers include European specialty chemical and substrate suppliers where relevant.
` : ''
  return `You are the technical illustration and academic apparatus layer of Sidereus. Using the extracted facts below for ${ticker}, produce a VISUAL ASSET PACK in markdown. Be technically accurate, visually rich, and educational with the rigor of a graduate-level technical appendix.

Produce these assets, each clearly labelled:

A) TECHNOLOGY DIAGRAMS - 3 Mermaid diagrams that explain how the core technology works:
   - An engineering / system-architecture diagram (flowchart LR or TB)
   - A manufacturing-process diagram (flowchart showing process steps)
   - A mechanism sketch / physics sketch / molecular-pathway sketch, depending on the company domain
   Use this fence format exactly:
   \`\`\`mermaid
   flowchart LR
       A[Component<br/>detail] --> B[Next stage<br/>detail]
   \`\`\`
   Keep node labels short, use <br/> for line breaks, label edges with the real interface/material. Add color classDef rules for at least three node classes (focal, dependency, customer or biology/compute/material) so the diagrams resemble polished academic figures.

B) SUPPLY CHAIN FLOWCHART - one rich, multi-branch end-to-end Mermaid map (flowchart LR),
   modelled on a professional analyst's supply-chain map: ${ticker} sits on the left and
   FANS OUT through named intermediaries to many downstream end customers.
   - Keep the diagram compact: 3-4 branches, 8-12 total nodes, labels ≤3 words. Must fit within half a printed PDF page.
   - Use $TICKER notation for public companies (e.g. $NVDA, $AMZN, $MSFT, $GOOGL, $AVGO).
   - Group related paths into labelled subgraph clusters (one per key intermediary/partner),
     each showing that intermediary then its specific downstream customers.
   - Show 3-4 distinct parallel branches / customer sets, e.g.
     ${ticker} --> $PARTNER --> {several hyperscalers / OEMs / cloud providers}.
   - Name real companies where known (Microsoft, AWS, Google, Meta, Tencent, Baidu, ByteDance,
     Alibaba, plus integrators/partners specific to ${ticker}'s industry).${euSupplyChainNote}
   - Highlight ${ticker}'s own nodes with: classDef focal fill:#B5A6D8,stroke:#161310,color:#161310,font-weight:bold;
   Skeleton (replace with the real chain):
   \`\`\`mermaid
   flowchart LR
       classDef focal fill:#B5A6D8,stroke:#161310,color:#161310,font-weight:bold;
       classDef dependency fill:#D9E8F5,stroke:#315C7A,color:#10202A;
       classDef customer fill:#F8D7A6,stroke:#946B22,color:#221609;
       subgraph BM[To Broad Market]
         T1[$TICKER] --> P1[$PARTNER] --> A1[$AMZN]
         P1 --> M1[$MSFT]
         P1 --> G1[$GOOGL]
       end
       subgraph PR[Partner Program]
         T2[$TICKER] --> P2[Integrator] --> C1[Cloud]
       end
       class T1,T2 focal
       class P1,P2 dependency
       class A1,M1,G1,C1 customer
   \`\`\`

C) MATHEMATICAL APPARATUS - 3 display equations in LaTeX using $$...$$ blocks, each followed by a 2-4 sentence explanation. Make them domain-specific and technically advanced:
   - Semiconductors / AI infrastructure: use first-principles models such as Arrhenius process kinetics, Gibbs-Thomson / concentration-gradient crystal growth, defect-density integrals, yield with defect clustering, thermal resistance networks, bandwidth-latency-power tradeoffs, or cost-per-compute decompositions.
   - Biotechnology: use models such as dose-response / Emax, PK/PD exposure curves, trial power, hazard ratios, Bayesian probability of success, or risk-adjusted NPV mechanics without giving a price target.
   - Data center / infrastructure: use models such as utilization under queueing constraints, bisection bandwidth, PUE-adjusted energy intensity, capacity expansion under power limits, or thermal load equations.
   Do not use elementary ratio formulas such as Throughput = Total Output / Total Time or Yield = Good Units / Total Units. Use symbolic, multi-variable equations with real analytical content. Define every variable.

D) TECHNOLOGY EXPLAINERS - 3 plain-language explainers (4-6 sentences each) of the hardest technical concepts, written so a generalist investor understands them.

E) FIGURE CAPTIONS - after each Mermaid diagram, add an italic caption beginning with "Figure:" that explains what the figure shows and why it matters to investors.

F) TABLES - 1-2 GitHub-flavored markdown tables summarizing structured data (e.g. product specs, supply-chain nodes with economics/key players, or competitive comparison).

Rules:
- Mermaid code must be valid (no parentheses inside node text; use <br/> not \\n).
- Mermaid node labels must not contain parentheses. Use commas or <br/> instead.
- Equations must use standard LaTeX inside $$...$$ blocks and should render with KaTeX. Put exactly one equation per display block; do not repeat the same formula as both text and math inside the block.
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
  products: ProductData,
  isEuropean = false,
) {
  const arxivBlock = arxiv.length
    ? arxiv.map((p) => `- ${p.title} — ${p.url}`).join('\n')
    : 'No specific papers retrieved; ground technology claims in established engineering principles.'

  const euNote = isEuropean ? `
EUROPEAN COMPANY CONTEXT: ${ticker} is listed on a European exchange. No US SEC filings are available. To compensate:
- Be more expansive and detailed in every section; write richer, longer paragraphs.
- Reference European market context throughout: EU Chips Act / European Chips Act 2030 targets, European automotive electrification (Bosch, Continental, Valeo, Volkswagen Group, BMW, Mercedes-Benz, Stellantis, Renault), European industrial automation (Siemens, ABB, Schneider Electric), European aerospace and defense (Airbus, Safran, Leonardo, MBDA), and European supply chain resilience policy.
- In the Supply Chain Analysis, name the actual European and global companies in the supply chain — do not use generic placeholders.
- In the Investment Analysis, discuss European equity market context: European small/mid-cap liquidity, analyst coverage depth vs. US peers, EUR/USD currency exposure, European regulatory environment (REACH, EU Taxonomy, export controls), and any cross-listing or ADR considerations.
` : ''

  const wordTarget = isEuropean
    ? '3,000-4,500 words so the rendered PDF is 4-7 pages. European companies with limited public filing data benefit from deeper industry and technology context — write thoroughly and do not cut short.'
    : '2,200-3,500 words so the rendered PDF is 3-6 pages. Do not pad — stop when the content is complete.'

  return `You are the lead analyst at Sidereus writing the final institutional research article on ${ticker} (${domain}).
${euNote}
Write in the voice of elite independent buy-side research (Citrini Research, Aleabitoreddit's OSINT supply-chain deep dives, SemiconSam's semiconductor depth): analytical, evidence-driven, thesis-oriented, industry-focused. Only the Technology Breakdown section should use a more academic paper style with equations, figure captions, and technical exposition. No marketing language. No bullet-point dumping in the investment section.

FORMATTING (critical):
- Each section title is a level-2 markdown heading: "## Title"; section titles must render as bold.
- Subsection labels inside a section may use a short bold lead-in. Do NOT pepper prose with ** or stray symbols.
- Embed the provided Mermaid diagrams VERBATIM (copy the \`\`\`mermaid ... \`\`\` blocks exactly) into the relevant sections. Do not modify the mermaid code.
- In Technology Breakdown only, use an academic-paper style: dense explanatory paragraphs, display equations in $$...$$ blocks, figure captions, and careful technical definitions.
- Use advanced equations, not elementary operational ratios. Prefer symbolic, multi-variable models tied to the company's real technology: crystal-growth kinetics, defect-density / yield models, thermal transport, network bandwidth and latency, pharmacokinetics, trial statistics, or queueing / power-constrained capacity. Avoid simple formulas such as Throughput = Total Output / Total Time.
- Explain every variable immediately after each equation and state why the equation matters for the company's technology or economics. Put exactly one equation in each $$...$$ block.
- Write full paragraphs with blank lines between paragraphs. Do not hard-wrap every sentence on a separate line.
- Leave one empty line between subsections and paragraphs.

WRITE EXACTLY THESE SECTIONS, IN ORDER:

## Key Market Data
Report the live figures below as a short factual paragraph (current share price and market capitalization). Nothing else - no valuation commentary, no enterprise value.
${priceFacts}

## Company Overview
What the company does, core products, business model, key customers, and industry positioning. Keep this tight enough to fit with Key Market Data on the title page of a PDF.

## Technology Breakdown
This is the only academic-style section and it must be the deepest part of the report. Write it like a technical paper section for a generalist investor: at least 2 rendered PDF pages, with first-principles explanation, clearly defined mechanisms, display equations, figure captions, and evidence-grounded claims. Embed the engineering/system-architecture, manufacturing-process, and mechanism-sketch Mermaid diagrams from the visual pack here. Use the technology explainers, equations, and tables. Ground claims in engineering principles and, where relevant, the research literature below. Make a generalist genuinely understand how it works.

## Product Breakdown
${products.images.length > 0
  ? `Present the company's key products as a visual grid. Write a sharp 10-15 word investor-focused description for each product (what it does, why it matters commercially). Output exactly this code fence — no other prose in this section:
\`\`\`product-grid
[
  {"url": "EXACT_URL_FROM_LIST", "name": "Product Name", "description": "10-15 word investor-focused description"}
]
\`\`\`
Include 3-5 products. Copy image URLs VERBATIM from PRODUCT IMAGES below.`
  : 'OMIT THIS SECTION ENTIRELY — no product images were fetched. Do not output the "## Product Breakdown" heading or any content for it.'}

## Supply Chain Analysis
Embed the end-to-end supply-chain Mermaid flowchart from the visual pack. Walk the chain node by node (upstream suppliers, manufacturing partners, distribution, end customers, dependencies, bottlenecks). For each node explain the economics, the competitive landscape, the key players, and the strategic importance. Use the supply-chain table if provided.

## Investment Analysis
Write as ONE flowing institutional article — NOT a list. Do NOT use separate headings or labels for catalysts, risks, variant perception, or monitoring factors. Integrate all of them naturally into the prose: competitive positioning, industry dynamics, supply-demand trends, technology roadmap, customer adoption, strategic advantages, emerging risks, the variant perception (where you differ from consensus and why), and what to monitor going forward. Evidence-driven and thesis-oriented throughout.

HARD CONSTRAINTS:
- NO financial modeling: do not discuss valuation, price targets, DCF, multiples, margins, or financial forecasts anywhere.
- NO management-team section.
- NO conclusion / summary section. End naturally after the Investment Analysis section.
- Target length: ${wordTarget}
- CRITICAL: every Mermaid flowchart must fit within half a printed PDF page. Keep diagrams compact: 6-12 nodes maximum, short labels (≤3 words), 2-4 branches. Never produce a diagram so large it would overflow one page.

Research papers for grounding the technology section:
${arxivBlock}

Extracted facts (from the filings):
${factsMarkdown}

Visual asset pack (embed the mermaid diagrams verbatim, use the explainers/tables):
${visualsMarkdown}
${productBlock(products)}
Return only the article in markdown.`
}

function buildFastPrompt(
  ticker: string,
  domain: string,
  companyName: string,
  priceFacts: string,
  contextMarkdown: string,
  products: ProductData,
  isEuropean = false,
) {
  const euNote = isEuropean ? `
IMPORTANT — EUROPEAN COMPANY: ${companyName} (${ticker}) is listed on a European exchange. US SEC filings are NOT available. To compensate:
- Draw on the news, website context, and your knowledge of this company and its European market extensively.
- Reference European market dynamics: EU Chips Act, automotive electrification, industrial IoT, European defense/aerospace, European supply chain sovereignty.
- Name real European and global companies in the supply chain (Bosch, Continental, Siemens, Infineon, STMicro, NXP, Airbus, ABB, Renault, BMW, etc.) as appropriate to ${ticker}'s actual markets.
- In the Investment Analysis, discuss European equity market context: European small/mid-cap dynamics, analyst coverage, EUR/USD exposure, and European regulatory environment.
- Write more expansively than you would for a US company with full SEC filing disclosure.
` : ''

  const wordTarget = isEuropean
    ? '3,000-4,500 words (4-7 PDF pages). Write thoroughly — European companies with limited public filing data benefit from deeper industry and technology context.'
    : '2,200-3,500 words so the rendered PDF is 3-6 pages. Do not pad — stop when content is complete.'

  return `Write a fast institutional research report on ${companyName} (${ticker}) in the ${domain} domain.
${euNote}
Use the public context below. Prioritize specificity, evidence from filings/news, and a clear investor narrative.

Formatting rules:
- Return only markdown.
- Use exactly these level-2 headings, in order: Key Market Data, Company Overview, Technology Breakdown, Product Breakdown, Supply Chain Analysis, Investment Analysis.
- Put one empty line between paragraphs and subsections.
- Make section titles bold by using level-2 markdown headings.
- Keep Key Market Data and Company Overview concise enough to fit together on the PDF title page. Begin the deep-dive content with Technology Breakdown after those two sections.
- Include one valid Mermaid flowchart in the Technology Breakdown or Supply Chain Analysis section using this fence format:
\`\`\`mermaid
flowchart LR
  A[Input<br/>short label] --> B[Process<br/>short label]
\`\`\`
- Mermaid node text must not contain parentheses. Use <br/> for line breaks.

Section requirements:
- Key Market Data: use only these live facts, no valuation commentary.
${priceFacts}
- Company Overview: business model, products, customers, positioning. Keep it compact and concrete.
- Technology Breakdown: this is the only academic-style section. Make it the deepest part of the report, at least 2 rendered PDF pages, with first-principles explanation, one colored Mermaid sketch or graph, 2-3 advanced display equations in $$...$$ blocks, figure captions, and explanations of every variable. Use multi-variable equations tied to the actual technology: crystal-growth kinetics, defect-density / yield models, thermal transport, network bandwidth and latency, pharmacokinetics, trial statistics, or queueing / power-constrained capacity. Do not use elementary ratio formulas such as Throughput = Total Output / Total Time or Yield = Good Units / Total Units.
- Product Breakdown: ${products.images.length > 0
  ? `output ONLY this code fence — no other prose:
\`\`\`product-grid
[{"url": "EXACT_URL", "name": "Product Name", "description": "10-15 word investor description"}]
\`\`\`
Use 3-5 products. Copy image URLs verbatim from PRODUCT IMAGES below.`
  : 'OMIT THIS SECTION ENTIRELY — no images available. Do not output the heading or any content.'}
- Supply Chain Analysis: map suppliers, manufacturing dependencies, partners, customers, bottlenecks, and who benefits if demand rises. Name real companies.
- Investment Analysis: flowing institutional prose covering catalysts, risks, variant perception, competitive dynamics, and what to monitor. Do not use valuation, DCF, multiples, price targets, or financial forecasts.
- Do not include a management-team section.
- Target length: ${wordTarget}
- Keep academic style concentrated in Technology Breakdown; all other sections tight and evidence-driven.
- CRITICAL: every Mermaid flowchart must fit within half a printed PDF page. Keep diagrams compact: 6-12 nodes maximum, short labels (≤3 words), 2-4 branches.
${productBlock(products)}
Public context:
${contextMarkdown.slice(0, 14000)}`
}

function fallbackReport(ticker: string, domain: string, priceFacts: string) {
  return `## Key Market Data
${priceFacts}

## Company Overview
Sidereus is configured for a multi-model deep dive on ${ticker} (${domain}), but no live LLM provider is available in this environment yet.

## Technology Breakdown
The production pipeline uses Claude Sonnet to read SEC filings (10-K, 10-Q, S-1, 8-K) and extract technology, manufacturing, and supply-chain facts; GPT-4o-mini to render Mermaid diagrams, technology explainers, and tables; then Claude Sonnet to write this institutional article.

## Supply Chain Analysis
Set server-side ANTHROPIC_API_KEY and OPENAI_API_KEY in Vercel environment variables to enable live generation.

## Investment Analysis
Once keys are configured, this section becomes a flowing institutional narrative integrating competitive positioning, industry dynamics, technology roadmap, emerging risks, variant perception, and monitoring factors — with no valuation and no conclusion.

`
}

// ── LLM callers ─────────────────────────────────────────────────
async function callAnthropic(prompt: string, maxTokens: number, timeoutMs = 45000): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.Claude
  if (!apiKey) {
    console.warn('[sidereus] callAnthropic: no API key (checked ANTHROPIC_API_KEY, Claude)')
    return null
  }
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
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[sidereus] Anthropic ${res.status} (model=${CLAUDE_MODEL}): ${body.slice(0, 300)}`)
      return null
    }
    const data = await res.json()
    return data?.content?.map((part: { text?: string }) => part.text || '').join('\n').trim() || null
  } catch (err) {
    console.error('[sidereus] Anthropic exception:', err instanceof Error ? err.message : String(err))
    return null
  } finally {
    clearTimeout(timeout)
  }
}

async function callOpenAI(prompt: string, system: string, maxTokens: number, timeoutMs = 45000): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OpenAI
  if (!apiKey) {
    console.warn('[sidereus] callOpenAI: no API key (checked OPENAI_API_KEY, OpenAI)')
    return null
  }
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
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error(`[sidereus] OpenAI ${res.status} (model=${OPENAI_MINI_MODEL}): ${body.slice(0, 300)}`)
      return null
    }
    const data = await res.json()
    return data?.choices?.[0]?.message?.content?.trim() || null
  } catch (err) {
    console.error('[sidereus] OpenAI exception:', err instanceof Error ? err.message : String(err))
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
    const rawTicker = body.ticker?.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, '')
    if (!rawTicker) return NextResponse.json({ error: 'ticker is required' }, { status: 400 })

    // Resolve European tickers (e.g. XFAB → XFAB.BR for Yahoo Finance)
    const { yTicker, isEuMapped } = await resolveYahooTicker(rawTicker)
    const ticker = rawTicker  // keep original for display / SEC lookup
    const yFinTicker = yTicker  // use resolved ticker for Yahoo Finance calls

    const domain = detectDomain(ticker, body.domain)
    const fastMode = body.fast !== false
    const backendUrl = process.env.BACKEND_API_URL
    const backendSecret = process.env.BACKEND_API_SECRET

    // Collect context + product images in parallel up-front.
    // Use the Yahoo-resolved ticker for market data; original ticker for SEC.
    const emptyContext: ContextBundle = { quote: null, news: [], sec: { filings: [] }, arxiv: [] }
    const [context, products] = await Promise.all([
      withTimeout(
        (async () => {
          const [quote, news, sec] = await Promise.all([
            fetchYahooQuote(yFinTicker),
            fetchYahooNews(yFinTicker),
            fetchSecContext(ticker, fastMode ? 6500 : 22000),
          ])
          const arxiv = fastMode ? [] : await fetchArxiv(`${sec.companyName || ticker} ${domain.replace('Ecosystem', '').trim()}`)
          return { quote, news, sec, arxiv }
        })(),
        fastMode ? FAST_CONTEXT_TIMEOUT_MS : 25000,
        emptyContext,
      ),
      withTimeout(fetchProductData(yFinTicker), fastMode ? 8000 : 12000, EMPTY_PRODUCTS),
    ])
    const priceFacts = priceFactsMarkdown(context.quote)
    const contextMarkdown = contextToMarkdown(context)
    const companyName = context.sec.companyName || String(context.quote?.longName || context.quote?.shortName || ticker)

    // Detect European company: EU exchange mapping, EU currency, or no SEC filings + ticker has suffix
    const quoteCurrency = String(context.quote?.currency || '')
    const isEuropean = isEuMapped || EU_CURRENCIES.has(quoteCurrency) || (ticker.includes('.') && context.sec.filings.length === 0)

    const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY || process.env.Claude)
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY || process.env.OpenAI)
    console.log(`[sidereus] ${ticker} | fast=${fastMode} | eu=${isEuropean} | anthropic=${hasAnthropic} | openai=${hasOpenAI} | model=${CLAUDE_MODEL}`)

    if (fastMode) {
      const prompt = buildFastPrompt(ticker, domain, companyName, priceFacts, contextMarkdown, products, isEuropean)
      // Try OpenAI first (faster), then fall back to Anthropic if it fails.
      let fastReport: string | null = null
      if (hasOpenAI) {
        fastReport = await callOpenAI(
          prompt,
          'You are a fast institutional equity research writer. Return only markdown.',
          isEuropean ? 8000 : 6500,
          FAST_MODEL_TIMEOUT_MS,
        )
      }
      if (!fastReport && hasAnthropic) {
        fastReport = await callAnthropic(prompt, isEuropean ? 8000 : 6500, FAST_MODEL_TIMEOUT_MS)
      }

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
      console.warn(`[sidereus] fast-mode: both models returned null, falling through to full pipeline`)
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
    let factsMarkdown = await callAnthropic(buildClaudeExtractionPrompt(ticker, domain, contextMarkdown, isEuropean), 4096)
    // Fallback: GPT-4o-mini extraction if Claude unavailable.
    if (!factsMarkdown) {
      factsMarkdown = await callOpenAI(
        buildClaudeExtractionPrompt(ticker, domain, contextMarkdown, isEuropean),
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
      buildVisualsPrompt(ticker, domain, facts, isEuropean),
      'You produce technically accurate Mermaid diagrams, educational explainers, and markdown tables. Return only the asset pack.',
      3500,
    )
    // Fallback: Claude builds visuals if OpenAI unavailable.
    if (!visualsMarkdown) {
      visualsMarkdown = await callAnthropic(buildVisualsPrompt(ticker, domain, facts, isEuropean), 3000)
    }
    const visuals = visualsMarkdown || 'No diagram pack available — describe the technology and supply chain in prose with clear structure.'

    // ── STEP 3: Claude Sonnet writes the final article ────────────
    const finalTokens = isEuropean ? 10000 : 8192
    let finalReport = await callAnthropic(
      buildFinalPrompt(ticker, domain, priceFacts, facts, visuals, context.arxiv, products, isEuropean),
      finalTokens,
    )
    // Fallback: GPT-4o-mini writes the final article.
    if (!finalReport) {
      finalReport = await callOpenAI(
        buildFinalPrompt(ticker, domain, priceFacts, facts, visuals, context.arxiv, products, isEuropean),
        'You are an institutional equity research analyst. Return only the article in markdown.',
        isEuropean ? 12000 : 10000,
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



