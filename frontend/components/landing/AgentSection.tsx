'use client'

import { motion } from 'framer-motion'
import { AGENT_NAMES, AGENT_COLORS } from '@/lib/constants'
import GlassCard from '@/components/glass/GlassCard'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const AGENT_DESCRIPTIONS: Record<string, string> = {
  data_collection: 'Market data, price history, fundamentals via yfinance and live feeds',
  sec_filing: '10-K and 10-Q EDGAR parsing — risk factors, MD&A, capital allocation',
  earnings_call: 'Transcript analysis, management credibility scoring, guidance parsing',
  industry_research: 'TAM sizing, supply chain mapping, competitive dynamics',
  financial_modeling: 'Three-statement model, unit economics, scenario projections',
  valuation: 'DCF, EV/EBITDA comps, sum-of-parts, probability-weighted price target',
  competitive_intelligence: 'Moat rating, disruption risk, whitespace opportunity mapping',
  risk_assessment: 'Systematic risk scoring, tail risk identification, factor exposure',
  skeptical_analyst: 'Thesis attack — what is consensus missing? What assumptions are wrong?',
  portfolio_manager: 'Final synthesis — conviction level, position sizing, monitoring KPIs',
}

const AGENT_KEYS = Object.keys(AGENT_NAMES)

export default function AgentSection() {
  return (
    <section className="relative z-10 py-24 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <motion.p
            className="research-label mb-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Research Architecture
          </motion.p>
          <motion.h2
            className="text-4xl md:text-5xl font-bold tracking-tight text-gradient-white"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            10 agents.
            <br />
            <span className="text-gradient-lavender">One institutional verdict.</span>
          </motion.h2>
          <motion.p
            className="mt-5 text-fog-dim text-base max-w-lg mx-auto"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            Each agent reasons independently. The portfolio manager synthesizes all outputs
            into a single investment conclusion.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {AGENT_KEYS.map((key, i) => {
            const color = AGENT_COLORS[key] ?? '#8FA9D8'
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.45, delay: i * 0.05, ease: 'easeOut' }}
              >
                <GlassCard padding="md" noHover={false} className="h-full">
                  {/* Agent number */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[10px] font-bold mono-nums"
                      style={{ color: `${color}80` }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color, opacity: 0.7 }}
                    />
                  </div>

                  {/* Name */}
                  <p className="text-sm font-semibold text-fog mb-2" style={{ color }}>
                    {AGENT_NAMES[key]}
                  </p>

                  {/* Description */}
                  <p className="text-[11px] text-fog-dim leading-relaxed">
                    {AGENT_DESCRIPTIONS[key]}
                  </p>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>

        {/* CTA */}
        <motion.div
          className="mt-16 flex flex-col items-center gap-6"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Link
            href="/dashboard"
            className="group flex items-center gap-2.5 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, rgba(181,166,216,0.20), rgba(94,111,163,0.12))',
              border: '1px solid rgba(181,166,216,0.25)',
              color: '#F4F4F2',
              boxShadow: '0 0 40px rgba(181,166,216,0.06)',
            }}
          >
            Generate Your First Report
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
          <p className="text-xs text-fog-dim/60">
            Professional and institutional use only. Not investment advice.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
