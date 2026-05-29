import type { Metadata } from 'next'
import CompanyResearchPage from '@/components/research/CompanyResearchPage'

interface Props {
  params: Promise<{ ticker: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ticker } = await params
  return {
    title: `${ticker.toUpperCase()} — Research Report`,
    description: `Institutional equity research report for ${ticker.toUpperCase()}.`,
  }
}

export default async function ResearchTickerPage({ params }: Props) {
  const { ticker } = await params
  return <CompanyResearchPage ticker={ticker.toUpperCase()} />
}
