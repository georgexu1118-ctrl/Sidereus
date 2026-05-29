// Marketing layout — landing, about, pricing
// The atmospheric background is rendered here for the full-bleed experience.
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { TrendingUp, Zap } from 'lucide-react'

const AtmosphereBackground = dynamic(
  () => import('@/components/atmosphere/AtmosphereBackground'),
  { ssr: false }
)

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-void overflow-x-hidden">
      {/* Living atmospheric background */}
      <AtmosphereBackground />

      {/* Content layer sits above the atmosphere */}
      <div className="relative z-10">
        {/* ── Marketing nav ────────────────────────────────── */}
        <header className="fixed top-0 left-0 right-0 z-50">
          <nav className="flex items-center justify-between px-8 py-5 glass-heavy border-b border-white/[0.04]">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-lavender/80 to-morning-blue/60 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-void" strokeWidth={2.5} />
              </div>
              <span className="text-fog font-semibold tracking-tight">Sidereus</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {['Research', 'Supply Chain', 'Biotech', 'Pricing'].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase().replace(' ', '-')}`}
                  className="text-sm text-fog-dim hover:text-fog transition-colors duration-200"
                >
                  {item}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="hidden md:block text-sm text-fog-dim hover:text-fog transition-colors duration-200"
              >
                Sign in
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, rgba(181,166,216,0.15), rgba(143,169,216,0.10))',
                  border: '1px solid rgba(181,166,216,0.2)',
                  color: '#B5A6D8',
                }}
              >
                <Zap className="w-3.5 h-3.5" />
                Start Research
              </Link>
            </div>
          </nav>
        </header>

        {children}

        {/* ── Footer ─────────────────────────────────────── */}
        <footer className="glass-heavy border-t border-white/[0.04] mt-32 py-12 px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-lavender/80 to-morning-blue/60 flex items-center justify-center">
                  <TrendingUp className="w-3 h-3 text-void" strokeWidth={2.5} />
                </div>
                <span className="text-fog font-semibold text-sm">Sidereus</span>
              </div>
              <p className="text-xs text-fog-dim max-w-xs">
                AI-native institutional equity research. For professional use only.
                Not investment advice.
              </p>
            </div>

            <div className="flex gap-12">
              {[
                { group: 'Research', links: ['AI Supply Chain', 'Semiconductors', 'Biotech', 'Data Center'] },
                { group: 'Platform', links: ['Dashboard', 'Reports', 'Supply Chain', 'Knowledge Graph'] },
              ].map((section) => (
                <div key={section.group}>
                  <p className="research-label mb-3">{section.group}</p>
                  <ul className="space-y-2">
                    {section.links.map((link) => (
                      <li key={link}>
                        <Link href="#" className="text-xs text-fog-dim hover:text-fog transition-colors">
                          {link}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-fog-dim/60">© 2026 Sidereus Research. All rights reserved.</p>
            <p className="text-xs text-fog-dim/40">
              For professional and institutional use. Past performance is not indicative of future results.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}
