'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowRight, Zap, Shield, Activity } from 'lucide-react'
import GlassCard from '@/components/glass/GlassCard'

// Sample research data — represents what a real report shows
const SAMPLE_THESIS = {
  ticker: 'NVDA',
  name: 'NVIDIA Corporation',
  rating: 'BUY',
  target: 1400,
  current: 1150,
  upside: 21.7,
  thesis: [
    'Data center revenue inflecting toward AI training and inference workloads',
    'H200 and B200 GPUs commanding 3–4× ASP uplift vs. prior generation',
    'Software moat through CUDA ecosystem creates durable competitive barrier',
  ],
}

const SAMPLE_SUPPLY_CHAIN = [
  { ticker: 'ASML', role: 'EUV Lithography', exposure: 85, tier: 'Upstream' },
  { ticker: 'TSM', role: 'Advanced Foundry', exposure: 100, tier: 'Midstream' },
  { ticker: 'COHR', role: 'Optical Interconnect', exposure: 42, tier: 'Midstream' },
  { ticker: 'VRT', role: 'Thermal Management', exposure: 31, tier: 'Downstream' },
]

const SAMPLE_AGENT_ACTIVITY = [
  { agent: 'SEC Filing Agent', status: 'completed', time: '14s' },
  { agent: 'Financial Modeling', status: 'completed', time: '22s' },
  { agent: 'Skeptical Analyst', status: 'running', time: '...' },
  { agent: 'Portfolio Manager', status: 'pending', time: '—' },
]

function ResearchThesisPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32, rotate: -1.5 }}
      whileInView={{ opacity: 1, y: 0, rotate: -1.5 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="absolute -left-8 top-0 w-80"
      style={{ transform: 'rotate(-1.5deg)' }}
      animate={{ y: [0, -6, 0] }}
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <GlassCard gradient padding="lg" glow="blue">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-fog">{SAMPLE_THESIS.ticker}</span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(106,168,122,0.15)', color: '#6AA87A', border: '1px solid rgba(106,168,122,0.25)' }}
                >
                  {SAMPLE_THESIS.rating}
                </span>
              </div>
              <p className="text-xs text-fog-dim">{SAMPLE_THESIS.name}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold mono-nums text-fog">${SAMPLE_THESIS.target}</p>
              <p className="text-xs text-bull mono-nums">+{SAMPLE_THESIS.upside}%</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="research-label">Investment Thesis</p>
            {SAMPLE_THESIS.thesis.map((point, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-morning-blue mt-1.5 flex-shrink-0" />
                <p className="text-xs text-fog-dim leading-relaxed">{point}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-bull" />
              <span className="text-xs text-bull font-medium">Bull: $1,650</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-neutral" />
              <span className="text-xs text-neutral font-medium">Base: $1,400</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-bear" />
              <span className="text-xs text-bear font-medium">Bear: $820</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}

function SupplyChainPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: 1.5 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="absolute -right-8 top-12 w-72"
      style={{ transform: 'rotate(1.5deg)' }}
    >
      <motion.div
        animate={{ y: [0, -7, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      >
        <GlassCard gradient padding="md">
          <p className="research-label mb-3">AI Supply Chain — NVDA</p>
          <div className="space-y-2">
            {SAMPLE_SUPPLY_CHAIN.map((item) => (
              <div key={item.ticker} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md glass flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-bold text-fog-dim">{item.ticker.slice(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-fog">{item.ticker}</span>
                    <span className="text-[10px] text-fog-dim">{item.tier}</span>
                  </div>
                  <p className="text-[10px] text-fog-dim truncate">{item.role}</p>
                  <div className="mt-1 h-0.5 rounded-full bg-surface-high overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #8FA9D8, #B5A6D8)' }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.exposure}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}

function AgentActivityPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="absolute right-16 bottom-0 w-64"
    >
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
      >
        <GlassCard padding="md" variant="elevated">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5 text-gold" />
            <p className="text-xs font-semibold text-fog">Agent Activity</p>
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-bull animate-pulse-soft" />
          </div>
          <div className="space-y-2.5">
            {SAMPLE_AGENT_ACTIVITY.map((item) => (
              <div key={item.agent} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      item.status === 'completed'
                        ? 'bg-bull'
                        : item.status === 'running'
                          ? 'bg-gold animate-pulse-soft'
                          : 'bg-fog-dim/30'
                    }`}
                  />
                  <span className="text-[11px] text-fog-dim truncate">{item.agent}</span>
                </div>
                <span className="text-[10px] mono-nums text-fog-dim/60 flex-shrink-0">{item.time}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.05]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-fog-dim">Progress</span>
              <span className="text-[10px] mono-nums text-morning-blue">2 / 4</span>
            </div>
            <div className="mt-1.5 h-0.5 rounded-full bg-surface-high overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-morning-blue to-lavender"
                initial={{ width: '0%' }}
                whileInView={{ width: '50%' }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, delay: 0.5 }}
              />
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}

export default function FloatingPanels() {
  return (
    <section className="relative z-10 py-24 px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.p
            className="research-label mb-3"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            Institutional Research Intelligence
          </motion.p>
          <motion.h2
            className="text-4xl md:text-5xl font-bold tracking-tight text-gradient-white"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Think like Serenity.
            <br />
            <span className="text-gradient-lavender">Move at machine speed.</span>
          </motion.h2>
          <motion.p
            className="mt-5 text-fog-dim text-lg max-w-xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Ten specialized agents reason independently — SEC filings, earnings, supply chain
            mapping, financial modeling, valuation, and devil's advocate analysis — then
            synthesize into a single institutional report.
          </motion.p>
        </div>

        {/* Floating panels relative to a center anchor */}
        <div className="relative h-96 md:h-[480px] max-w-4xl mx-auto">
          <ResearchThesisPanel />
          <SupplyChainPanel />
          <AgentActivityPanel />

          {/* Center accent */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div
              className="w-24 h-24 rounded-2xl glass-heavy flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(181,166,216,0.12), rgba(143,169,216,0.08))',
                border: '1px solid rgba(181,166,216,0.2)',
                boxShadow: '0 0 48px rgba(181,166,216,0.08)',
              }}
            >
              <Shield className="w-10 h-10 text-lavender/80" strokeWidth={1.25} />
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-16 flex justify-center"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <a
            href="/research/NVDA"
            className="group flex items-center gap-2 text-sm text-morning-blue hover:text-fog transition-colors duration-200"
          >
            View full NVDA research report
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
