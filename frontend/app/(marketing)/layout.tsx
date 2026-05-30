import AtmosphereWrapper from '@/components/atmosphere/AtmosphereWrapper'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-void overflow-hidden">
      <AtmosphereWrapper />
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  )
}
