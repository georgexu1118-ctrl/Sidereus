'use client'

import { Fragment } from 'react'
import MermaidDiagram from './MermaidDiagram'

interface ReportRendererProps {
  markdown: string
}

interface Block {
  kind: 'mermaid' | 'text'
  content: string
  key: string
}

/**
 * Splits a markdown report into text + mermaid blocks so we can render
 * mermaid code fences as actual SVG diagrams instead of raw code.
 */
function splitBlocks(markdown: string): Block[] {
  const blocks: Block[] = []
  const fence = /```mermaid\s*\n([\s\S]*?)\n```/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let i = 0

  while ((match = fence.exec(markdown)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        kind: 'text',
        content: markdown.slice(lastIndex, match.index),
        key: `text-${i++}`,
      })
    }
    blocks.push({
      kind: 'mermaid',
      content: match[1].trim(),
      key: `mermaid-${i++}`,
    })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < markdown.length) {
    blocks.push({
      kind: 'text',
      content: markdown.slice(lastIndex),
      key: `text-${i++}`,
    })
  }

  return blocks.length ? blocks : [{ kind: 'text', content: markdown, key: 'text-0' }]
}

export default function ReportRenderer({ markdown }: ReportRendererProps) {
  const blocks = splitBlocks(markdown)

  return (
    <div className="text-sm leading-7">
      {blocks.map((block) => (
        <Fragment key={block.key}>
          {block.kind === 'mermaid' ? (
            <MermaidDiagram chart={block.content} id={block.key} />
          ) : (
            <pre className="whitespace-pre-wrap font-sans">{block.content}</pre>
          )}
        </Fragment>
      ))}
    </div>
  )
}
