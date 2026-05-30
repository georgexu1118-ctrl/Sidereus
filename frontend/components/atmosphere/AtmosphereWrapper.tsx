'use client'

import dynamic from 'next/dynamic'

// Dynamic import with ssr:false must live in a Client Component in Next.js 15.
const AtmosphereBackground = dynamic(
  () => import('./AtmosphereBackground'),
  { ssr: false }
)

export default function AtmosphereWrapper() {
  return <AtmosphereBackground />
}
