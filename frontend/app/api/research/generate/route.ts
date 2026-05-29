import { NextRequest, NextResponse } from 'next/server'

// This route handler proxies requests to the Python backend research engine.
// The Python engine (equity-research-os/main.py) runs the 10-agent pipeline and
// returns a structured report.  In a Vercel deployment the backend can be
// hosted as a separate service on the same team.

export const maxDuration = 300  // 5 minutes — report generation is slow

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ticker, domain, fast } = body as {
      ticker: string
      domain?: string
      fast?: boolean
    }

    if (!ticker || typeof ticker !== 'string') {
      return NextResponse.json({ error: 'ticker is required' }, { status: 400 })
    }

    const backendUrl = process.env.BACKEND_API_URL
    const backendSecret = process.env.BACKEND_API_SECRET

    // If no backend URL configured, return a stub so the frontend UI works
    // without a running Python backend.
    if (!backendUrl) {
      return NextResponse.json({
        status: 'demo',
        ticker: ticker.toUpperCase(),
        message: 'Set BACKEND_API_URL in your environment variables to connect the Python research engine.',
        report_id: `demo-${Date.now()}`,
      })
    }

    const upstream = await fetch(`${backendUrl}/api/research/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(backendSecret ? { 'X-Internal-Secret': backendSecret } : {}),
      },
      body: JSON.stringify({ ticker: ticker.toUpperCase(), domain, fast: !!fast }),
    })

    if (!upstream.ok) {
      const err = await upstream.text()
      return NextResponse.json({ error: err }, { status: upstream.status })
    }

    const data = await upstream.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[research/generate]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
