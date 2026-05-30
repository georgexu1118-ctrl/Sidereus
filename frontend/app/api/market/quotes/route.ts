import { NextRequest, NextResponse } from 'next/server'

type QuoteRow = {
  ticker: string
  price: number | null
  change: number | null
  cap: number | null
  provider: 'finnhub' | 'twelvedata' | 'yahoo' | 'none'
  asOf: string
}

const USER_AGENT = 'SidereusFrontend/1.0 (+market-quotes)'

async function fetchFinnhubQuote(ticker: string, apiKey: string): Promise<QuoteRow | null> {
  const [quoteResp, profileResp] = await Promise.all([
    fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(ticker)}&token=${encodeURIComponent(apiKey)}`, {
      headers: { 'User-Agent': USER_AGENT },
      cache: 'no-store',
    }),
    fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(ticker)}&token=${encodeURIComponent(apiKey)}`, {
      headers: { 'User-Agent': USER_AGENT },
      cache: 'no-store',
    }),
  ])

  if (!quoteResp.ok) return null
  const quote = await quoteResp.json() as Record<string, unknown>
  const profile = profileResp.ok ? await profileResp.json() as Record<string, unknown> : {}

  const price = Number(quote.c ?? 0)
  if (!Number.isFinite(price) || price <= 0) return null

  const changePct = Number(quote.dp ?? 0)
  const marketCapM = Number(profile.marketCapitalization ?? 0) // in millions
  const cap = Number.isFinite(marketCapM) && marketCapM > 0 ? marketCapM * 1_000_000 : null
  const ts = Number(quote.t ?? 0)

  return {
    ticker,
    price,
    change: Number.isFinite(changePct) ? changePct : null,
    cap,
    provider: 'finnhub',
    asOf: ts > 0 ? new Date(ts * 1000).toISOString() : new Date().toISOString(),
  }
}

async function fetchTwelveDataQuote(ticker: string, apiKey: string): Promise<QuoteRow | null> {
  const resp = await fetch(`https://api.twelvedata.com/quote?symbol=${encodeURIComponent(ticker)}&apikey=${encodeURIComponent(apiKey)}`, {
    headers: { 'User-Agent': USER_AGENT },
    cache: 'no-store',
  })
  if (!resp.ok) return null

  const data = await resp.json() as Record<string, string>
  if (data.status === 'error') return null

  const price = Number(data.close ?? 0)
  if (!Number.isFinite(price) || price <= 0) return null

  const change = Number(data.percent_change ?? 0)
  const cap = Number(data.market_cap ?? 0)

  return {
    ticker,
    price,
    change: Number.isFinite(change) ? change : null,
    cap: Number.isFinite(cap) && cap > 0 ? cap : null,
    provider: 'twelvedata',
    asOf: data.datetime ? new Date(data.datetime).toISOString() : new Date().toISOString(),
  }
}

async function fetchYahooQuote(ticker: string): Promise<QuoteRow | null> {
  const resp = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ticker)}`, {
    headers: { 'User-Agent': USER_AGENT },
    cache: 'no-store',
  })
  if (!resp.ok) return null
  const data = await resp.json() as {
    quoteResponse?: { result?: Array<Record<string, unknown>> }
  }
  const row = data.quoteResponse?.result?.[0]
  if (!row) return null

  const price = Number(row.regularMarketPrice ?? 0)
  if (!Number.isFinite(price) || price <= 0) return null

  const change = Number(row.regularMarketChangePercent ?? 0)
  const cap = Number(row.marketCap ?? 0)
  const ts = Number(row.regularMarketTime ?? 0)

  return {
    ticker,
    price,
    change: Number.isFinite(change) ? change : null,
    cap: Number.isFinite(cap) && cap > 0 ? cap : null,
    provider: 'yahoo',
    asOf: ts > 0 ? new Date(ts * 1000).toISOString() : new Date().toISOString(),
  }
}

async function fetchQuoteWithFallback(ticker: string): Promise<QuoteRow> {
  const finnhubKey = process.env.FINNHUB_API_KEY ?? ''
  const twelveDataKey = process.env.TWELVEDATA_API_KEY ?? ''

  if (finnhubKey) {
    try {
      const q = await fetchFinnhubQuote(ticker, finnhubKey)
      if (q) return q
    } catch {}
  }
  if (twelveDataKey) {
    try {
      const q = await fetchTwelveDataQuote(ticker, twelveDataKey)
      if (q) return q
    } catch {}
  }
  try {
    const q = await fetchYahooQuote(ticker)
    if (q) return q
  } catch {}

  return {
    ticker,
    price: null,
    change: null,
    cap: null,
    provider: 'none',
    asOf: new Date().toISOString(),
  }
}

export async function GET(req: NextRequest) {
  const tickersParam = req.nextUrl.searchParams.get('tickers') ?? ''
  const tickers = tickersParam
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 20)

  if (tickers.length === 0) {
    return NextResponse.json({ error: 'tickers query parameter is required' }, { status: 400 })
  }

  const quotes = await Promise.all(tickers.map((t) => fetchQuoteWithFallback(t)))
  return NextResponse.json({ quotes, fetchedAt: new Date().toISOString() })
}

