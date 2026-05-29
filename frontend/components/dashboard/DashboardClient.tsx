'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Plus, TrendingUp, TrendingDown, Zap, FileText, Activity } from 'lucide-react'
import GlassCard from '@/components/glass/GlassCard'
import MetricCard from '@/components/glass/MetricCard'
import { formatPrice, formatPct, formatMarketCap, getChangeColor, getDomainBadgeClass } from '@/lib/utils'
import { MOCK_TICKERS } from '@/lib/constants'
import Link from 'next/link'

// Demo market data
const MARKET_SNAPSHOT = [
  { ticker: 'NVDA', price: 1152.35, change: 2.41, domain: 'AI Supply Chain', cap: 2.83e12 },
  { ticker: 'ASML', price: 987.12, change: -0.83, domain: 'Semiconductors', cap: 388e9 },
  { ticker: 'VRT', price: 112.45, change: 4.17, domain: 'Data Center', cap: 44e9 },
  { ticker: 'MRNA', price: 68.22, change: -1.24, domain: 'Biotechnology', cap: 26e9 },
  { ticker: 'AVGO', price: 1844.10, change: 1.67, domain: 'AI Supply Chain', cap: 858e9 },
  { ticker: 'ANET', price: 402.80, change: 0.92, domain: 'Data Center', cap: 127e9 },
]

const RECENT_REPORTS = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation', rating: 'BUY', target: 1400, date: '2026-05-28', domain: 'AI Supply Chain' },
  { ticker: 'ASML', name: 'ASML Holding', rating: 'BUY', target: 1100, date: '2026-05-25', domain: 'Semiconductors' },
  { ticker: 'VRT', name: 'Vertiv Holdings', rating: 'OUTPERFORM', target: 145, date: '2026-05-21', domain: 'Data Center' },
  { ticker: 'MRNA', name: 'Moderna Inc.', rating: 'HOLD', target: 72, date: '2026-05-18', domain: 'Biotechnology' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

function ResearchTicker({ item }: { item: typeof MARKET_SNAPSHOT[0] }) {
  const up = item.change >= 0
  return (
    <Link href={`/research/${item.ticker}`}>
      <motion.div
        className="glass-card rounded-xl p-4 cursor-pointer group"
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-fog text-base">{item.ticker}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getDomainBadgeClass(item.domain)} border`}>
              {item.domain}
            </span>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold mono-nums text-fog">{formatPrice(item.price)}</p>
            <div className={`flex items-center gap-1 justify-end ${getChangeColor(item.change)}`}>
              {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="text-xs mono-nums font-medium">{formatPct(item.change)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-fog-dim">Mkt Cap</span>
          <span className="text-[11px] mono-nums text-fog-dim">{formatMarketCap(item.cap)}</span>
        </div>
      </motion.div>
    </Link>
  )
}

function ReportRow({ report }: { report: typeof RECENT_REPORTS[0] }) {
  const upside = ((report.target / (MARKET_SNAPSHOT.find(m => m.ticker === report.ticker)?.price ?? report.target)) - 1) * 100
  const ratingColor = report.rating === 'BUY' || report.rating === 'OUTPERFORM' ? 'text-bull' : report.rating === 'SELL' ? 'text-bear' : 'text-neutral'
  return (
    <Link href={`/research/${report.ticker}`}>
      <motion.div
        className="flex items-center gap-4 px-4 py-3.5 rounded-lg hover:bg-white/[0.03] transition-colors duration-150 cursor-pointer group"
        whileHover={{ x: 2, transition: { duration: 0.15 } }}
      >
        <div className="w-9 h-9 rounded-lg glass flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-bold text-fog-dim">{report.ticker.slice(0, 2)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-fog truncate">{report.name}</p>
          <p className="text-xs text-fog-dim">{report.date}</p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className={`text-xs font-semibold ${ratingColor}`}>{report.rating}</span>
          <span className="text-xs mono-nums text-fog-dim hidden sm:block">{formatPrice(report.target)}</span>
          <span className={`text-xs mono-nums hidden md:block ${upside > 0 ? 'text-bull' : 'text-bear'}`}>
            {formatPct(upside)}
          </span>
        </div>
      </motion.div>
    </Link>
  )
}

export default function DashboardClient() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* ── Page header ─────────────────────────────────────────── */}
      <motion.div
        className="flex items-center justify-between mb-8"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <p className="research-label mb-1">Research Workspace</p>
          <h1 className="text-2xl font-bold text-fog tracking-tight">Dashboard</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fog-dim/50" />
            <input
              type="text"
              placeholder="Search ticker…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-surface/50 border border-white/[0.06] rounded-lg text-sm text-fog placeholder:text-fog-dim/40 focus:outline-none focus:ring-1 focus:ring-indigo/40 focus:border-indigo/30 transition-all duration-200 w-40 focus:w-56"
            />
          </div>

          <Link href="/research/NVDA">
            <motion.button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-fog transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, rgba(181,166,216,0.18), rgba(143,169,216,0.10))',
                border: '1px solid rgba(181,166,216,0.22)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-4 h-4" />
              New Report
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* ── KPI metrics row ──────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[
          { label: 'Reports Generated', value: '24', icon: <FileText className="w-4 h-4 text-lavender" />, accent: '#B5A6D8', change: 8.3, changeLabel: 'this month' },
          { label: 'Avg Price Target Upside', value: '+18.4%', icon: <TrendingUp className="w-4 h-4 text-bull" />, accent: '#6AA87A', change: 2.1, changeLabel: 'vs last month' },
          { label: 'Agents Running', value: '3', icon: <Zap className="w-4 h-4 text-gold" />, accent: '#E0B96A' },
          { label: 'Watchlist Items', value: '12', icon: <Activity className="w-4 h-4 text-morning-blue" />, accent: '#8FA9D8', change: 20, changeLabel: 'added this week' },
        ].map((metric, i) => (
          <motion.div key={metric.label} variants={itemVariants}>
            <MetricCard {...metric} delay={i * 0.06} />
          </motion.div>
        ))}
      </motion.div>

      {/* ── Main content grid ─────────────────────────────────────── */}
      <motion.div
        className="grid grid-cols-1 xl:grid-cols-3 gap-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Market watch (2/3 width) ─────────────────────────── */}
        <motion.div className="xl:col-span-2 space-y-4" variants={itemVariants}>
          <GlassCard padding="none" noHover>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
              <h2 className="text-sm font-semibold text-fog">Coverage Universe</h2>
              <span className="text-xs text-fog-dim/60">Live</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
              {MARKET_SNAPSHOT.map((item) => (
                <ResearchTicker key={item.ticker} item={item} />
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* ── Recent reports (1/3 width) ────────────────────────── */}
        <motion.div variants={itemVariants}>
          <GlassCard padding="none" noHover className="h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
              <h2 className="text-sm font-semibold text-fog">Recent Reports</h2>
              <Link href="/research" className="text-xs text-morning-blue hover:text-fog transition-colors">
                View all
              </Link>
            </div>
            <div className="py-2">
              {RECENT_REPORTS.map((report) => (
                <ReportRow key={report.ticker} report={report} />
              ))}
            </div>

            {/* Generate new */}
            <div className="px-4 py-4 border-t border-white/[0.05]">
              <Link href="/research/new">
                <motion.div
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-fog-dim hover:text-fog transition-colors duration-200 border border-dashed border-white/[0.08] hover:border-white/[0.14]"
                  whileHover={{ y: -1 }}
                >
                  <Plus className="w-4 h-4" />
                  Generate research report
                </motion.div>
              </Link>
            </div>
          </GlassCard>
        </motion.div>
      </motion.div>

      {/* ── Quick access row ─────────────────────────────────────── */}
      <motion.div
        className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {MOCK_TICKERS.slice(0, 4).map((t) => (
          <Link key={t.ticker} href={`/research/${t.ticker}`}>
            <motion.div
              className="glass-card rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer group"
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
            >
              <div className="w-7 h-7 rounded-md bg-surface-high flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-fog-dim">{t.ticker.slice(0, 2)}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-fog">{t.ticker}</p>
                <p className="text-[10px] text-fog-dim truncate">{t.name.split(' ')[0]}</p>
              </div>
            </motion.div>
          </Link>
        ))}
      </motion.div>
    </div>
  )
}
