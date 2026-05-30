import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const APP_LOGO = '/sidereus-nuncius-logo.jpg'

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-xl text-center">
        <img
          src={APP_LOGO}
          alt="Sidereus Nuncius title engraving"
          className="mx-auto mb-8 h-20 w-32 rounded-md border border-white/15 object-cover shadow-2xl"
        />
        <h1 className="text-5xl font-semibold tracking-normal text-fog sm:text-6xl">
          Sidereus
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-fog-dim">
          Institutional equity research, generated from a ticker.
        </p>
        <Link
          href="/dashboard"
          className="mt-10 inline-flex items-center gap-2 rounded-md border border-white/10 bg-fog px-5 py-3 text-sm font-semibold text-void transition hover:bg-fog/90"
        >
          Launch
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  )
}
