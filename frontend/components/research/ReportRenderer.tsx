'use client'

import { Fragment } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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
 * Split a markdown report into text + mermaid blocks so mermaid code fences
 * render as actual SVG diagrams instead of raw code.
 */
function splitBlocks(markdown: string): Block[] {
  const blocks: Block[] = []
  const fence = /```(?:mermaid)\s*\n([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let i = 0

  while ((match = fence.exec(markdown)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ kind: 'text', content: markdown.slice(lastIndex, match.index), key: `t-${i++}` })
    }
    blocks.push({ kind: 'mermaid', content: match[1].trim(), key: `m-${i++}` })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < markdown.length) {
    blocks.push({ kind: 'text', content: markdown.slice(lastIndex), key: `t-${i++}` })
  }
  return blocks.length ? blocks : [{ kind: 'text', content: markdown, key: 't-0' }]
}

// Section titles render as bold subtitles — no '#' hashes, no big heading sizes.
const mdComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <p className="mt-7 mb-3 text-[15px] font-bold tracking-tight text-[#171510] first:mt-0">{children}</p>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <p className="mt-6 mb-2.5 text-[15px] font-bold tracking-tight text-[#171510]">{children}</p>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <p className="mt-5 mb-2 text-[14px] font-bold tracking-tight text-[#171510]">{children}</p>
  ),
  h4: ({ children }: { children?: React.ReactNode }) => (
    <p className="mt-4 mb-2 text-[13.5px] font-bold tracking-tight text-[#171510]">{children}</p>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-3.5 text-[13.5px] leading-7 text-[#26221a]">{children}</p>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-bold text-[#171510]">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-3.5 ml-5 list-disc space-y-1.5 text-[13.5px] leading-7 text-[#26221a] marker:text-[#9c8f6a]">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-3.5 ml-5 list-decimal space-y-1.5 text-[13.5px] leading-7 text-[#26221a] marker:text-[#9c8f6a]">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => <li className="pl-1">{children}</li>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="my-4 border-l-2 border-[#c9b88a] bg-black/[0.03] py-1 pl-4 text-[13px] italic text-[#4a4534]">{children}</blockquote>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#5a4fa0] underline decoration-[#5a4fa0]/40 underline-offset-2 hover:decoration-[#5a4fa0]">{children}</a>
  ),
  hr: () => <hr className="my-5 border-black/10" />,
  code: ({ children }: { children?: React.ReactNode }) => (
    <code className="rounded bg-black/[0.06] px-1 py-0.5 font-mono text-[12px] text-[#3a3527]">{children}</code>
  ),
  // GFM tables
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px]">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="border-b-2 border-black/15">{children}</thead>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-3 py-2 text-left font-bold text-[#171510]">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border-b border-black/[0.07] px-3 py-2 align-top text-[#26221a]">{children}</td>
  ),
}

export default function ReportRenderer({ markdown }: ReportRendererProps) {
  const blocks = splitBlocks(markdown)

  return (
    <div>
      {blocks.map((block) =>
        block.kind === 'mermaid' ? (
          <div key={block.key} className="my-5">
            <MermaidDiagram chart={block.content} id={block.key} />
          </div>
        ) : (
          <Fragment key={block.key}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
              {block.content}
            </ReactMarkdown>
          </Fragment>
        )
      )}
    </div>
  )
}
