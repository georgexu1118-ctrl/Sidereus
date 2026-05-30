import Link from 'next/link'
import AtmosphereWrapper from '@/components/atmosphere/AtmosphereWrapper'

const APP_LOGO = '/sidereus-nuncius-logo.jpg'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-void">
      <AtmosphereWrapper />
      <header className="relative z-10 border-b border-white/[0.06] bg-void/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <img
              src={APP_LOGO}
              alt="Sidereus Nuncius title engraving"
              className="h-9 w-12 rounded-md border border-white/15 object-cover"
            />
            <span className="text-base font-semibold tracking-normal text-fog">Sidereus</span>
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-fog-dim transition hover:text-fog"
          >
            Research
          </Link>
        </div>
      </header>
      <main className="relative z-10 min-h-[calc(100vh-4rem)]">{children}</main>
    </div>
  )
}
