'use client'

import { useEffect, useRef, useState } from 'react'

interface MermaidDiagramProps {
  chart: string
  id?: string
}

let mermaidInitialized = false

export default function MermaidDiagram({ chart, id }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        // Dynamic import keeps mermaid out of the initial bundle.
        const mermaid = (await import('mermaid')).default

        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'var(--font-geist-sans), Inter, system-ui, sans-serif',
            themeVariables: {
              // Sidereus Monet palette
              primaryColor: '#1A2230',
              primaryTextColor: '#F4F4F2',
              primaryBorderColor: '#8FA9D8',
              lineColor: '#8FA9D8',
              secondaryColor: '#202B3A',
              tertiaryColor: '#11151C',
              background: '#0B0E13',
              mainBkg: '#1A2230',
              secondBkg: '#202B3A',
              nodeBkg: '#1A2230',
              nodeBorder: '#8FA9D8',
              clusterBkg: '#11151C',
              edgeLabelBackground: '#0B0E13',
              labelTextColor: '#F4F4F2',
              fontSize: '13px',
            },
          })
          mermaidInitialized = true
        }

        const renderId = id || `mermaid-${Math.random().toString(36).slice(2, 9)}`
        const { svg: renderedSvg } = await mermaid.render(renderId, chart)

        if (!cancelled) {
          setSvg(renderedSvg)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram')
        }
      }
    }

    render()
    return () => { cancelled = true }
  }, [chart, id])

  if (error) {
    return (
      <div className="rounded-lg border border-bear/20 bg-bear/5 p-3 text-xs text-bear">
        Diagram render error: {error}
        <pre className="mt-2 overflow-x-auto text-fog-dim/60">{chart.slice(0, 200)}…</pre>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="my-4 overflow-x-auto rounded-lg border border-white/[0.06] bg-void/40 p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
