import type { Metadata } from 'next'
import DashboardClient from '@/components/dashboard/DashboardClient'

export const metadata: Metadata = {
  title: 'Research Dashboard',
}

export default function DashboardPage() {
  return <DashboardClient />
}
