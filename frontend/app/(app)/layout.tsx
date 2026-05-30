// App shell layout — all authenticated pages live here.
// The atmospheric background runs at a lower z-index so content floats above it.
import Navigation from '@/components/layout/Navigation'
import AtmosphereWrapper from '@/components/atmosphere/AtmosphereWrapper'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-screen overflow-hidden bg-void">
      {/* Living atmospheric background (client component wrapper) */}
      <AtmosphereWrapper />

      {/* Sidebar */}
      <aside className="relative z-10 w-56 flex-shrink-0 hidden md:block">
        <Navigation />
      </aside>

      {/* Main content */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        {/* Subtle gradient overlay to separate from sidebar */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 70% 30%, rgba(94,111,163,0.04) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 min-h-full">{children}</div>
      </main>
    </div>
  )
}
