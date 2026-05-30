'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Network, Search, ChevronRight, Zap, Info, TrendingUp, ArrowRight } from 'lucide-react'
import GlassCard from '@/components/glass/GlassCard'
import { formatMarketCap } from '@/lib/utils'

// ── Supply chain universe ─────────────────────────────────────
interface SCNode {
  id: string; name: string; fullName: string
  tier: 'material' | 'equipment' | 'foundry' | 'chip' | 'system' | 'hyperscaler'
  subsector: string; color: string
  x: number; y: number; size: number
  cap?: number; revenueExposure?: number   // % exposure to AI
  description: string
}

interface SCEdge {
  source: string; target: string
  relationship: 'critical' | 'important' | 'moderate'
  label: string
}

const TIER_META: Record<SCNode['tier'], { label: string; color: string; x: number }> = {
  material:     { label: 'Materials',        color: '#4A426A', x: 95  },
  equipment:    { label: 'Equipment',        color: '#B5A6D8', x: 210 },
  foundry:      { label: 'Foundry',          color: '#E0B96A', x: 350 },
  chip:         { label: 'Chips & Systems',  color: '#8FA9D8', x: 510 },
  system:       { label: 'Infrastructure',   color: '#5E6FA3', x: 670 },
  hyperscaler:  { label: 'Hyperscalers',     color: '#6AA87A', x: 830 },
}

const NODES: SCNode[] = [
  // Materials
  { id:'ENTG', name:'ENTG',  fullName:'Entegris',          tier:'material',    subsector:'Filtration/CMP',    color:'#7A6EA8', x:95,  y:100, size:22, cap:12e9,  revenueExposure:60,  description:'Advanced materials, filters, and CMP slurries for leading-edge chip fab' },
  { id:'CMC',  name:'CCMP',  fullName:'CMC Materials',     tier:'material',    subsector:'CMP Slurry',        color:'#7A6EA8', x:95,  y:195, size:18, cap:2.5e9, revenueExposure:55,  description:'Chemical mechanical planarization slurries critical for 2nm/3nm nodes' },
  { id:'ACMR', name:'ACM',   fullName:'ACM Research',      tier:'material',    subsector:'Wet Clean',         color:'#7A6EA8', x:95,  y:280, size:16, cap:1.2e9, revenueExposure:70,  description:'Wet processing tools for advanced node cleaning steps' },

  // Equipment
  { id:'ASML', name:'ASML',  fullName:'ASML Holding',      tier:'equipment',   subsector:'EUV Lithography',   color:'#B5A6D8', x:210, y:80,  size:44, cap:290e9, revenueExposure:65,  description:'Sole supplier of EUV lithography machines — monopoly enabling sub-5nm logic' },
  { id:'AMAT', name:'AMAT',  fullName:'Appl. Materials',   tier:'equipment',   subsector:'Deposition/CVD',    color:'#B5A6D8', x:210, y:185, size:34, cap:135e9, revenueExposure:60,  description:'Deposition, etch, and CMP tools used in every advanced chip node' },
  { id:'LRCX', name:'LRCX',  fullName:'Lam Research',      tier:'equipment',   subsector:'Etch',              color:'#B5A6D8', x:210, y:285, size:30, cap:90e9,  revenueExposure:58,  description:'Plasma etch and deposition equipment critical for 3D NAND and logic' },
  { id:'KLAC', name:'KLAC',  fullName:'KLA Corp',          tier:'equipment',   subsector:'Inspection',        color:'#B5A6D8', x:210, y:375, size:28, cap:75e9,  revenueExposure:55,  description:'Process control and yield management for advanced semiconductor fabs' },

  // Foundry
  { id:'TSM',  name:'TSMC',  fullName:'TSMC',              tier:'foundry',     subsector:'Logic Foundry',     color:'#E0B96A', x:350, y:160, size:48, cap:780e9, revenueExposure:75,  description:'World\'s leading logic foundry — sole manufacturer for NVDA, Apple, AMD advanced nodes' },
  { id:'SAMEX',name:'Samsung',fullName:'Samsung Foundry',  tier:'foundry',     subsector:'Logic Foundry',     color:'#C89A48', x:350, y:295, size:26, cap:280e9, revenueExposure:40,  description:'#2 advanced logic foundry — 3nm GAA, competing with TSMC for HPC wins' },
  { id:'MU',   name:'MU',    fullName:'Micron Technology', tier:'foundry',     subsector:'HBM Memory',        color:'#D4A832', x:350, y:390, size:34, cap:120e9, revenueExposure:85,  description:'HBM3E memory — supply-constrained critical input for AI accelerators' },

  // Chips
  { id:'NVDA', name:'NVDA',  fullName:'NVIDIA',            tier:'chip',        subsector:'GPU / AI Accel.',   color:'#6AA87A', x:510, y:130, size:56, cap:2800e9,revenueExposure:98,  description:'Dominant AI accelerator — H200/B200 GPU + InfiniBand networking. The focal node.' },
  { id:'AVGO', name:'AVGO',  fullName:'Broadcom',          tier:'chip',        subsector:'Networking ASICs',  color:'#8FA9D8', x:510, y:265, size:38, cap:850e9, revenueExposure:55,  description:'Custom AI ASICs for Google/Meta + networking chips; AI revenue >35% of total' },
  { id:'MRVL', name:'MRVL',  fullName:'Marvell Tech',      tier:'chip',        subsector:'Custom Silicon',    color:'#8FA9D8', x:510, y:370, size:28, cap:60e9,  revenueExposure:65,  description:'Custom AI inference chips for AWS (Trainium/Inferentia) and data center SerDes' },
  { id:'COHR', name:'COHR',  fullName:'Coherent',          tier:'chip',        subsector:'Optical Interconnect',color:'#7A8FC0', x:510, y:450, size:24, cap:14e9, revenueExposure:55,  description:'800G/1.6T optical transceivers for InfiniBand and Ethernet AI clusters' },

  // Systems / Infrastructure
  { id:'VRT',  name:'VRT',   fullName:'Vertiv',            tier:'system',      subsector:'Thermal/Power',     color:'#5E6FA3', x:670, y:120, size:30, cap:43e9,  revenueExposure:80,  description:'Liquid cooling and power systems for AI data centers — 2kW/rack → 100kW+/rack trend' },
  { id:'SMCI', name:'SMCI',  fullName:'Super Micro',       tier:'system',      subsector:'AI Servers',        color:'#5E6FA3', x:670, y:230, size:28, cap:28e9,  revenueExposure:75,  description:'GPU server integration and rack-scale AI systems for hyperscalers and neoclouds' },
  { id:'ANET', name:'ANET',  fullName:'Arista Networks',   tier:'system',      subsector:'AI Networking',     color:'#5E6FA3', x:670, y:335, size:28, cap:128e9, revenueExposure:45,  description:'400G/800G Ethernet switches for AI fabric networking — growing AI cluster share' },
  { id:'EQIX', name:'EQIX',  fullName:'Equinix',           tier:'system',      subsector:'Colocation',        color:'#5E6FA3', x:670, y:430, size:22, cap:80e9,  revenueExposure:35,  description:'Data center colocation — benefits from AI compute co-location demand' },

  // Hyperscalers
  { id:'MSFT', name:'MSFT',  fullName:'Microsoft Azure',   tier:'hyperscaler', subsector:'Cloud AI',          color:'#6AA87A', x:830, y:100, size:38, cap:3100e9,revenueExposure:35,  description:'Azure AI + OpenAI partnership — largest external NVIDIA customer by capex' },
  { id:'GOOGL',name:'GOOGL', fullName:'Google Cloud',      tier:'hyperscaler', subsector:'Cloud AI',          color:'#6AA87A', x:830, y:210, size:36, cap:2000e9,revenueExposure:30,  description:'GCP AI + TPU development — NVIDIA buyer and internal ASIC developer' },
  { id:'AMZN', name:'AMZN',  fullName:'AWS',               tier:'hyperscaler', subsector:'Cloud AI',          color:'#6AA87A', x:830, y:310, size:36, cap:1950e9,revenueExposure:28,  description:'AWS Bedrock + Trainium/Inferentia — NVIDIA buyer while developing custom silicon' },
  { id:'META', name:'META',  fullName:'Meta Platforms',    tier:'hyperscaler', subsector:'AI Infrastructure', color:'#6AA87A', x:830, y:410, size:32, cap:1300e9,revenueExposure:25,  description:'Llama model training — one of the largest GPU cluster operators globally' },
]

const EDGES: SCEdge[] = [
  // Materials → Equipment (materials go into equipment processes)
  { source:'ENTG', target:'TSM',  relationship:'important', label:'Process materials' },
  { source:'CMC',  target:'AMAT', relationship:'moderate',  label:'CMP slurry' },
  { source:'ACMR', target:'TSM',  relationship:'moderate',  label:'Wet clean tools' },

  // Equipment → Foundry
  { source:'ASML', target:'TSM',   relationship:'critical',  label:'EUV machines' },
  { source:'ASML', target:'SAMEX', relationship:'important', label:'EUV machines' },
  { source:'AMAT', target:'TSM',   relationship:'critical',  label:'CVD/PVD tools' },
  { source:'AMAT', target:'SAMEX', relationship:'important', label:'CVD/PVD tools' },
  { source:'LRCX', target:'TSM',   relationship:'important', label:'Etch systems' },
  { source:'LRCX', target:'SAMEX', relationship:'moderate',  label:'Etch systems' },
  { source:'KLAC', target:'TSM',   relationship:'important', label:'Inspection' },

  // Foundry → Chip
  { source:'TSM',   target:'NVDA', relationship:'critical',  label:'CoWoS/4nm/3nm' },
  { source:'TSM',   target:'AVGO', relationship:'critical',  label:'3nm custom ASICs' },
  { source:'TSM',   target:'MRVL', relationship:'important', label:'5nm custom silicon' },
  { source:'SAMEX', target:'AVGO', relationship:'moderate',  label:'3nm GAA' },
  { source:'MU',    target:'NVDA', relationship:'critical',  label:'HBM3E' },

  // Chip → System
  { source:'NVDA', target:'SMCI', relationship:'critical',  label:'H100/H200/B200 GPUs' },
  { source:'NVDA', target:'VRT',  relationship:'important', label:'Cooling demand' },
  { source:'AVGO', target:'ANET', relationship:'moderate',  label:'Network ASICs' },
  { source:'COHR', target:'ANET', relationship:'important', label:'800G optical' },
  { source:'COHR', target:'NVDA', relationship:'important', label:'InfiniBand optics' },
  { source:'MRVL', target:'SMCI', relationship:'moderate',  label:'SerDes chips' },

  // System → Hyperscaler
  { source:'SMCI', target:'MSFT',  relationship:'critical',  label:'AI servers' },
  { source:'SMCI', target:'GOOGL', relationship:'important', label:'AI servers' },
  { source:'SMCI', target:'AMZN',  relationship:'important', label:'AI servers' },
  { source:'NVDA', target:'MSFT',  relationship:'critical',  label:'GPU compute' },
  { source:'NVDA', target:'GOOGL', relationship:'critical',  label:'GPU compute' },
  { source:'NVDA', target:'AMZN',  relationship:'critical',  label:'GPU compute' },
  { source:'NVDA', target:'META',  relationship:'critical',  label:'GPU compute' },
  { source:'VRT',  target:'EQIX',  relationship:'important', label:'Power/cooling' },
  { source:'ANET', target:'MSFT',  relationship:'important', label:'Ethernet fabric' },
  { source:'ANET', target:'GOOGL', relationship:'important', label:'Ethernet fabric' },
  { source:'ANET', target:'AMZN',  relationship:'moderate',  label:'Ethernet fabric' },
]

const EDGE_STYLE: Record<SCEdge['relationship'], { color: string; width: number; dash: string }> = {
  critical:  { color: 'rgba(143,169,216,0.7)', width: 2.5, dash: 'none' },
  important: { color: 'rgba(143,169,216,0.35)', width: 1.5, dash: 'none' },
  moderate:  { color: 'rgba(255,255,255,0.12)', width: 1,   dash: '4 4' },
}

// "Who benefits?" — second + third order traversal
function getBeneficiaries(focalId: string, depth: number = 2) {
  const visited = new Set<string>([focalId])
  const layers: string[][] = [[focalId]]
  for (let d = 0; d < depth; d++) {
    const next: string[] = []
    for (const id of layers[layers.length - 1]) {
      EDGES
        .filter(e => e.source === id && !visited.has(e.target))
        .forEach(e => { visited.add(e.target); next.push(e.target) })
    }
    if (next.length) layers.push(next)
    else break
  }
  return layers
}

export default function SupplyChainPage() {
  const [selected, setSelected] = useState<string | null>('NVDA')
  const [query, setQuery]   = useState('NVDA')
  const [activeQuery, setActiveQuery] = useState<string | null>('NVDA')
  const [filter, setFilter] = useState<SCNode['tier'] | 'all'>('all')

  const selectedNode = selected ? NODES.find(n => n.id === selected) : null

  // Connected nodes + edges for highlighting
  const connectedIds = useMemo(() => {
    if (!selected) return null
    const ids = new Set<string>([selected])
    EDGES.forEach(e => {
      if (e.source === selected) ids.add(e.target)
      if (e.target === selected) ids.add(e.source)
    })
    return ids
  }, [selected])

  // "Who benefits?" beneficiary layers
  const beneficiaryLayers = useMemo(() => {
    if (!activeQuery) return []
    const node = NODES.find(n => n.id === activeQuery || n.name === activeQuery.toUpperCase())
    if (!node) return []
    return getBeneficiaries(node.id, 3)
  }, [activeQuery])

  const beneficiaryIds = useMemo(() => new Set(beneficiaryLayers.flat()), [beneficiaryLayers])

  const visibleNodes = filter === 'all' ? NODES : NODES.filter(n => n.tier === filter)

  return (
    <div className="flex flex-col h-full p-6 md:p-8 gap-5">
      {/* ── Header ─────────────────────────────────────────── */}
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <p className="research-label mb-1">Supply Chain Intelligence</p>
          <h1 className="text-2xl font-bold text-fog tracking-tight flex items-center gap-2">
            <Network className="w-6 h-6 text-morning-blue" strokeWidth={1.5} />
            AI Supply Chain
          </h1>
        </div>

        {/* Tier filters */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilter('all')}
            className="text-[10px] font-medium px-2.5 py-1.5 rounded-md transition-all duration-150"
            style={{
              background: filter === 'all' ? 'rgba(143,169,216,0.15)' : 'rgba(255,255,255,0.04)',
              color: filter === 'all' ? '#8FA9D8' : '#888884',
              border: `1px solid ${filter === 'all' ? 'rgba(143,169,216,0.25)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            All
          </button>
          {(Object.keys(TIER_META) as SCNode['tier'][]).map(t => (
            <button
              key={t}
              onClick={() => setFilter(filter === t ? 'all' : t)}
              className="text-[10px] font-medium px-2.5 py-1.5 rounded-md transition-all duration-150"
              style={{
                background: filter === t ? `${TIER_META[t].color}20` : 'rgba(255,255,255,0.04)',
                color: filter === t ? TIER_META[t].color : '#888884',
                border: `1px solid ${filter === t ? `${TIER_META[t].color}35` : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {TIER_META[t].label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── "Who benefits?" query bar ───────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        <GlassCard padding="md" noHover glow="blue">
          <div className="flex items-center gap-3">
            <Zap className="w-4 h-4 text-gold flex-shrink-0" />
            <span className="text-sm font-medium text-fog">Who benefits if</span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && setActiveQuery(query)}
              placeholder="NVDA"
              className="w-20 bg-surface/60 border border-white/[0.08] rounded-md px-2.5 py-1 text-sm font-bold text-fog-dim mono-nums focus:outline-none focus:ring-1 focus:ring-morning-blue/40 focus:text-fog uppercase"
            />
            <span className="text-sm font-medium text-fog">shipments increase?</span>
            <button
              onClick={() => setActiveQuery(query)}
              className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{ background: 'rgba(143,169,216,0.15)', border: '1px solid rgba(143,169,216,0.25)', color: '#8FA9D8' }}
            >
              Trace
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Beneficiary layers */}
          <AnimatePresence>
            {beneficiaryLayers.length > 1 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="mt-4 pt-4 border-t border-white/[0.05]"
              >
                <div className="flex flex-wrap items-start gap-3">
                  {beneficiaryLayers.slice(1).map((layer, depth) => (
                    <div key={depth}>
                      <p className="research-label mb-1.5 text-[9px]">
                        {depth === 0 ? '1st-order' : depth === 1 ? '2nd-order' : '3rd-order'} beneficiaries
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {layer.map(id => {
                          const node = NODES.find(n => n.id === id)
                          if (!node) return null
                          return (
                            <button
                              key={id}
                              onClick={() => setSelected(id)}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all"
                              style={{
                                background: `${TIER_META[node.tier].color}15`,
                                color: TIER_META[node.tier].color,
                                border: `1px solid ${TIER_META[node.tier].color}25`,
                              }}
                            >
                              {node.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>

      {/* ── Main graph + side panel ─────────────────────────── */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* SVG Graph */}
        <motion.div
          className="flex-1 glass-card rounded-xl overflow-hidden min-h-[500px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <svg viewBox="0 0 980 540" className="w-full h-full" style={{ background: 'transparent' }}>
            <defs>
              {(Object.keys(TIER_META) as SCNode['tier'][]).map(t => (
                <radialGradient key={t} id={`bg-${t}`} cx="50%" cy="35%" r="60%">
                  <stop offset="0%" stopColor={TIER_META[t].color} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={TIER_META[t].color} stopOpacity={0.03} />
                </radialGradient>
              ))}
              <filter id="glow-sc">
                <feGaussianBlur stdDeviation="3.5" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Tier lane backgrounds */}
            {[
              { x: 60,  w: 115, tier: 'material' as const },
              { x: 160, w: 110, tier: 'equipment' as const },
              { x: 295, w: 110, tier: 'foundry' as const },
              { x: 440, w: 130, tier: 'chip' as const },
              { x: 610, w: 120, tier: 'system' as const },
              { x: 775, w: 130, tier: 'hyperscaler' as const },
            ].map(l => (
              <rect key={l.tier} x={l.x} y={18} width={l.w} height={504} rx={6}
                fill={`url(#bg-${l.tier})`} opacity={filter === 'all' || filter === l.tier ? 0.6 : 0.15} />
            ))}

            {/* Tier labels */}
            {(Object.entries(TIER_META) as [SCNode['tier'], typeof TIER_META[SCNode['tier']]][]).map(([t, meta]) => (
              <text key={t} x={meta.x} y={530} textAnchor="middle" fontSize={7.5}
                letterSpacing={1.5} fill="rgba(255,255,255,0.22)"
                style={{ fontFamily: 'var(--font-geist-sans)', userSelect: 'none', textTransform: 'uppercase' }}>
                {meta.label}
              </text>
            ))}

            {/* Edges */}
            {EDGES.map((edge, i) => {
              const src = NODES.find(n => n.id === edge.source)
              const tgt = NODES.find(n => n.id === edge.target)
              if (!src || !tgt) return null
              const highlighted = connectedIds
                ? connectedIds.has(src.id) && connectedIds.has(tgt.id)
                : beneficiaryIds.size
                  ? beneficiaryIds.has(src.id) && beneficiaryIds.has(tgt.id)
                  : true
              const style = EDGE_STYLE[edge.relationship]
              const dimmed = (connectedIds || beneficiaryIds.size > 0) && !highlighted
              return (
                <line key={i}
                  x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                  stroke={dimmed ? 'rgba(255,255,255,0.05)' : style.color}
                  strokeWidth={dimmed ? 0.5 : style.width}
                  strokeDasharray={style.dash}
                  strokeOpacity={dimmed ? 0.4 : 1}
                />
              )
            })}

            {/* Nodes */}
            {NODES.map(node => {
              const isSelected = selected === node.id
              const isBeneficiary = beneficiaryIds.has(node.id)
              const dimmed = (connectedIds && !connectedIds.has(node.id)) ||
                (beneficiaryIds.size > 0 && !isBeneficiary) ||
                (filter !== 'all' && node.tier !== filter)
              return (
                <g key={node.id} onClick={() => setSelected(node.id === selected ? null : node.id)} style={{ cursor: 'pointer' }}>
                  {isSelected && (
                    <circle cx={node.x} cy={node.y} r={node.size / 2 + 7}
                      fill="none" stroke={node.color} strokeWidth={2} strokeOpacity={0.5}
                      filter="url(#glow-sc)" />
                  )}
                  <circle cx={node.x} cy={node.y} r={node.size / 2}
                    fill={dimmed ? 'rgba(255,255,255,0.02)' : `${node.color}1A`}
                    stroke={dimmed ? 'rgba(255,255,255,0.07)' : node.color}
                    strokeWidth={isSelected ? 2 : 1.25}
                    strokeOpacity={dimmed ? 0.2 : 0.85}
                  />
                  <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize={node.size > 40 ? 10 : node.size > 28 ? 8.5 : 7.5}
                    fontWeight={isSelected ? 700 : 600}
                    fill={dimmed ? 'rgba(255,255,255,0.15)' : node.color}
                    style={{ fontFamily: 'var(--font-geist-mono)', userSelect: 'none' }}>
                    {node.name}
                  </text>
                  {!dimmed && node.revenueExposure && (
                    <text x={node.x} y={node.y + node.size / 2 + 10} textAnchor="middle" fontSize={7}
                      fill="rgba(255,255,255,0.28)"
                      style={{ fontFamily: 'var(--font-geist-sans)', userSelect: 'none' }}>
                      {node.revenueExposure}% AI
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </motion.div>

        {/* Side panel */}
        <motion.div
          className="w-68 flex-shrink-0 flex flex-col gap-4"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{ width: 272 }}
        >
          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div key={selectedNode.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <GlassCard padding="md">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedNode.color }} />
                    <p className="text-sm font-bold text-fog">{selectedNode.name}</p>
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{ background: `${TIER_META[selectedNode.tier].color}15`, color: TIER_META[selectedNode.tier].color }}>
                      {TIER_META[selectedNode.tier].label}
                    </span>
                  </div>
                  <p className="text-xs text-fog-dim leading-relaxed mb-3">{selectedNode.fullName}</p>
                  <p className="text-xs text-fog-dim/80 leading-relaxed">{selectedNode.description}</p>

                  <div className="mt-3 pt-3 border-t border-white/[0.05] grid grid-cols-2 gap-3">
                    {selectedNode.cap && (
                      <div>
                        <p className="research-label mb-0.5">Market Cap</p>
                        <p className="text-xs font-semibold mono-nums text-fog">{formatMarketCap(selectedNode.cap)}</p>
                      </div>
                    )}
                    {selectedNode.revenueExposure && (
                      <div>
                        <p className="research-label mb-0.5">AI Rev. Exposure</p>
                        <p className="text-xs font-semibold mono-nums text-morning-blue">{selectedNode.revenueExposure}%</p>
                      </div>
                    )}
                  </div>
                </GlassCard>

                {/* Connections */}
                <GlassCard padding="md" noHover>
                  <p className="research-label mb-2">Connections</p>
                  <div className="space-y-1.5">
                    {EDGES.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).map((edge, i) => {
                      const other = edge.source === selectedNode.id ? edge.target : edge.source
                      const otherNode = NODES.find(n => n.id === other)
                      const dir = edge.source === selectedNode.id ? '→' : '←'
                      return (
                        <button key={i} onClick={() => setSelected(other)}
                          className="w-full flex items-center gap-2 text-left hover:bg-white/[0.03] rounded-md px-1.5 py-1 transition-colors">
                          <span className="text-fog-dim/40 text-xs w-3">{dir}</span>
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: otherNode?.color ?? '#888' }} />
                          <span className="text-xs text-fog flex-1">{other}</span>
                          <div className="h-px flex-shrink-0 rounded-full opacity-60"
                            style={{ width: `${edge.relationship === 'critical' ? 20 : edge.relationship === 'important' ? 12 : 6}px`, backgroundColor: EDGE_STYLE[edge.relationship].color }} />
                          <span className="text-[9px] text-fog-dim/50 truncate max-w-[60px]">{edge.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </GlassCard>

                {/* Query button for this node */}
                <button
                  onClick={() => { setQuery(selectedNode.id); setActiveQuery(selectedNode.id) }}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all"
                  style={{ background: 'rgba(224,185,106,0.1)', border: '1px solid rgba(224,185,106,0.2)', color: '#E0B96A' }}
                >
                  <Zap className="w-3.5 h-3.5" />
                  Who benefits if {selectedNode.id} increases?
                </button>
              </motion.div>
            ) : (
              <motion.div key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <GlassCard padding="md">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-morning-blue mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-fog mb-1">AI Supply Chain</p>
                      <p className="text-xs text-fog-dim leading-relaxed">
                        Click any node to see its supply chain connections, AI revenue exposure, and dependency relationships.
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legend */}
          <GlassCard padding="md" noHover>
            <p className="research-label mb-3">Legend</p>
            <div className="space-y-2 mb-3">
              {(Object.entries(TIER_META) as [string, typeof TIER_META[SCNode['tier']]][]).map(([t, meta]) => (
                <div key={t} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  <span className="text-[11px] text-fog-dim">{meta.label}</span>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-white/[0.05] space-y-1.5">
              <p className="research-label mb-1.5">Edge Weight</p>
              {[
                { rel: 'critical',  label: 'Critical dependency' },
                { rel: 'important', label: 'Important dependency' },
                { rel: 'moderate',  label: 'Moderate dependency' },
              ].map(e => (
                <div key={e.rel} className="flex items-center gap-2">
                  <div className="h-px rounded-full" style={{ width: e.rel === 'critical' ? 20 : e.rel === 'important' ? 14 : 8, backgroundColor: EDGE_STYLE[e.rel as SCEdge['relationship']].color }} />
                  <span className="text-[10px] text-fog-dim">{e.label}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Universe count */}
          <div className="text-center">
            <p className="text-[10px] text-fog-dim/50">{NODES.length} companies · {EDGES.length} relationships</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
