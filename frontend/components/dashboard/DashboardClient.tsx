'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Download, FileText, Loader2, Send, ShieldCheck } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

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

function sectionTitle(element: Element) {
  return element.textContent?.replace(/\s+/g, ' ').trim().toLowerCase() || ''
}

function markPrintBlocks(root: HTMLElement) {
  root.querySelectorAll('table, pre, figure, blockquote, ul, ol, .katex-display').forEach((element) => {
    element.classList.add('sidereus-print-avoid')
  })
  root.querySelectorAll('svg').forEach((svg) => {
    svg.closest('div')?.classList.add('sidereus-print-chart', 'sidereus-print-avoid')
  })
  root.querySelectorAll<HTMLElement>('[data-section-title*="technology"]').forEach((section) => {
    section.querySelectorAll('svg').forEach((svg) => {
      svg.closest('div')?.classList.add('sidereus-print-tech-chart')
    })
  })
}

function groupPrintSections(sourceBody: Element) {
  const printBody = document.createElement('div')
  printBody.className = 'sidereus-print-body'
  let currentSection: HTMLElement | null = null
  let currentSubsection: HTMLElement | null = null

  Array.from(sourceBody.children).forEach((child) => {
    const clone = child.cloneNode(true) as HTMLElement
    if (clone.tagName === 'H2') {
      currentSection = document.createElement('section')
      currentSection.className = 'sidereus-print-section'
      currentSection.dataset.sectionTitle = sectionTitle(clone)
      currentSection.appendChild(clone)
      printBody.appendChild(currentSection)
      currentSubsection = null
      return
    }

    if (clone.tagName === 'H3' && currentSection) {
      currentSubsection = document.createElement('section')
      currentSubsection.className = 'sidereus-print-subsection'
      currentSubsection.appendChild(clone)
      currentSection.appendChild(currentSubsection)
      return
    }

    if (currentSubsection) {
      currentSubsection.appendChild(clone)
    } else if (currentSection) {
      currentSection.appendChild(clone)
    } else {
      printBody.appendChild(clone)
    }
  })

  printBody.querySelectorAll('.sidereus-print-section, .sidereus-print-subsection').forEach((element) => {
    const title = element instanceof HTMLElement ? element.dataset.sectionTitle : ''
    if (title === 'technology breakdown' || title === 'investment analysis' || element.children.length > 8) {
      element.classList.add('sidereus-print-long')
    }
  })
  markPrintBlocks(printBody)
  return printBody
}

async function waitForPrintReadiness(sourceBody: Element) {
  const started = Date.now()
  while (sourceBody.textContent?.includes('Rendering chart...') && Date.now() - started < 10000) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  const fonts = document.fonts
  if (fonts) {
    await Promise.allSettled([
      fonts.load('11pt "Times New Roman"'),
      fonts.load('11pt KaTeX_Main'),
      fonts.load('11pt KaTeX_Math'),
      fonts.load('11pt KaTeX_Size1'),
      fonts.ready,
    ])
  }
}

async function waitForPrintAssets(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll('img'))
  await Promise.allSettled(
    images.map((image) => {
      if (image.complete) return Promise.resolve()
      return image.decode ? image.decode() : new Promise((resolve) => image.addEventListener('load', resolve, { once: true }))
    })
  )
  if (document.fonts) {
    await document.fonts.ready
  }
}

// Load + initialize mermaid exactly once, regardless of how many charts mount.
let mermaidLoader: Promise<typeof import('mermaid').default> | null = null
async function loadMermaid() {
  if (!mermaidLoader) {
    mermaidLoader = import('mermaid').then((mod) => {
      mod.default.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'default',
      })
      return mod.default
    })
  }
  return mermaidLoader
}

// mermaid.render() mutates shared global state and a shared DOM scratch node,
// so it is NOT safe to run concurrently. A report mounts several diagrams at
// once (3 technology + 1 supply chain); parallel renders clobber each other
// and charts intermittently fail to appear in the preview and the PDF.
// Serialize every render through one promise chain so only one runs at a time.
let mermaidRenderChain: Promise<unknown> = Promise.resolve()
let mermaidRenderSeq = 0
async function renderMermaidSerialized(source: string): Promise<string> {
  const mermaid = await loadMermaid()
  const run = mermaidRenderChain.then(async () => {
    const id = `mermaid-${Date.now().toString(36)}-${mermaidRenderSeq++}`
    try {
      const { svg } = await mermaid.render(id, source)
      return svg
    } finally {
      // mermaid can leave an orphaned measurement/error node behind on
      // failure; remove it so it cannot pollute the next render or the DOM.
      document.getElementById(`d${id}`)?.remove()
      document.getElementById(id)?.remove()
    }
  })
  // Keep the chain alive for the next render even if this one rejects.
  mermaidRenderChain = run.catch(() => undefined)
  return run
}

function MermaidBlock({ chart }: { chart: string }) {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function renderChart() {
      const candidates = Array.from(new Set([chart, sanitizeMermaidSource(chart)]))
      // Two attempts: a fresh page load can have fonts/layout not yet ready,
      // and a serialized retry clears almost all transient render failures.
      for (let attempt = 0; attempt < 2; attempt++) {
        for (const candidate of candidates) {
          try {
            const renderedSvg = await renderMermaidSerialized(candidate)
            if (cancelled) return
            setSvg(renderedSvg)
            setError('')
            return
          } catch {
            // fall through to the next candidate / attempt
          }
        }
        if (attempt === 0 && !cancelled) {
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
      }
      if (!cancelled) {
        setSvg('')
        setError('Mermaid render failed')
      }
    }
    void renderChart()
    return () => {
      cancelled = true
    }
  }, [chart])

  if (error) {
    return (
      <pre className="sidereus-print-mermaid-fallback overflow-x-auto rounded-md border border-black/10 bg-white p-3 text-xs">
        {chart}
      </pre>
    )
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
    let printRoot: HTMLDivElement | null = null
    let cleanupTimer: ReturnType<typeof setTimeout> | null = null
    try {
      const sourceBody = reportRef.current.querySelector('[data-report-body]')
      if (!sourceBody) throw new Error('Report body missing')

      await waitForPrintReadiness(sourceBody)

      printRoot = document.createElement('div')
      printRoot.className = 'sidereus-print-root'
      printRoot.setAttribute('aria-hidden', 'true')

      const article = document.createElement('article')
      article.className = 'sidereus-print-report'

      const header = document.createElement('header')
      header.className = 'sidereus-print-header'
      const title = document.createElement('h1')
      title.textContent = extractTitle(report.reportMarkdown, report.ticker)
      const meta = document.createElement('p')
      meta.textContent = report.domain || 'Equity Research'
      header.appendChild(title)
      header.appendChild(meta)
      article.appendChild(header)
      article.appendChild(groupPrintSections(sourceBody))
      printRoot.appendChild(article)
      document.body.appendChild(printRoot)

      await waitForPrintAssets(printRoot)

      const cleanup = () => {
        if (cleanupTimer) clearTimeout(cleanupTimer)
        printRoot?.remove()
        printRoot = null
        window.removeEventListener('afterprint', cleanup)
      }

      window.addEventListener('afterprint', cleanup, { once: true })
      window.print()
      cleanupTimer = setTimeout(cleanup, 2000)
    } catch {
      if (cleanupTimer) clearTimeout(cleanupTimer)
      printRoot?.remove()
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

