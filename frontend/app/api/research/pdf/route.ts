import { NextRequest, NextResponse } from 'next/server'

type PdfBody = {
  ticker?: string
  title?: string
  markdown?: string
}

const PAGE_WIDTH = 612
const PAGE_HEIGHT = 792
const LEFT = 54
const TOP = 54
const LINE_HEIGHT = 14
const MAX_CHARS = 92

function escapePdfText(text: string) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
}

function wrapLine(line: string) {
  const cleaned = line
    .replace(/^#{1,6}\s+/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/`/g, '')

  if (cleaned.length <= MAX_CHARS) return [cleaned]

  const words = cleaned.split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > MAX_CHARS) {
      if (current) lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines
}

function paginate(markdown: string) {
  const pages: string[][] = [[]]
  const maxLines = Math.floor((PAGE_HEIGHT - TOP * 2) / LINE_HEIGHT)

  for (const rawLine of markdown.split('\n')) {
    const wrapped = rawLine.trim() ? wrapLine(rawLine) : ['']
    for (const line of wrapped) {
      const page = pages[pages.length - 1]
      if (page.length >= maxLines) pages.push([])
      pages[pages.length - 1].push(line)
    }
  }

  return pages
}

function buildPdf(title: string, markdown: string) {
  const pages = paginate(`# ${title}\n\n${markdown}`)
  const objects: string[] = []
  const pageObjectIds: number[] = []

  objects.push('<< /Type /Catalog /Pages 2 0 R >>')
  objects.push('PAGES_PLACEHOLDER')
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')

  pages.forEach((lines, index) => {
    const contentId = objects.length + 2
    const pageId = objects.length + 1
    pageObjectIds.push(pageId)

    const text = lines
      .map((line, lineIndex) => {
        const y = PAGE_HEIGHT - TOP - lineIndex * LINE_HEIGHT
        const size = index === 0 && lineIndex === 0 ? 14 : 10
        return `BT /F1 ${size} Tf ${LEFT} ${y} Td (${escapePdfText(line)}) Tj ET`
      })
      .join('\n')

    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`)
    objects.push(`<< /Length ${Buffer.byteLength(text, 'utf8')} >>\nstream\n${text}\nendstream`)
  })

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })

  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return Buffer.from(pdf, 'utf8')
}

export async function POST(req: NextRequest) {
  const body = await req.json() as PdfBody
  const ticker = (body.ticker || 'SIDEREUS').toUpperCase().replace(/[^A-Z0-9.-]/g, '')
  const title = body.title || `${ticker} Research Report`
  const markdown = body.markdown || 'No report content was provided.'
  const pdf = buildPdf(title, markdown)

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${ticker}_sidereus_research.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
