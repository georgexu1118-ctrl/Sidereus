import type { Metadata } from 'next'
import BiotechPage from '@/components/biotech/BiotechPage'

export const metadata: Metadata = {
  title: 'Biotech Analysis',
  description: 'Institutional biotech research: drug pipelines, clinical trials, FDA pathways, and rNPV analysis.',
}

export default function BiotechRoute() {
  return <BiotechPage />
}
