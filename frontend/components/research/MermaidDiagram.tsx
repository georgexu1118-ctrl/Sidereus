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
        const mermaid = (await import('mermaid')).default

        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            securityLevel: 'loose',
            fontFamily: 'var(--font-geist-sans), Inter, system-ui, sans-serif',
            flowchart: {
              curve: 'linear',     // clean right-angle / straight connectors
              htmlLabels: true,
              padding: 10,
              nodeSpacing: 42,
              rankSpacing: 55,
              useMaxWidth: true,
            },
            themeVariables: {
              // Clean light "whiteboard" look — black boxes on white, like a
              // printed research diagram. Sits on the cream report paper.
              background: '#ffffff',
              primaryColor: '#ffffff',        // node fill
              primaryBorderColor: '#1b1b1b',  // node border
              primaryTextColor: '#161310',    // node text
              secondaryColor: '#f4efe4',
              tertiaryColor: '#faf7f0',
              lineColor: '#1b1b1b',           // arrows
              textColor: '#161310',
              mainBkg: '#ffffff',
              nodeBkg: '#ffffff',
              nodeBorder: '#1b1b1b',
              clusterBkg: '#f3eee2',          // subgraph cluster fill
              clusterBorder: '#b7a878',       // subgraph cluster border
              edgeLabelBackground: '#ffffff',
              titleColor: '#161310',
              fontSize: '14px',
              nodeTextColor: '#161310',
            },
          })
          mermaidInitialized = true
        }

        const renderId = (id || `mermaid-${Math.random().toString(36).slice(2, 9)}`).replace(/[^a-zA-Z0-9_-]/g, '')
        const { svg: renderedSvg } = await mermaid.render(renderId, chart)

        if (!cancelled) {
          setSvg(renderedSvg)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to render diagram')
      }
    }

    render()
    return () => { cancelled = true }
  }, [chart, id])

  if (error) {
    return (
      <div className="rounded-lg border border-[#c08a8a] bg-[#fbeaea] p-3 text-xs text-[#7f3a3a]">
        Diagram could not be rendered.
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-[#9c6f55]">{chart.slice(0, 220)}…</pre>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="my-5 overflow-x-auto rounded-xl border border-[#d8cdb0] bg-white p-5 shadow-[0_2px_14px_rgba(0,0,0,0.06)] [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}
