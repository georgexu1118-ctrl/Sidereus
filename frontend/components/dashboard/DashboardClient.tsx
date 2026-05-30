'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Download, FileText, Loader2, Send, ShieldCheck } from 'lucide-react'
import ReportRenderer from '@/components/research/ReportRenderer'

type ReportPayload = {
  ticker: string
  companyName?: string
  domain?: string
  status: 'ready' | 'demo' | 'error'
  reportMarkdown: string
  sections?: string[]
  provider?: string
  generatedAt?: string
  message?: string
}

const AGENT_STEPS = [
  'Market data',
  'SEC filings',
  'Earnings calls',
  'Industry map',
  'Financial model',
  'Valuation',
  'Risk review',
  'Skeptical analyst',
  'Final report',
  'PDF',
]

function extractTitle(markdown: string, ticker: string) {
  const firstHeading = markdown.split('\n').find((line) => line.startsWith('# '))
  return firstHeading?.replace(/^#\s+/, '') || `${ticker} Research Report`
}

export default function DashboardClient() {
  const [ticker, setTicker] = useState('')
  const [domain, setDomain] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [report, setReport] = useState<ReportPayload | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const normalizedTicker = useMemo(
    () => ticker.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, ''),
    [ticker]
  )

  const activeStepCount = report ? AGENT_STEPS.length : isGenerating ? 8 : 0

  async function generatePdf(nextReport: ReportPayload) {
    const res = await fetch('/api/research/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticker: nextReport.ticker,
        title: extractTitle(nextReport.reportMarkdown, nextReport.ticker),
        markdown: nextReport.reportMarkdown,
      }),
    })

    if (!res.ok) return
    const blob = await res.blob()
    setPdfUrl(URL.createObjectURL(blob))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!normalizedTicker || isGenerating) return

    setIsGenerating(true)
    setError(null)
    setReport(null)
    setPdfUrl(null)

    try {
      const res = await fetch('/api/research/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: normalizedTicker,
          domain: domain || undefined,
          fast: false,
        }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || 'Research generation failed.')
      }

      setReport(payload)
      await generatePdf(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Research generation failed.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col px-4 pt-4 pb-6 sm:px-6">
      {/* ═══════════════════════════════════════════════════════════════
          HERO INPUT — the very first thing visible.
          Sticky positioning keeps it pinned even after scrolling.
          Large, centered, visually unmistakable.
      ═══════════════════════════════════════════════════════════════ */}
      <div className="sticky top-4 z-30 mb-5">
        <div className="rounded-2xl border border-lavender/25 bg-void/85 px-5 py-5 shadow-[0_20px_60px_-15px_rgba(181,166,216,0.25)] backdrop-blur-2xl sm:px-7 sm:py-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gold/80">
                Sidereus · Research Generator
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-fog sm:text-2xl">
                Enter a ticker
              </h1>
            </div>
            <div className="hidden items-center gap-2 rounded-md border border-white/[0.07] px-2.5 py-1.5 text-xs text-fog-dim sm:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-bull" />
              Server-side keys
            </div>
          </div>

          <form onSubmit={onSubmit}>
            <div className="flex flex-col gap-3 rounded-xl border border-lavender/20 bg-white/[0.04] p-3 shadow-inner sm:flex-row sm:items-stretch">
              <input
                value={ticker}
                onChange={(event) => setTicker(event.target.value)}
                placeholder="NVDA, ASML, VRT, MRNA…"
                className="min-h-12 flex-1 rounded-md bg-transparent px-3 text-lg font-medium tracking-tight text-fog placeholder:text-fog-dim/40 focus:outline-none focus:ring-2 focus:ring-lavender/40"
                aria-label="Stock ticker"
                autoFocus
              />
              <select
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                className="min-h-12 rounded-md border border-white/[0.08] bg-void px-3 text-sm text-fog-dim focus:outline-none focus:ring-2 focus:ring-lavender/40"
                aria-label="Research domain"
              >
                <option value="">Auto domain</option>
                <option value="AI Supply Chain">AI Supply Chain</option>
                <option value="Biotechnology">Biotechnology</option>
                <option value="Semiconductor Infrastructure">Semiconductors</option>
                <option value="Data Center Ecosystem">Data Center</option>
                <option value="Frontier Technology">Frontier Tech</option>
              </select>
              <button
                type="submit"
                disabled={!normalizedTicker || isGenerating}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-gradient-to-br from-lavender/90 to-morning-blue/80 px-6 text-sm font-semibold text-void shadow-lg transition hover:from-lavender hover:to-morning-blue disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isGenerating ? 'Generating…' : 'Generate report'}
              </button>
            </div>

            {/* Quick-pick suggestions */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.15em] text-fog-dim/60">Quick picks:</span>
              {['NVDA', 'ASML', 'AVGO', 'VRT', 'MRNA', 'TSM'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTicker(t)}
                  className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[11px] font-medium text-fog-dim transition hover:border-lavender/30 hover:text-fog"
                >
                  {t}
                </button>
              ))}
            </div>
          </form>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          OUTPUT SECTION (below the hero input)
      ═══════════════════════════════════════════════════════════════ */}
      <section className="flex flex-1 flex-col rounded-lg border border-white/[0.07] bg-void/70 backdrop-blur-xl">
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-[1fr_260px]">
          <div className="flex min-h-[420px] flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {!isGenerating && !report && !error && (
                <div className="max-w-2xl rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-sm leading-6 text-fog-dim">
                  Sidereus generates a 5-8 page report: investment thesis, AI supply chain flowchart (rendered visually), financial analysis, valuation, bear/base/bull cases, catalysts, risks, skeptical review, and a price target.
                </div>
              )}

              {(isGenerating || report) && (
                <div className="max-w-2xl rounded-lg border border-white/[0.07] bg-white/[0.035] px-4 py-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-fog">
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    {isGenerating ? `Generating ${normalizedTicker} research...` : `${report?.ticker} report ready`}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {AGENT_STEPS.map((step, index) => {
                      const complete = index < activeStepCount
                      return (
                        <div
                          key={step}
                          className={`rounded-md border px-2 py-2 text-[11px] ${
                            complete
                              ? 'border-bull/30 bg-bull/10 text-bull'
                              : 'border-white/[0.06] bg-white/[0.02] text-fog-dim'
                          }`}
                        >
                          {step}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {error && (
                <div className="max-w-2xl rounded-lg border border-bear/30 bg-bear/10 px-4 py-3 text-sm text-bear">
                  {error}
                </div>
              )}

              {report && (
                <article className="max-w-3xl rounded-lg border border-white/[0.07] bg-[#f7f3ea] px-5 py-5 text-[#171510] shadow-2xl">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-black/45">{report.domain || 'Equity Research'}</p>
                      <h2 className="mt-1 text-xl font-semibold tracking-normal">{extractTitle(report.reportMarkdown, report.ticker)}</h2>
                    </div>
                    {pdfUrl && (
                      <a
                        href={pdfUrl}
                        download={`${report.ticker}_sidereus_research.pdf`}
                        className="inline-flex items-center gap-2 rounded-md bg-[#171510] px-3 py-2 text-xs font-semibold text-[#f7f3ea]"
                      >
                        <Download className="h-3.5 w-3.5" />
                        PDF
                      </a>
                    )}
                  </div>
                  <ReportRenderer markdown={report.reportMarkdown} />
                </article>
              )}
            </div>
          </div>

          <aside className="border-t border-white/[0.06] p-5 lg:border-l lg:border-t-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-fog-dim">Output</p>
            <div className="mt-4 space-y-3 text-sm text-fog-dim">
              <div className="rounded-md border border-white/[0.07] p-3">Institutional report</div>
              <div className="rounded-md border border-white/[0.07] p-3">AI supply chain flowchart</div>
              <div className="rounded-md border border-white/[0.07] p-3">Skeptical analyst review</div>
              <div className="rounded-md border border-white/[0.07] p-3">Price target framework</div>
              <div className="rounded-md border border-white/[0.07] p-3">Automatic PDF</div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}
