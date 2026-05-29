import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import Providers from '@/components/layout/Providers'

export const metadata: Metadata = {
  title: {
    default: 'Sidereus — AI-Native Equity Research OS',
    template: '%s | Sidereus',
  },
  description:
    'Institutional-grade investment research across AI infrastructure, semiconductors, and biotechnology. Powered by 10 specialized AI research agents.',
  keywords: [
    'equity research',
    'AI supply chain',
    'semiconductor analysis',
    'biotechnology research',
    'institutional research',
    'investment research',
    'NVIDIA',
    'ASML',
    'financial analysis',
  ],
  authors: [{ name: 'Sidereus Research' }],
  robots: {
    index: process.env.NODE_ENV === 'production',
    follow: process.env.NODE_ENV === 'production',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Sidereus — AI-Native Equity Research OS',
    description:
      'Institutional-grade investment research across AI infrastructure, semiconductors, and biotechnology.',
    siteName: 'Sidereus',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sidereus — AI-Native Equity Research OS',
    description:
      'Institutional-grade investment research across AI infrastructure, semiconductors, and biotechnology.',
  },
}

export const viewport: Viewport = {
  themeColor: '#0B0E13',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans bg-abyss text-fog antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
