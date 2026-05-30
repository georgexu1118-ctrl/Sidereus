'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import Link from 'next/link'
import { ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react'

const HEADLINE_WORDS = ['Sidereus', 'Nuncius']

function MagneticButton({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Link href={href}>{children}</Link>
    </motion.div>
  )
}

const FEATURES = [
  { icon: Zap, label: '10 Specialized Agents', color: '#E0B96A' },
  { icon: Shield, label: 'Institutional Quality', color: '#8FA9D8' },
  { icon: TrendingUp, label: 'Price Target Generation', color: '#B5A6D8' },
]

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <section
      ref={ref}
      className="relative flex flex-col items-center justify-center min-h-screen pt-24 pb-16 px-4 overflow-hidden"
    >
      {/* Subtle radial gradient centered on hero */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(94,111,163,0.08) 0%, transparent 70%)',
        }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-6xl mx-auto"
        style={{ y, opacity }}
      >
        {/* ── Pre-badge ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="micro-badge mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse-soft" />
          New generation of research intelligence
        </motion.div>

        {/* ── Main headline ─────────────────────────────────── */}
        <h1 className="mb-4">
          <span className="block">
            {HEADLINE_WORDS.map((word, i) => (
              <motion.span
                key={word}
                className="inline-block mr-[0.2em]"
                initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                <span
                  style={{
                    fontSize: 'clamp(40px, 5.5vw, 72px)',
                    fontWeight: 600,
                    lineHeight: 1.05,
                    letterSpacing: '-0.02em',
                    color: '#F4F4F2',
                  }}
                >
                  {word}
                </span>
              </motion.span>
            ))}
          </span>
        </h1>

        {/* ── Subheadline ──────────────────────────────────── */}
        <motion.p
          className="mt-6 text-fog-dim text-lg md:text-xl max-w-2xl leading-relaxed"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.65, ease: 'easeOut' }}
        >
          Institutional-grade intelligence across AI infrastructure, semiconductors, and
          biotechnology — powered by 10 specialized research agents.
        </motion.p>

        {/* ── CTA row ─────────────────────────────────────── */}
        <motion.div
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8, ease: 'easeOut' }}
        >
          <MagneticButton href="/dashboard">
            <div
              className="group flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(181,166,216,0.22), rgba(143,169,216,0.14))',
                border: '1px solid rgba(181,166,216,0.28)',
                color: '#F4F4F2',
                boxShadow: '0 0 32px rgba(181,166,216,0.08)',
              }}
            >
              Start Research
              <motion.span
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight className="w-4 h-4" />
              </motion.span>
            </div>
          </MagneticButton>

          <MagneticButton href="/research/NVDA">
            <div className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-medium text-fog-dim hover:text-fog transition-colors duration-200">
              View Sample Report
            </div>
          </MagneticButton>
        </motion.div>

        {/* ── Feature pills ────────────────────────────────── */}
        <motion.div
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.0 }}
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.label}
                className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium"
                style={{
                  background: `${feature.color}0f`,
                  border: `1px solid ${feature.color}20`,
                  color: feature.color,
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {feature.label}
              </div>
            )
          })}
        </motion.div>

        {/* ── Scroll hint ──────────────────────────────────── */}
        <motion.div
          className="mt-20 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.3 }}
        >
          <span className="research-label text-[10px]">Scroll to explore</span>
          <motion.div
            className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center pt-1.5"
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="w-1 h-2 rounded-full bg-fog-dim/40" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
