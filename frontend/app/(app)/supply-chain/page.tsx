import type { Metadata } from 'next'
import SupplyChainPage from '@/components/supply-chain/SupplyChainPage'

export const metadata: Metadata = {
  title: 'AI Supply Chain',
  description: 'Interactive AI supply chain dependency graph across the semiconductor ecosystem.',
}

export default function SupplyChainRoute() {
  return <SupplyChainPage />
}
