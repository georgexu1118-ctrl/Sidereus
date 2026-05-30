import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300

type GenerateBody = {
  ticker: string
  domain?: string
  fast?: boolean
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

function detectDomain(ticker: string, domain?: string) {
  if (domain) return domain
  const symbol = ticker.toUpperCase()
  if (['NVDA', 'AMD', 'AVGO', 'ASML', 'ARM', 'LITE', 'COHR', 'AXTI', 'SNDK'].includes(symbol)) return 'AI Supply Chain'
  if (['VRT', 'SMCI', 'CRWV', 'EQIX', 'DLR', 'DELL', 'HPE'].includes(symbol)) return 'Data Center Ecosystem'
  if (['MRNA', 'REGN', 'VRTX', 'GILD', 'ALNY', 'ABVX', 'BNTX', 'BIIB'].includes(symbol)) return 'Biotechnology'
  return 'Frontier Technology'
}

function fallbackReport(ticker: string, domain: string) {
  return `# ${ticker} Institutional Equity Research

## Executive Summary
Sidereus is ready to generate a full institutional report for ${ticker}. Connect server-side LLM keys or the Python research backend to replace this preview with live agent output.

## Investment Thesis
The platform will evaluate ${ticker} through data collection, filings, earnings calls, industry structure, financial modeling, valuation, competitive intelligence, risk assessment, skeptical review, and portfolio-manager synthesis.

## Research Architecture
Domain: ${domain}

Agents: Data Collection, SEC Filing, Earnings Call, Industry Research, Financial Modeling, Valuation, Competitive Intelligence, Risk Assessment, Skeptical Analyst, Portfolio Manager.

## Valuation
The production run should include base, bull, and bear cases with a price target and expected return against current market price.

## Risks
All assumptions should be attacked by the skeptical analyst before the final conclusion is accepted.

## Investment Conclusion
Set ANTHROPIC_API_KEY, OPENAI_API_KEY, or BACKEND_API_URL as server-side environment variables to run live research. Do not expose keys with NEXT_PUBLIC prefixes.`
}

function buildPrompt(ticker: string, domain: string) {
  return `You are Sidereus, an institutional equity research platform. Generate a hedge-fund-quality, sell-side-quality research report for ${ticker}.

Domain: ${domain}
Target length: concise 5-8 page equivalent, but return markdown suitable for a web app.

Required sections:
${REPORT_SECTIONS.map((section) => `- ${section}`).join('\n')}

Requirements:
- Produce differentiated investment insight, not a generic summary.
- Include a price target framework at the end.
- Include bull, base, and bear cases.
- Include skeptical analyst objections and what could invalidate the thesis.
- For AI supply chain or semiconductors, discuss customers, suppliers, competitors, product dependencies, manufacturing dependencies, geographic risks, and second-order beneficiaries.
- For biotechnology, discuss mechanism, trial endpoints, regulatory path, probability of success, TAM, pipeline economics, DCF/rNPV framing, and standard of care.
- Be explicit where evidence would need confirmation from filings, earnings calls, clinical data, or market data.
- Do not claim access to unavailable private data.

Return only markdown.`
}

async function callAnthropic(ticker: string, domain: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
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
      max_tokens: 6000,
      temperature: 0.35,
      messages: [{ role: 'user', content: buildPrompt(ticker, domain) }],
    }),
  })

  if (!res.ok) return null
  const data = await res.json()
  const text = data?.content?.map((part: { text?: string }) => part.text || '').join('\n').trim()
  return text || null
}

async function callOpenAI(ticker: string, domain: string) {
  const apiKey = process.env.OPENAI_API_KEY
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
      temperature: 0.3,
      max_tokens: 6000,
      messages: [
        { role: 'system', content: 'You are an institutional equity research analyst. Return only markdown.' },
        { role: 'user', content: buildPrompt(ticker, domain) },
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
        body: JSON.stringify({ ticker, domain, fast: !!body.fast }),
      })

      if (!upstream.ok) {
        const err = await upstream.text()
        return NextResponse.json({ error: err }, { status: upstream.status })
      }

      const data = await upstream.json()
      return NextResponse.json(normalizeBackendResponse(data, ticker, domain))
    }

    const anthropicReport = await callAnthropic(ticker, domain)
    if (anthropicReport) {
      return NextResponse.json({
        status: 'ready',
        ticker,
        domain,
        companyName: ticker,
        reportMarkdown: anthropicReport,
        sections: REPORT_SECTIONS,
        provider: 'anthropic',
        generatedAt: new Date().toISOString(),
      })
    }

    const openAiReport = await callOpenAI(ticker, domain)
    if (openAiReport) {
      return NextResponse.json({
        status: 'ready',
        ticker,
        domain,
        companyName: ticker,
        reportMarkdown: openAiReport,
        sections: REPORT_SECTIONS,
        provider: 'openai',
        generatedAt: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      status: 'demo',
      ticker,
      domain,
      companyName: ticker,
      reportMarkdown: fallbackReport(ticker, domain),
      sections: REPORT_SECTIONS,
      provider: 'demo',
      generatedAt: new Date().toISOString(),
      message: 'Set server-side ANTHROPIC_API_KEY, OPENAI_API_KEY, or BACKEND_API_URL to enable live research generation.',
    })
  } catch (err) {
    console.error('[research/generate]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
