'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Download, RefreshCw, ChevronRight,
  BarChart3, Shield, AlertTriangle, Zap, Target, BookOpen, Activity,
  ExternalLink, Share2,
} from 'lucide-react'
import GlassCard from '@/components/glass/GlassCard'
import MetricCard from '@/components/glass/MetricCard'
import { formatPrice, formatPct, formatMarketCap, getChangeColor, getDomainBadgeClass } from '@/lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from 'recharts'

// ── Demo data for NVDA ─────────────────────────────────────────
const DEMO_DATA: Record<string, {
  name: string; domain: string; price: number; change: number; cap: number;
  pe: number; ps: number; evEbitda: number;
  rating: string; target: number; bull: number; base: number; bear: number;
  pBull: number; pBase: number; pBear: number;
  thesis: string; thesis_points: string[];
  bull_case: string; base_case: string; bear_case: string;
  catalysts: string[]; risks: string[];
  variant: string; conclusion: string;
  revenue: { year: string; value: number; growth: number }[];
  segments: { name: string; rev: number; pct: number; color: string }[];
}> = {
  NVDA: {
    name: 'NVIDIA Corporation', domain: 'AI Supply Chain',
    price: 1152.35, change: 2.41, cap: 2.83e12,
    pe: 52.4, ps: 28.1, evEbitda: 44.8,
    rating: 'BUY', target: 1400, bull: 1900, base: 1400, bear: 680,
    pBull: 0.35, pBase: 0.45, pBear: 0.20,
    thesis: "NVIDIA represents the defining infrastructure pick of the AI supercycle. The company's dominant position in GPU compute — underpinned by the CUDA software moat — creates a multi-year compounding opportunity as hyperscaler AI capex accelerates toward $300B+ annually. The H200/B200 generation commands 3–4x ASP uplift over prior generation, and Blackwell architecture is designed to become the default platform for frontier model training.",
    thesis_points: [
      'Data center revenue compounding at 120%+ YoY, driven by hyperscaler and sovereign AI demand',
      'CUDA ecosystem lock-in: 4M+ developers, 20K+ libraries create a network-effect moat',
      'H200 → B200 → R100 roadmap accelerates compute density 2–3× per generation',
      'Networking (InfiniBand, NVLink, Spectrum-X) becoming a significant margin-accretive segment',
      'Sovereign AI tailwind — 30+ countries building national AI infrastructure on NVIDIA stack',
    ],
    bull_case: 'Hyperscaler AI capex sustains $350B+ run-rate through 2027; CUDA moat proves impenetrable to AMD/Intel; NIM microservices platform generates recurring software revenue at 80%+ gross margin; Blackwell demand exceeds supply through 2026; sovereign AI becomes a $20B+ annual segment.',
    base_case: 'AI capex moderates from current pace but remains elevated at $200–250B; NVIDIA retains 75%+ data center GPU market share; B200 ramp is smooth; networking segment grows 40%+ annually; FY2026 revenue reaches $175B at 65% gross margin.',
    bear_case: 'Hyperscaler customers accelerate in-house ASIC programs (TPU, Trainium, Maia), reducing NVIDIA GPU allocation; export controls materially impair China/Middle East sales; AMD MI400 or Cerebras achieves price-performance parity; capex cycle enters digestion period in 2H25.',
    catalysts: [
      'Blackwell GB200 NVL72 system volume ramp (Q1 FY26)',
      'Quarterly data center revenue run-rate crossing $50B',
      'CUDA software / NIM platform monetization announcement',
      'Sovereign AI infrastructure wins — Middle East, EU, Japan',
      'R100 "Rubin" architecture reveal at GTC 2026',
    ],
    risks: [
      'US export controls expanding to additional geographies',
      'Hyperscaler ASIC insourcing (Google TPU, Amazon Trainium) reducing GPU allocation',
      'Supply chain constraints at TSMC CoWoS and HBM3E (Micron, SK Hynix)',
      'Valuation compression if AI capex cycle disappoints consensus',
      'AMD MI300X/MI400 gaining meaningful enterprise/cloud share',
    ],
    variant: 'Consensus is modeling a capex digestion period in 2H25 that does not materialize. Our proprietary conversations with cloud architects and NVIDIA\'s order backlog data suggest Blackwell demand is structurally supply-constrained through mid-2026. The market is also undervaluing the networking segment, which we model at $25B revenue by FY27 at 70%+ gross margins — a business alone worth $400/share on a 30× earnings basis.',
    conclusion: 'NVDA remains the highest-conviction long in our AI infrastructure coverage. At 28× FY27E revenue, the stock is pricing in deceleration that our supply chain work does not support. We maintain BUY with a $1,400 base case price target and see a clear path to $1,900 in the bull case as Blackwell ramps, networking scales, and software monetization emerges.',
    revenue: [
      { year: 'FY22', value: 26.9, growth: 61 },
      { year: 'FY23', value: 26.9, growth: 0 },
      { year: 'FY24', value: 60.9, growth: 126 },
      { year: 'FY25E', value: 128.0, growth: 110 },
      { year: 'FY26E', value: 175.0, growth: 37 },
      { year: 'FY27E', value: 215.0, growth: 23 },
    ],
    segments: [
      { name: 'Data Center', rev: 87.5, pct: 87, color: '#8FA9D8' },
      { name: 'Gaming', rev: 5.1, pct: 5, color: '#B5A6D8' },
      { name: 'Professional Viz', rev: 1.9, pct: 2, color: '#E0B96A' },
      { name: 'Automotive', rev: 2.9, pct: 3, color: '#E4B8A0' },
      { name: 'OEM & Other', rev: 2.6, pct: 3, color: '#5E6FA3' },
    ],
  },
}

const PRICE_HISTORY = Array.from({ length: 60 }, (_, i) => ({
  date: `D-${60 - i}`,
  price: 950 + Math.sin(i * 0.15) * 80 + i * 3.5 + Math.random() * 30,
}))

type TabKey = 'thesis' | 'financials' | 'valuation' | 'risks' | 'supply-chain'

const TABS: { key: TabKey; label: string; icon: typeof BookOpen }[] = [
  { key: 'thesis', label: 'Investment Thesis', icon: BookOpen },
  { key: 'financials', label: 'Financials', icon: BarChart3 },
  { key: 'valuation', label: 'Valuation', icon: Target },
  { key: 'risks', label: 'Risks', icon: Shield },
  { key: 'supply-chain', label: 'Supply Chain', icon: Activity },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass px-3 py-2 rounded-lg text-xs">
      <p className="text-fog-dim">{label}</p>
      <p className="text-fog font-semibold mono-nums">{formatPrice(payload[0].value)}</p>
    </div>
  )
}

export default function CompanyResearchPage({ ticker }: { ticker: string }) {
  const [activeTab, setActiveTab] = useState<TabKey>('thesis')
  const [generating, setGenerating] = useState(false)

  const data = DEMO_DATA[ticker] ?? DEMO_DATA.NVDA
  const upside = ((data.target / data.price) - 1) * 100
  const isUp = data.change >= 0

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => setGenerating(false), 3000)
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* ── Company header ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
          <div className="flex items-start gap-4">
            {/* Logo placeholder */}
            <div className="w-12 h-12 rounded-xl glass flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-fog-dim">{ticker.slice(0, 2)}</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-fog tracking-tight">{ticker}</h1>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getDomainBadgeClass(data.domain)}`}>
                  {data.domain}
                </span>
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-bold border"
                  style={
                    data.rating === 'BUY'
                      ? { background: 'rgba(106,168,122,0.12)', color: '#6AA87A', borderColor: 'rgba(106,168,122,0.25)' }
                      : { background: 'rgba(143,169,216,0.12)', color: '#8FA9D8', borderColor: 'rgba(143,169,216,0.25)' }
                  }
                >
                  {data.rating}
                </span>
              </div>
              <p className="text-fog-dim text-sm mt-0.5">{data.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-fog transition-all duration-200 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, rgba(181,166,216,0.18), rgba(143,169,216,0.10))',
                border: '1px solid rgba(181,166,216,0.22)',
              }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Running Agents…' : 'Re-generate'}
            </button>
            <button className="p-2 rounded-lg glass text-fog-dim hover:text-fog transition-colors">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg glass text-fog-dim hover:text-fog transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Price + key metrics row ────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        <GlassCard padding="md" gradient>
          <p className="research-label mb-1.5">Current Price</p>
          <p className="text-2xl font-bold mono-nums text-fog">{formatPrice(data.price)}</p>
          <div className={`flex items-center gap-1 mt-1 ${getChangeColor(data.change)}`}>
            {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span className="text-sm mono-nums font-medium">{formatPct(data.change)}</span>
          </div>
        </GlassCard>

        <GlassCard padding="md">
          <p className="research-label mb-1.5">Price Target</p>
          <p className="text-2xl font-bold mono-nums text-fog">{formatPrice(data.target)}</p>
          <p className={`text-sm mono-nums font-medium mt-1 ${upside > 0 ? 'text-bull' : 'text-bear'}`}>
            {formatPct(upside)} upside
          </p>
        </GlassCard>

        <GlassCard padding="md">
          <p className="research-label mb-1.5">Market Cap</p>
          <p className="text-2xl font-bold mono-nums text-fog">{formatMarketCap(data.cap)}</p>
          <p className="text-xs text-fog-dim mt-1">EV/EBITDA {data.evEbitda}×</p>
        </GlassCard>

        <GlassCard padding="md">
          <p className="research-label mb-1.5">Valuation</p>
          <p className="text-2xl font-bold mono-nums text-fog">{data.pe}×</p>
          <p className="text-xs text-fog-dim mt-1">P/E · P/S {data.ps}×</p>
        </GlassCard>
      </motion.div>

      {/* ── Price chart ────────────────────────────────────────── */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14 }}
      >
        <GlassCard padding="none" noHover>
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-fog">Price History (60D)</h3>
            <span className="text-xs text-fog-dim">Sidereus Demo</span>
          </div>
          <div className="h-48 px-4 pb-4 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PRICE_HISTORY} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8FA9D8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8FA9D8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#888884' }} tickLine={false} axisLine={false} interval={14} />
                <YAxis
                  tick={{ fontSize: 9, fill: '#888884' }} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `$${Math.round(v)}`}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="price" stroke="#8FA9D8" strokeWidth={1.5} fill="url(#priceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </motion.div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {/* Tab bar */}
        <div className="flex gap-1 mb-5 overflow-x-auto pb-px">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${
                  active ? 'text-morning-blue' : 'text-fog-dim hover:text-fog'
                }`}
                style={active ? { background: 'rgba(143,169,216,0.10)', border: '1px solid rgba(143,169,216,0.18)' } : {}}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 'thesis' && (
              <div className="space-y-5">
                {/* Main thesis */}
                <GlassCard padding="lg">
                  <p className="research-label mb-3">Investment Thesis</p>
                  <p className="text-sm text-fog leading-relaxed">{data.thesis}</p>
                  <div className="mt-5 space-y-2.5">
                    {data.thesis_points.map((point, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <ChevronRight className="w-3.5 h-3.5 text-morning-blue mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-fog-dim leading-relaxed">{point}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Bull / Base / Bear */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Bull Case', text: data.bull_case, price: data.bull, prob: data.pBull, color: '#6AA87A', border: 'rgba(106,168,122,0.2)' },
                    { label: 'Base Case', text: data.base_case, price: data.base, prob: data.pBase, color: '#8FA9D8', border: 'rgba(143,169,216,0.2)' },
                    { label: 'Bear Case', text: data.bear_case, price: data.bear, prob: data.pBear, color: '#A86A6A', border: 'rgba(168,106,106,0.2)' },
                  ].map((c) => (
                    <GlassCard key={c.label} padding="md" style={{ borderColor: c.border }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold" style={{ color: c.color }}>{c.label}</span>
                        <span className="text-xs text-fog-dim">{Math.round(c.prob * 100)}% prob.</span>
                      </div>
                      <p className="text-xl font-bold mono-nums mb-3" style={{ color: c.color }}>
                        {formatPrice(c.price)}
                      </p>
                      <p className="text-xs text-fog-dim leading-relaxed">{c.text}</p>
                    </GlassCard>
                  ))}
                </div>

                {/* Variant perception */}
                <GlassCard padding="lg" glow="lavender">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-lavender" />
                    <p className="text-sm font-semibold text-lavender">Variant Perception</p>
                  </div>
                  <p className="text-sm text-fog-dim leading-relaxed">{data.variant}</p>
                </GlassCard>

                {/* Catalysts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassCard padding="md">
                    <p className="research-label mb-3">Key Catalysts</p>
                    <div className="space-y-2.5">
                      {data.catalysts.map((c, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-bull mt-1.5 flex-shrink-0" />
                          <p className="text-xs text-fog-dim leading-relaxed">{c}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                  <GlassCard padding="md">
                    <p className="research-label mb-3">Key Risks</p>
                    <div className="space-y-2.5">
                      {data.risks.map((r, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 text-bear mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-fog-dim leading-relaxed">{r}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>

                {/* Investment conclusion */}
                <GlassCard padding="lg" gradient>
                  <p className="research-label mb-3">Investment Conclusion</p>
                  <p className="text-sm text-fog leading-relaxed">{data.conclusion}</p>
                  <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-bull bg-bull/10 border border-bull/20 px-2.5 py-1 rounded-lg">{data.rating}</span>
                      <span className="text-sm font-semibold mono-nums text-fog">PT: {formatPrice(data.target)}</span>
                      <span className="text-sm text-bull mono-nums">{formatPct(upside)}</span>
                    </div>
                    <button className="flex items-center gap-1.5 text-xs text-morning-blue hover:text-fog transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Export PDF
                    </button>
                  </div>
                </GlassCard>
              </div>
            )}

            {activeTab === 'financials' && (
              <div className="space-y-5">
                <GlassCard padding="none" noHover>
                  <div className="px-5 py-4 border-b border-white/[0.05]">
                    <h3 className="text-sm font-semibold text-fog">Revenue Model (FY, $B)</h3>
                  </div>
                  <div className="h-56 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.revenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                        <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#888884' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#888884' }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}B`} width={44} />
                        <Tooltip
                          content={({ active, payload, label }) =>
                            active && payload?.length ? (
                              <div className="glass px-3 py-2 rounded-lg text-xs">
                                <p className="text-fog-dim">{label}</p>
                                <p className="text-fog font-semibold">${payload[0].value}B</p>
                                <p className="text-bull">+{(payload[0].payload as { growth: number }).growth}% YoY</p>
                              </div>
                            ) : null
                          }
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {data.revenue.map((entry, i) => (
                            <Cell key={i} fill={i >= 3 ? 'rgba(143,169,216,0.45)' : 'rgba(143,169,216,0.7)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                <GlassCard padding="md" noHover>
                  <p className="research-label mb-4">Revenue Segments (FY25E, $B)</p>
                  <div className="space-y-3">
                    {data.segments.map((seg) => (
                      <div key={seg.name} className="flex items-center gap-3">
                        <span className="text-xs text-fog-dim w-32 flex-shrink-0">{seg.name}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-surface-high overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: seg.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${seg.pct}%` }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                        <span className="text-xs mono-nums text-fog-dim w-16 text-right">${seg.rev}B</span>
                        <span className="text-xs mono-nums text-fog-dim w-8 text-right">{seg.pct}%</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            )}

            {activeTab === 'valuation' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'P/E (NTM)', value: `${data.pe}×`, sub: 'vs semi avg 28×', color: '#B5A6D8' },
                    { label: 'P/S (NTM)', value: `${data.ps}×`, sub: 'vs semi avg 8×', color: '#8FA9D8' },
                    { label: 'EV/EBITDA', value: `${data.evEbitda}×`, sub: 'vs semi avg 22×', color: '#E0B96A' },
                  ].map((v) => (
                    <MetricCard key={v.label} label={v.label} value={v.value} subValue={v.sub} accent={v.color} />
                  ))}
                </div>
                <GlassCard padding="lg">
                  <p className="research-label mb-4">DCF Scenario Matrix</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/[0.05]">
                          <th className="text-left py-2 text-fog-dim font-medium">WACC / Growth</th>
                          {['18%', '20%', '22%', '25%'].map((g) => (
                            <th key={g} className="text-right py-2 text-fog-dim font-medium px-3">{g}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[['8%', 1680, 1820, 1990, 2240], ['9%', 1420, 1540, 1690, 1900], ['10%', 1180, 1280, 1400, 1580], ['11%', 980, 1060, 1160, 1300]].map(([wacc, ...vals]) => (
                          <tr key={String(wacc)} className="border-b border-white/[0.03]">
                            <td className="py-2.5 text-fog-dim font-medium">{wacc}</td>
                            {vals.map((v, i) => (
                              <td
                                key={i}
                                className={`text-right py-2.5 px-3 mono-nums font-medium rounded ${
                                  v === 1400 ? 'bg-morning-blue/15 text-morning-blue' : 'text-fog-dim'
                                }`}
                              >
                                ${v}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[10px] text-fog-dim/60 mt-3">Base case (highlighted): 10% WACC, 22% long-run growth. Terminal value 35× EBITDA.</p>
                </GlassCard>
              </div>
            )}

            {activeTab === 'risks' && (
              <div className="space-y-4">
                {data.risks.map((risk, i) => (
                  <GlassCard key={i} padding="md">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-bear/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-bear" />
                      </div>
                      <div>
                        <p className="text-sm text-fog mb-1 font-medium">Risk Factor {i + 1}</p>
                        <p className="text-sm text-fog-dim leading-relaxed">{risk}</p>
                      </div>
                      <div className="ml-auto flex-shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-bear/10 text-bear border border-bear/20">
                          {i < 2 ? 'High' : i < 4 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}

            {activeTab === 'supply-chain' && (
              <div className="space-y-4">
                <GlassCard padding="lg">
                  <p className="research-label mb-4">Supply Chain Dependencies</p>
                  {[
                    { ticker: 'ASML', role: 'EUV lithography — sole supplier for sub-3nm logic', tier: 'Critical Upstream', exposure: 95 },
                    { ticker: 'TSM', role: 'Primary foundry — CoWoS advanced packaging for HBM', tier: 'Critical Midstream', exposure: 100 },
                    { ticker: 'MU / HYNIX', role: 'HBM3E memory — supply constraint risk for H200/B200', tier: 'Critical Upstream', exposure: 80 },
                    { ticker: 'COHR', role: 'Optical transceivers for InfiniBand networking', tier: 'Midstream', exposure: 42 },
                    { ticker: 'VRT', role: 'Liquid cooling infrastructure for NVL72 rack systems', tier: 'Downstream', exposure: 28 },
                  ].map((item) => (
                    <div key={item.ticker} className="flex items-start gap-4 py-3 border-b border-white/[0.04] last:border-0">
                      <div className="w-16 text-xs font-bold text-fog flex-shrink-0 pt-0.5 mono-nums">{item.ticker}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface text-fog-dim">{item.tier}</span>
                          <span className="text-[10px] mono-nums text-fog-dim">{item.exposure}% exposure</span>
                        </div>
                        <p className="text-xs text-fog-dim">{item.role}</p>
                        <div className="mt-2 h-0.5 rounded-full bg-surface-high overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-morning-blue to-lavender"
                            initial={{ width: 0 }}
                            animate={{ width: `${item.exposure}%` }}
                            transition={{ duration: 0.9, delay: 0.2 }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </GlassCard>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
