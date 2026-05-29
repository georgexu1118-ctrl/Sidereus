import Hero from '@/components/landing/Hero'
import SectorCards from '@/components/landing/SectorCards'
import FloatingPanels from '@/components/landing/FloatingPanels'
import StatsBar from '@/components/landing/StatsBar'
import AgentSection from '@/components/landing/AgentSection'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <StatsBar />
      <FloatingPanels />
      <SectorCards />
      <AgentSection />
    </main>
  )
}
