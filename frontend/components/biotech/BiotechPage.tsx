'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FlaskConical, ChevronRight, AlertTriangle, CheckCircle2,
  Clock, TrendingUp, Activity, Zap, BarChart3, Info,
} from 'lucide-react'
import GlassCard from '@/components/glass/GlassCard'
import { formatPrice, formatMarketCap } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

// ── Types ─────────────────────────────────────────────────────
type Phase = 'Preclinical' | 'Phase 1' | 'Phase 2' | 'Phase 3' | 'NDA/BLA' | 'Approved'

interface Drug {
  name: string
  indication: string
  mechanism: string
  phase: Phase
  readout?: string
  pos: number         // probability of success to approval
  peakSales?: number  // $B
  npv?: number        // $B risk-adjusted
  partner?: string
  priority?: boolean
}

interface BiotechCompany {
  ticker: string
  name: string
  price: number
  cap: number
  cash: number       // $B
  runway: number     // months
  pipeline: Drug[]
  thesis: string
  catalysts: string[]
  risks: string[]
}

// ── Demo pipeline data ────────────────────────────────────────
const COMPANIES: BiotechCompany[] = [
  {
    ticker: 'MRNA',
    name: 'Moderna',
    price: 68.22, cap: 26e9, cash: 9.5, runway: 28,
    thesis: 'Moderna\'s mRNA platform represents the most diversified pipeline in the therapeutics space. Beyond the COVID franchise, the personalized cancer vaccine program (mRNA-4157/V940) in partnership with Merck is the most compelling oncology catalyst in biotech — Ph3 KEYNOTE-942 data showed 44% reduction in recurrence/death in high-risk melanoma. Respiratory franchise (RSV, Flu-COVID combo) targets a $10B+ market.',
    catalysts: [
      'mRNA-4157 (personalized cancer vaccine) Ph3 overall survival readout 2026',
      'mRNA-1345 RSV vaccine label expansion into immunocompromised adults',
      'mRNA-1283 Next-gen COVID vaccine seasonal share capture',
      'mRNA-3927 (PA disease) Ph2/3 initiation',
      'Potential CMV vaccine approval (mRNA-1647, Ph3 complete)',
    ],
    risks: [
      'COVID franchise revenue declining faster than pipeline can offset',
      'Cash burn rate: ~$3.5B/year — runway narrows without milestone payments',
      'Competition from Pfizer/BNT mRNA combo vaccines in respiratory',
      'mRNA-4157 survival endpoint requires longer-term follow-up',
    ],
    pipeline: [
      { name: 'mRNA-1283',   indication: 'COVID-19',                mechanism: 'mRNA / Spike protein',          phase: 'Approved',   pos: 1.0,  peakSales: 2.0,  npv: 1.2 },
      { name: 'mRNA-1345',   indication: 'RSV (adults 60+)',         mechanism: 'mRNA / F-protein prefusion',    phase: 'Approved',   pos: 1.0,  peakSales: 3.5,  npv: 2.1 },
      { name: 'mRNA-4157',   indication: 'Melanoma (adj. + mets)',   mechanism: 'neoantigen mRNA + Keytruda',    phase: 'Phase 3',    pos: 0.55, peakSales: 6.0,  npv: 3.8, partner: 'Merck', priority: true, readout: 'OS 2026' },
      { name: 'mRNA-1647',   indication: 'CMV (seroneg. women)',     mechanism: 'mRNA / pentamer + gB',          phase: 'NDA/BLA',    pos: 0.85, peakSales: 2.8,  npv: 2.0, readout: 'FDA 2025' },
      { name: 'mRNA-1010',   indication: 'Flu + COVID combo',        mechanism: 'Quadrivalent mRNA',             phase: 'Phase 3',    pos: 0.65, peakSales: 4.5,  npv: 2.5, readout: 'Ph3 2025' },
      { name: 'mRNA-3927',   indication: 'Propionic acidemia',       mechanism: 'mRNA enzyme replacement',       phase: 'Phase 2',    pos: 0.30, peakSales: 0.9,  npv: 0.5 },
      { name: 'mRNA-1944',   indication: 'Chikungunya',              mechanism: 'mRNA / antibody cocktail',      phase: 'Phase 1',    pos: 0.18, peakSales: 0.4,  npv: 0.1 },
    ],
  },
  {
    ticker: 'ALNY',
    name: 'Alnylam Pharmaceuticals',
    price: 242.10, cap: 31e9, cash: 3.2, runway: 22,
    thesis: 'Alnylam is the defining RNAi therapeutics platform company, with 5 approved products and a deep pipeline. The company\'s GalNAc-siRNA delivery technology is protected by broad IP through 2033+. Vutrisiran for ATTR cardiomyopathy represents the largest near-term revenue driver — HELIOS-B data showed 28% RRR in all-cause mortality, setting up for a >$5B peak sales asset.',
    catalysts: [
      'Vutrisiran (ATTR-CM) label update post-HELIOS-B mortality data',
      'Zilebesiran (hypertension, with Roche) Ph3 KARDIA-2 readout 2026',
      'Fitusiran (hemophilia A/B) Ph3 ATLAS-A/B rollup + commercial launch',
      'Mativaptan (ADPKD) Ph3 ALIGN readout 2025',
    ],
    risks: [
      'BridgeBio ALN-APP (Alzheimer\'s) competitive overlap concern',
      'Pfizer\'s vyndaqel competing for ATTR market share',
      'Cash runway below 24 months — possible equity raise',
      'Renal delivery limitation for non-liver targets',
    ],
    pipeline: [
      { name: 'Givosiran',    indication: 'AHP',                    mechanism: 'siRNA / ALAS1',         phase: 'Approved',  pos: 1.0,  peakSales: 0.7,  npv: 0.6 },
      { name: 'Lumasiran',    indication: 'PH1',                    mechanism: 'siRNA / HAO1',          phase: 'Approved',  pos: 1.0,  peakSales: 0.5,  npv: 0.4 },
      { name: 'Vutrisiran',   indication: 'ATTR-PN + CM',           mechanism: 'siRNA / TTR',           phase: 'Approved',  pos: 1.0,  peakSales: 5.5,  npv: 4.1, priority: true },
      { name: 'Inclisiran',   indication: 'Hypercholesterolemia',   mechanism: 'siRNA / PCSK9',         phase: 'Approved',  pos: 1.0,  peakSales: 3.0,  npv: 1.2, partner: 'Novartis' },
      { name: 'Fitusiran',    indication: 'Hemophilia A/B',         mechanism: 'siRNA / Antithrombin',  phase: 'NDA/BLA',   pos: 0.90, peakSales: 2.0,  npv: 1.5, readout: 'FDA 2025' },
      { name: 'Zilebesiran',  indication: 'Hypertension',           mechanism: 'siRNA / Angiotensinogen', phase: 'Phase 3', pos: 0.45, peakSales: 4.5,  npv: 2.1, partner: 'Roche', priority: true, readout: '2026' },
      { name: 'Mativaptan',   indication: 'ADPKD',                  mechanism: 'siRNA / V2R',           phase: 'Phase 3',   pos: 0.40, peakSales: 1.8,  npv: 0.8, readout: '2025' },
    ],
  },
  {
    ticker: 'VRTX',
    name: 'Vertex Pharmaceuticals',
    price: 484.20, cap: 124e9, cash: 12.8, runway: 999, // debt-free, highly profitable
    thesis: 'Vertex has the cleanest franchise in biotech — monopoly in cystic fibrosis (Trikafta/Kaftrio, $10B+ revenue), approaching profitability on the CF franchise alone, and an emerging pipeline in pain (VX-548) and type 1 diabetes (VX-880/VX-264). VX-548\'s non-opioid mechanism targeting NaV1.8 is a commercial paradigm shift; FDA approval creates a $10B+ addressable pain market.',
    catalysts: [
      'VX-548 (acute pain) commercial launch trajectory — formulary wins',
      'VX-880 (T1D) Ph3 initiation and early efficacy signals',
      'VX-264 (T1D, encapsulated islets) Ph1/2 safety readout',
      'Povetacicept (IgA nephropathy, with Alpine Immune) Ph3 RAINIER readout',
      'Inaxaplin (APOL1-mediated kidney disease) Ph3 AMPLITUDE readout 2026',
    ],
    risks: [
      'Generic competition to CF franchise if IP challenged post-2037',
      'VX-548 requires significant managed care access wins to reach peak sales',
      'T1D programs (VX-880) require permanent immunosuppression — commercial challenge',
      'Valuation already pricing in significant pipeline success',
    ],
    pipeline: [
      { name: 'Trikafta/Kaftrio', indication: 'Cystic Fibrosis (F508del)', mechanism: 'CFTR modulator triple combo', phase: 'Approved', pos: 1.0, peakSales: 12.0, npv: 9.5, priority: true },
      { name: 'VX-548',    indication: 'Acute Pain (non-opioid)',     mechanism: 'NaV1.8 inhibitor',             phase: 'Approved',  pos: 1.0,  peakSales: 4.5,  npv: 3.2, priority: true },
      { name: 'Inaxaplin', indication: 'APOL1-mediated kidney disease', mechanism: 'APOL1 protein inhibitor',   phase: 'Phase 3',   pos: 0.55, peakSales: 3.0,  npv: 1.8, readout: '2026' },
      { name: 'VX-880',    indication: 'Type 1 Diabetes',             mechanism: 'Stem-cell derived islets',    phase: 'Phase 3',   pos: 0.35, peakSales: 5.0,  npv: 2.0, readout: '2027' },
      { name: 'VX-264',    indication: 'Type 1 Diabetes (encapsulated)', mechanism: 'Encapsulated islets (no IS)', phase: 'Phase 1', pos: 0.20, peakSales: 8.0,  npv: 1.8, priority: true },
      { name: 'VX-407',    indication: 'Myotonic Dystrophy Type 1',   mechanism: 'Splice modulator',            phase: 'Phase 2',   pos: 0.25, peakSales: 1.2,  npv: 0.4 },
    ],
  },
]

const PHASE_ORDER: Phase[] = ['Preclinical','Phase 1','Phase 2','Phase 3','NDA/BLA','Approved']
const PHASE_COLOR: Record<Phase, string> = {
  'Preclinical': '#4A426A',
  'Phase 1':     '#5E6FA3',
  'Phase 2':     '#8FA9D8',
  'Phase 3':     '#B5A6D8',
  'NDA/BLA':     '#E0B96A',
  'Approved':    '#6AA87A',
}
const PHASE_WIDTH: Record<Phase, string> = {
  'Preclinical': '12%',
  'Phase 1':     '28%',
  'Phase 2':     '48%',
  'Phase 3':     '68%',
  'NDA/BLA':     '88%',
  'Approved':    '100%',
}

const FDA_PATHWAYS = [
  { name: 'Standard Review', timeline: '12 months', description: 'Default pathway for all new drug applications' },
  { name: 'Priority Review',  timeline: '6 months',  description: 'Serious conditions with potential improvement over available therapy' },
  { name: 'Breakthrough Therapy', timeline: '6 months+', description: 'Substantial improvement on a clinically significant endpoint' },
  { name: 'Accelerated Approval', timeline: 'Variable', description: 'Surrogate endpoint reasonably likely to predict clinical benefit' },
  { name: 'Fast Track',       timeline: 'Rolling review', description: 'Facilitates development of drugs for serious conditions filling unmet need' },
]

const HISTORICAL_POS = [
  { stage: 'Ph1→Approval', rate: 7.9,  color: '#5E6FA3' },
  { stage: 'Ph2→Approval', rate: 14.4, color: '#8FA9D8' },
  { stage: 'Ph3→Approval', rate: 58.1, color: '#B5A6D8' },
  { stage: 'NDA→Approval', rate: 85.3, color: '#6AA87A' },
]

function PhaseBar({ phase }: { phase: Phase }) {
  return (
    <div className="relative h-1.5 rounded-full bg-surface-high overflow-hidden w-full">
      <motion.div
        className="absolute left-0 top-0 h-full rounded-full"
        style={{ backgroundColor: PHASE_COLOR[phase] }}
        initial={{ width: 0 }}
        animate={{ width: PHASE_WIDTH[phase] }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  )
}

function PosIndicator({ pos }: { pos: number }) {
  const pct = Math.round(pos * 100)
  const color = pos >= 0.7 ? '#6AA87A' : pos >= 0.4 ? '#E0B96A' : pos >= 0.2 ? '#B5A6D8' : '#A86A6A'
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-7 h-7">
        <svg viewBox="0 0 28 28" className="w-7 h-7 -rotate-90">
          <circle cx="14" cy="14" r="10" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
          <circle
            cx="14" cy="14" r="10"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 10 * pos} ${2 * Math.PI * 10 * (1 - pos)}`}
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="text-xs font-semibold mono-nums" style={{ color }}>{pct}%</span>
    </div>
  )
}

export default function BiotechPage() {
  const [selectedCompany, setSelectedCompany] = useState('MRNA')
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null)

  const company = COMPANIES.find(c => c.ticker === selectedCompany)!
  const totalNpv = company.pipeline.reduce((sum, d) => sum + (d.npv ?? 0), 0)
  const phaseCount = PHASE_ORDER.reduce((acc, p) => {
    acc[p] = company.pipeline.filter(d => d.phase === p).length
    return acc
  }, {} as Record<Phase, number>)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <p className="research-label mb-1">Institutional Research</p>
          <h1 className="text-2xl font-bold text-fog tracking-tight flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-peach" strokeWidth={1.5} />
            Biotech Analysis Workspace
          </h1>
        </div>

        {/* Company selector */}
        <div className="flex gap-2">
          {COMPANIES.map(c => (
            <button
              key={c.ticker}
              onClick={() => { setSelectedCompany(c.ticker); setSelectedDrug(null) }}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
              style={selectedCompany === c.ticker
                ? { background: 'rgba(228,184,160,0.15)', border: '1px solid rgba(228,184,160,0.3)', color: '#E4B8A0' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: '#888884' }
              }
            >
              {c.ticker}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Company overview row ────────────────────────────── */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06 }}
      >
        {[
          { label: 'Market Cap',   value: formatMarketCap(company.cap), accent: '#E4B8A0' },
          { label: 'Cash Position', value: `$${company.cash}B`, accent: '#6AA87A' },
          {
            label: 'Cash Runway',
            value: company.runway > 200 ? 'Profitable' : `${company.runway}mo`,
            accent: company.runway < 18 ? '#A86A6A' : company.runway < 30 ? '#E0B96A' : '#6AA87A',
          },
          { label: 'Pipeline NPV', value: `~$${totalNpv.toFixed(1)}B`, accent: '#B5A6D8' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + i * 0.05 }}>
            <GlassCard padding="md">
              <p className="research-label mb-1.5">{m.label}</p>
              <p className="text-xl font-bold mono-nums" style={{ color: m.accent }}>{m.value}</p>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Main grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Drug pipeline (2/3) ──────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Investment Thesis */}
          <GlassCard padding="lg" noHover>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-peach" />
              <p className="text-sm font-semibold text-peach">Investment Thesis — {company.ticker}</p>
            </div>
            <p className="text-sm text-fog-dim leading-relaxed">{company.thesis}</p>
          </GlassCard>

          {/* Pipeline table */}
          <GlassCard padding="none" noHover>
            <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-fog">
                Drug Pipeline — {company.pipeline.length} assets
              </h3>
              <div className="flex gap-3">
                {Object.entries(phaseCount).filter(([,n]) => n > 0).map(([phase, n]) => (
                  <span key={phase} className="text-[10px] font-medium" style={{ color: PHASE_COLOR[phase as Phase] }}>
                    {phase.replace('Phase ', 'Ph')}: {n}
                  </span>
                ))}
              </div>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {company.pipeline.map((drug, i) => (
                <motion.div
                  key={drug.name}
                  className={`px-5 py-4 cursor-pointer transition-colors duration-150 ${
                    selectedDrug?.name === drug.name ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                  }`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedDrug(selectedDrug?.name === drug.name ? null : drug)}
                >
                  <div className="flex items-start gap-4">
                    {/* Drug name + indication */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-fog">{drug.name}</span>
                        {drug.priority && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                            style={{ background: 'rgba(224,185,106,0.15)', color: '#E0B96A', border: '1px solid rgba(224,185,106,0.25)' }}>
                            PRIORITY
                          </span>
                        )}
                        {drug.partner && (
                          <span className="text-[9px] text-fog-dim/60 border border-white/[0.06] px-1.5 py-0.5 rounded-full">
                            +{drug.partner}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-fog-dim mb-2">{drug.indication}</p>
                      <p className="text-[10px] text-fog-dim/60 mb-2">{drug.mechanism}</p>
                      <PhaseBar phase={drug.phase} />
                    </div>

                    {/* Phase badge */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0 w-28">
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: `${PHASE_COLOR[drug.phase]}20`, color: PHASE_COLOR[drug.phase], border: `1px solid ${PHASE_COLOR[drug.phase]}30` }}
                      >
                        {drug.phase}
                      </span>
                      <PosIndicator pos={drug.pos} />
                      {drug.readout && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-fog-dim/50" />
                          <span className="text-[10px] text-fog-dim/60">{drug.readout}</span>
                        </div>
                      )}
                    </div>

                    {/* NPV */}
                    <div className="flex-shrink-0 text-right w-20">
                      {drug.npv !== undefined && (
                        <>
                          <p className="text-xs text-fog-dim">rNPV</p>
                          <p className="text-sm font-semibold mono-nums text-lavender">${drug.npv.toFixed(1)}B</p>
                        </>
                      )}
                      {drug.peakSales !== undefined && (
                        <p className="text-[10px] text-fog-dim/60 mono-nums">Pk ${drug.peakSales.toFixed(1)}B</p>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence>
                    {selectedDrug?.name === drug.name && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 mt-4 border-t border-white/[0.05] grid grid-cols-3 gap-4">
                          <div>
                            <p className="research-label mb-1">Mechanism</p>
                            <p className="text-xs text-fog-dim">{drug.mechanism}</p>
                          </div>
                          <div>
                            <p className="research-label mb-1">PoS to Approval</p>
                            <p className="text-sm font-bold" style={{ color: PHASE_COLOR[drug.phase] }}>
                              {Math.round(drug.pos * 100)}%
                            </p>
                            <p className="text-[10px] text-fog-dim/60">Risk-adjusted estimate</p>
                          </div>
                          <div>
                            <p className="research-label mb-1">Value</p>
                            <p className="text-sm font-bold text-lavender">${drug.npv?.toFixed(1)}B rNPV</p>
                            <p className="text-[10px] text-fog-dim/60">Peak ${drug.peakSales?.toFixed(1)}B sales</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* ── Right panel (1/3) ────────────────────────────── */}
        <div className="space-y-4">
          {/* Pipeline NPV waterfall */}
          <GlassCard padding="none" noHover>
            <div className="px-4 py-3.5 border-b border-white/[0.05]">
              <h3 className="text-sm font-semibold text-fog">rNPV Breakdown ($B)</h3>
            </div>
            <div className="h-48 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={company.pipeline.filter(d => (d.npv ?? 0) > 0).sort((a,b) => (b.npv??0)-(a.npv??0))}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 9, fill: '#888884' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}B`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: '#888884' }} tickLine={false} axisLine={false} width={60} />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="glass px-2.5 py-1.5 rounded-lg text-xs">
                          <p className="text-fog font-semibold">{(payload[0].payload as Drug).name}</p>
                          <p className="text-lavender">${(payload[0].value as number).toFixed(1)}B rNPV</p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="npv" radius={[0, 3, 3, 0]}>
                    {company.pipeline.filter(d => (d.npv ?? 0) > 0).sort((a,b) => (b.npv??0)-(a.npv??0)).map((d, i) => (
                      <Cell key={i} fill={PHASE_COLOR[d.phase]} fillOpacity={0.75} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {/* Historical PoS */}
          <GlassCard padding="md" noHover>
            <p className="research-label mb-3">Historical PoS by Stage (Industry avg.)</p>
            <div className="space-y-2.5">
              {HISTORICAL_POS.map(item => (
                <div key={item.stage}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-fog-dim">{item.stage}</span>
                    <span className="text-[11px] font-semibold mono-nums" style={{ color: item.color }}>{item.rate}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-surface-high overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${item.rate}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-fog-dim/50 mt-3">Source: BIO/Informa analysis, 2011–2023. n=9,704 programs.</p>
          </GlassCard>

          {/* FDA Pathways */}
          <GlassCard padding="md" noHover>
            <p className="research-label mb-3">FDA Regulatory Pathways</p>
            <div className="space-y-2">
              {FDA_PATHWAYS.map(p => (
                <div key={p.name} className="p-2.5 rounded-lg bg-surface/50 border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-fog">{p.name}</span>
                    <span className="text-[9px] text-morning-blue mono-nums">{p.timeline}</span>
                  </div>
                  <p className="text-[10px] text-fog-dim/70 leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Catalysts + Risks */}
          <GlassCard padding="md" noHover>
            <p className="research-label mb-3">Key Catalysts</p>
            <div className="space-y-2">
              {company.catalysts.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-bull mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-fog-dim leading-relaxed">{c}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard padding="md" noHover>
            <p className="research-label mb-3">Key Risks</p>
            <div className="space-y-2">
              {company.risks.map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 text-bear mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-fog-dim leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
