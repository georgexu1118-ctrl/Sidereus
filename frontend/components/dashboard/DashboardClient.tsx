'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Download, FileText, Loader2, Send, ShieldCheck } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

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
  'Yahoo price',
  'SEC filings',
  'Claude extraction',
  'arXiv papers',
  'GPT-4o diagrams',
  'Supply chain map',
  'Claude narrative',
  'PDF',
]

function extractTitle(markdown: string, ticker: string) {
  const firstHeading = markdown.split('\n').find((line) => line.startsWith('# '))
  return firstHeading?.replace(/^#\s+/, '') || `${ticker} Research Report`
}

function normalizeMermaidSource(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.toLowerCase().startsWith('mermaid\n')) {
    return trimmed.slice('mermaid\n'.length).trim()
  }
  return trimmed
}

function sanitizeMermaidSource(source: string) {
  return source.replace(/\[([^\]]+)\]/g, (_, label: string) => {
    const cleaned = label
      .replace(/[()]/g, '')
      .replace(/[{}]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
    return `[${cleaned}]`
  })
}

function isLikelyMermaid(raw: string) {
  const source = normalizeMermaidSource(raw)
  if (!source) return false
  return /^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|mindmap|timeline|gitGraph)\b/m.test(
    source
  )
}

function MermaidBlock({ chart }: { chart: string }) {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function renderChart() {
      try {
        const mermaidModule = await import('mermaid')
        mermaidModule.default.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: 'default',
        })
        const candidates = Array.from(new Set([chart, sanitizeMermaidSource(chart)]))
        for (const candidate of candidates) {
          try {
            const id = `mermaid-${Math.random().toString(36).slice(2, 10)}`
            const { svg: renderedSvg } = await mermaidModule.default.render(id, candidate)
            if (!cancelled) {
              setSvg(renderedSvg)
              setError('')
            }
            return
          } catch {
            continue
          }
        }
        throw new Error('Mermaid render failed')
      } catch {
        if (!cancelled) {
          setSvg('')
          setError('Mermaid render failed')
        }
      }
    }
    void renderChart()
    return () => {
      cancelled = true
    }
  }, [chart])

  if (error) {
    return <pre className="overflow-x-auto rounded-md border border-black/10 bg-white p-3 text-xs">{chart}</pre>
  }

  if (!svg) {
    return <p className="text-xs text-black/55">Rendering chart...</p>
  }

  return (
    <div
      className="overflow-x-auto rounded-md border border-black/10 bg-white p-3"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export default function DashboardClient() {
  const [ticker, setTicker] = useState('')
  const [domain, setDomain] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [report, setReport] = useState<ReportPayload | null>(null)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reportRef = useRef<HTMLElement | null>(null)

  const normalizedTicker = useMemo(
    () => ticker.trim().toUpperCase().replace(/[^A-Z0-9.-]/g, ''),
    [ticker]
  )

  const activeStepCount = report ? AGENT_STEPS.length : isGenerating ? 6 : 0

  async function generatePdfFromPreview() {
    if (!reportRef.current || !report) return

    setIsExportingPdf(true)
    setError(null)
    try {
      await new Promise((resolve) => setTimeout(resolve, 250))
      const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const pageWidthPx = 794
      const pageHeightPx = 1123
      const marginPx = 96
      const footerPx = 36
      const sourceBody = reportRef.current.querySelector('[data-report-body]')
      if (!sourceBody) throw new Error('Report body missing')

      const staging = document.createElement('div')
      staging.style.position = 'fixed'
      staging.style.left = '-10000px'
      staging.style.top = '0'
      staging.style.width = `${pageWidthPx}px`
      staging.style.background = '#fff'
      staging.style.color = '#000'
      staging.style.zIndex = '-1'

      const style = document.createElement('style')
      style.textContent = `
        .pdf-page, .pdf-page * { box-sizing: border-box; color: #000 !important; }
        .pdf-page { width: ${pageWidthPx}px; height: ${pageHeightPx}px; padding: ${marginPx}px ${marginPx}px ${footerPx + 24}px; background: #fff; font-family: "Times New Roman", Times, serif; position: relative; overflow: hidden; }
        .pdf-title { margin: 0 0 12px; font-size: 22px; line-height: 1.25; font-weight: 700; }
        .pdf-meta { margin: 0 0 18px; border-bottom: 1px solid #000; padding-bottom: 8px; font-size: 11px; letter-spacing: 0; text-transform: uppercase; }
        .pdf-body { height: 100%; overflow: hidden; }
        .pdf-body h1, .pdf-body h2, .pdf-body h3 { margin: 20px 0 10px; font-weight: 700; line-height: 1.25; }
        .pdf-body h2 { font-size: 18px; }
        .pdf-body h3 { font-size: 16px; }
        .pdf-body p { margin: 0 0 18px; font-size: 16px; line-height: 1.5; text-align: left; }
        .pdf-body ul, .pdf-body ol { margin: 0 0 18px 20px; padding: 0; font-size: 16px; line-height: 1.5; }
        .pdf-body table { width: 100%; border-collapse: collapse; margin: 12px 0 16px; font-size: 12px; }
        .pdf-body th, .pdf-body td { border: 1px solid #000; padding: 5px; vertical-align: top; }
        .pdf-body pre { white-space: pre-wrap; overflow-wrap: anywhere; border: 1px solid #000; padding: 8px; font-size: 10px; }
        .pdf-body .katex-display { display: block; margin: 18px 0 22px; padding: 8px 0 10px; overflow: visible !important; text-align: center; }
        .pdf-body .katex,
        .pdf-body .katex * { line-height: normal !important; overflow: visible !important; }
        .pdf-body .katex { display: inline-block; max-width: 100%; font-size: 1.05em; white-space: normal; }
        .pdf-body .katex-html { overflow: visible !important; }
        .pdf-body .katex-mathml {
          position: absolute !important;
          width: 1px !important;
          height: 1px !important;
          margin: -1px !important;
          padding: 0 !important;
          border: 0 !important;
          overflow: hidden !important;
          clip: rect(0, 0, 0, 0) !important;
          clip-path: inset(50%) !important;
          white-space: nowrap !important;
        }
        .pdf-body figure { margin: 18px 0; }
        .pdf-body figcaption { margin-top: 6px; font-size: 12px; line-height: 1.35; text-align: center; }
        .pdf-body svg { max-width: 100%; height: auto; }
        .pdf-block { break-inside: avoid; page-break-inside: avoid; }
        .pdf-footer { position: absolute; bottom: 18px; left: 0; right: 0; text-align: center; font-size: 12px; }
      `
      staging.appendChild(style)
      document.body.appendChild(staging)

      const pages: Array<{ page: HTMLDivElement; body: HTMLDivElement; footer: HTMLDivElement }> = []
      const createPage = (pageIndex: number) => {
        const page = document.createElement('div')
        page.className = 'pdf-page'
        const body = document.createElement('div')
        body.className = 'pdf-body'
        if (pageIndex === 0) {
          const title = document.createElement('h1')
          title.className = 'pdf-title'
          title.textContent = extractTitle(report.reportMarkdown, report.ticker)
          const meta = document.createElement('p')
          meta.className = 'pdf-meta'
          meta.textContent = report.domain || 'Equity Research'
          page.appendChild(title)
          page.appendChild(meta)
          const headerUsedPx = title.offsetHeight + meta.offsetHeight + 28
          body.style.height = `${pageHeightPx - marginPx - footerPx - 24 - marginPx - headerUsedPx}px`
        } else {
          body.style.height = `${pageHeightPx - marginPx - footerPx - 24 - marginPx}px`
        }
        const footer = document.createElement('div')
        footer.className = 'pdf-footer'
        page.appendChild(body)
        page.appendChild(footer)
        staging.appendChild(page)
        pages.push({ page, body, footer })
        return body
      }

      let currentBody = createPage(0)
      Array.from(sourceBody.children).forEach((child) => {
        const clone = child.cloneNode(true) as HTMLElement
        const headingText = clone.textContent?.replace(/\s+/g, ' ').trim().toLowerCase() || ''
        if (
          clone.tagName === 'H2' &&
          headingText === 'technology breakdown' &&
          pages.length === 1 &&
          currentBody.children.length > 0
        ) {
          currentBody = createPage(pages.length)
        }
        if (
          ['PRE', 'TABLE', 'FIGURE', 'UL', 'OL', 'BLOCKQUOTE'].includes(clone.tagName) ||
          clone.querySelector('svg, table, pre, .katex-display')
        ) {
          clone.classList.add('pdf-block')
        }
        const remainingHeight = currentBody.clientHeight - currentBody.scrollHeight
        if (clone.tagName === 'H2' && currentBody.children.length > 0 && remainingHeight < 96) {
          currentBody = createPage(pages.length)
        }
        currentBody.appendChild(clone)
        if (currentBody.scrollHeight > currentBody.clientHeight && currentBody.children.length > 1) {
          currentBody.removeChild(clone)
          currentBody = createPage(pages.length)
          currentBody.appendChild(clone)
        }
      })

      pages.forEach(({ footer }, index) => {
        footer.textContent = String(index + 1)
      })

      for (const [index, { page }] of pages.entries()) {
        const canvas = await html2canvas(page, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        })
        const imageData = canvas.toDataURL('image/png')
        if (index > 0) pdf.addPage()
        pdf.addImage(imageData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      }

      document.body.removeChild(staging)
      pdf.save(`${report.ticker}_sidereus_research.pdf`)
    } catch {
      setError('PDF export failed. Please try again.')
    } finally {
      setIsExportingPdf(false)
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!normalizedTicker || isGenerating) return

    setIsGenerating(true)
    setError(null)
    setReport(null)

    try {
      const res = await fetch('/api/research/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: normalizedTicker,
          domain: domain || undefined,
          fast: true,
        }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload?.error || 'Research generation failed.')
      }

      setReport(payload)
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
                className="min-h-12 flex-1 rounded-md bg-transparent px-3 text-lg font-medium tracking-tight text-fog focus:outline-none focus:ring-2 focus:ring-lavender/40"
                aria-label="Stock ticker"
                autoFocus
              />
              <select
                value={domain}
                onChange={(event) => setDomain(event.target.value)}
                className="min-h-12 rounded-md border border-white/[0.08] bg-void px-3 text-sm text-fog-dim focus:outline-none focus:ring-2 focus:ring-lavender/40"
                aria-label="Research domain"
              >
                <option value="">Auto detect</option>
                <option value="AI Supply Chain">AI</option>
                <option value="Biotechnology">Biotech</option>
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
              {['AXTI', 'AAOI', 'ABVX', 'LITE', 'SNDK', 'RKLB'].map((t) => (
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
                  Sidereus generates an academic-style equity research paper with company overview, technology breakdown, supply-chain analysis, and investment analysis. No valuation, no price targets.
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
                <article
                  ref={reportRef}
                  className="max-w-3xl rounded-sm border border-black/10 bg-white px-8 py-8 text-black shadow-none"
                  style={{ fontFamily: '"Times New Roman", Times, serif' }}
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-3">
                    <div>
                      <p className="text-xs uppercase text-black/55">{report.domain || 'Equity Research'}</p>
                      <h2 className="mt-1 text-xl font-bold tracking-normal">{extractTitle(report.reportMarkdown, report.ticker)}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={generatePdfFromPreview}
                      disabled={isExportingPdf}
                      className="inline-flex items-center gap-2 rounded-sm bg-black px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {isExportingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      {isExportingPdf ? 'Exporting...' : 'PDF'}
                    </button>
                  </div>
                  <div data-report-body className="prose prose-base max-w-none leading-[1.5] prose-headings:mt-8 prose-headings:mb-4 prose-headings:font-bold prose-headings:text-black prose-p:my-5 prose-p:text-black prose-li:my-1 prose-li:text-black prose-strong:text-black prose-figure:my-7 prose-figcaption:text-center prose-figcaption:text-xs prose-pre:my-6 prose-pre:rounded-sm prose-pre:border prose-pre:border-black/20 prose-pre:bg-white prose-pre:text-black">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: false }]]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        code({ className, children, ...props }) {
                          const language = /language-(\w+)/.exec(className || '')?.[1]
                          const codeText = String(children).replace(/\n$/, '')
                          const normalized = normalizeMermaidSource(codeText)
                          const shouldRenderMermaid =
                            language === 'mermaid' || (!language && isLikelyMermaid(codeText))
                          if (shouldRenderMermaid && normalized) {
                            return <MermaidBlock chart={normalized} />
                          }
                          return (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          )
                        },
                        pre({ children }) {
                          return <pre className="overflow-x-auto">{children}</pre>
                        },
                      }}
                    >
                      {report.reportMarkdown}
                    </ReactMarkdown>
                  </div>
                </article>
              )}
            </div>
          </div>

          <aside className="border-t border-white/[0.06] p-5 lg:border-l lg:border-t-0">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-fog-dim">Output</p>
            <div className="mt-4 space-y-3 text-sm text-fog-dim">
              <div className="rounded-md border border-white/[0.07] p-3">Company overview</div>
              <div className="rounded-md border border-white/[0.07] p-3">Technology breakdown</div>
              <div className="rounded-md border border-white/[0.07] p-3">Supply chain flowchart</div>
              <div className="rounded-md border border-white/[0.07] p-3">Diagrams &amp; tables</div>
              <div className="rounded-md border border-white/[0.07] p-3">Automatic PDF</div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

