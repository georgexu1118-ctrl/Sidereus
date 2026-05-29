import type { Metadata } from 'next'
import KnowledgeGraphPage from '@/components/knowledge-graph/KnowledgeGraphPage'

export const metadata: Metadata = {
  title: 'Knowledge Graph',
  description: 'Entity relationship graph connecting companies, products, executives, and clinical assets.',
}

export default function KnowledgeGraphRoute() {
  return <KnowledgeGraphPage />
}
