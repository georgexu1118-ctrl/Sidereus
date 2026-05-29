'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Info, Network, Layers } from 'lucide-react'
import GlassCard from '@/components/glass/GlassCard'
import { getDomainColor } from '@/lib/utils'

// ── Supply chain graph data ────────────────────────────────────
const NODES = [
  // Upstream materials / equipment
  { id: 'ASML', name: 'ASML', tier: 'upstream', subsector: 'Lithography', color: '#B5A6D8', x: 100, y: 200, size: 36 },
  { id: 'AMAT', name: 'Appl. Materials', tier: 'upstream', subsector: 'Deposition', color: '#B5A6D8', x: 100, y: 320, size: 28 },
  { id: 'LRCX', name: 'Lam Research', tier: 'upstream', subsector: 'Etch', color: '#B5A6D8', x: 100, y: 440, size: 26 },
  { id: 'KLAC', name: 'KLA Corp', tier: 'upstream', subsector: 'Inspection', color: '#B5A6D8', x: 100, y: 80, size: 22 },
  // Memory
  { id: 'MU', name: 'Micron', tier: 'upstream', subsector: 'HBM Memory', color: '#8FA9D8', x: 220, y: 120, size: 28 },
  { id: 'HYNIX', name: 'SK Hynix', tier: 'upstream', subsector: 'HBM Memory', color: '#8FA9D8', x: 220, y: 240, size: 26 },
  // Foundry midstream
  { id: 'TSM', name: 'TSMC', tier: 'midstream', subsector: 'Foundry', color: '#E0B96A', x: 360, y: 260, size: 42 },
  { id: 'INTL', name: 'Intel Foundry', tier: 'midstream', subsector: 'Foundry', color: '#E0B96A', x: 360, y: 160, size: 22 },
  // Networking / interconnect
  { id: 'COHR', name: 'Coherent', tier: 'midstream', subsector: 'Optical', color: '#E4B8A0', x: 360, y: 400, size: 24 },
  { id: 'MRVL', name: 'Marvell', tier: 'midstream', subsector: 'Networking', color: '#E4B8A0', x: 480, y: 180, size: 28 },
  // Focal node — NVIDIA
  { id: 'NVDA', name: 'NVIDIA', tier: 'focal', subsector: 'GPU', color: '#6AA87A', x: 560, y: 300, size: 52 },
  // Downstream
  { id: 'SMCI', name: 'SuperMicro', tier: 'downstream', subsector: 'Systems', color: '#5E6FA3', x: 700, y: 180, size: 24 },
  { id: 'VRT', name: 'Vertiv', tier: 'downstream', subsector: 'Thermal', color: '#5E6FA3', x: 700, y: 300, size: 26 },
  { id: 'DELL', name: 'Dell', tier: 'downstream', subsector: 'OEM', color: '#5E6FA3', x: 700, y: 420, size: 22 },
  // Hyperscalers
  { id: 'MSFT', name: 'Microsoft', tier: 'hyperscaler', subsector: 'Cloud', color: '#B5A6D8', x: 860, y: 160, size: 30 },
  { id: 'GOOGL', name: 'Google', tier: 'hyperscaler', subsector: 'Cloud', color: '#B5A6D8', x: 860, y: 260, size: 30 },
  { id: 'AMZN', name: 'AWS', tier: 'hyperscaler', subsector: 'Cloud', color: '#B5A6D8', x: 860, y: 360, size: 28 },
  { id: 'META', name: 'Meta', tier: 'hyperscaler', subsector: 'Cloud', color: '#B5A6D8', x: 860, y: 460, size: 26 },
]

const EDGES = [
  { source: 'ASML', target: 'TSM', label: 'EUV systems', strength: 1.0 },
  { source: 'AMAT', target: 'TSM', label: 'Deposition', strength: 0.8 },
  { source: 'LRCX', target: 'TSM', label: 'Etch', strength: 0.7 },
  { source: 'KLAC', target: 'TSM', label: 'Inspection', strength: 0.5 },
  { source: 'MU', target: 'NVDA', label: 'HBM3E', strength: 0.85 },
  { source: 'HYNIX', target: 'NVDA', label: 'HBM3E', strength: 0.9 },
  { source: 'TSM', target: 'NVDA', label: 'CoWoS / 4nm', strength: 1.0 },
  { source: 'INTL', target: 'MRVL', label: 'Foundry', strength: 0.4 },
  { source: 'COHR', target: 'NVDA', label: 'InfiniBand optics', strength: 0.6 },
  { source: 'MRVL', target: 'NVDA', label: 'Network ASICs', strength: 0.7 },
  { source: 'NVDA', target: 'SMCI', label: 'GPU modules', strength: 0.8 },
  { source: 'NVDA', target: 'VRT', label: 'Liquid cooling', strength: 0.6 },
  { source: 'NVDA', target: 'DELL', label: 'DGX systems', strength: 0.7 },
  { source: 'SMCI', target: 'MSFT', label: 'AI servers', strength: 0.7 },
  { source: 'SMCI', target: 'GOOGL', label: 'AI servers', strength: 0.6 },
  { source: 'NVDA', target: 'MSFT', label: 'GPU compute', strength: 1.0 },
  { source: 'NVDA', target: 'GOOGL', label: 'GPU compute', strength: 0.9 },
  { source: 'NVDA', target: 'AMZN', label: 'GPU compute', strength: 0.85 },
  { source: 'NVDA', target: 'META', label: 'GPU compute', strength: 0.8 },
]

const TIER_LABELS: Record<string, string> = {
  upstream: 'Upstream Equipment & Materials',
  midstream: 'Foundry & Assembly',
  focal: 'Focal Company',
  downstream: 'Systems & Infrastructure',
  hyperscaler: 'End Customers',
}

const TIER_COLORS: Record<string, string> = {
  upstream: '#B5A6D8',
  midstream: '#E0B96A',
  focal: '#6AA87A',
  downstream: '#5E6FA3',
  hyperscaler: '#8FA9D8',
}

export default function SupplyChainPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>('NVDA')
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [search, setSearch] = useState('')

  const getNodeById = (id: string) => NODES.find((n) => n.id === id)

  const connectedNodeIds = selectedNode
    ? new Set([
        selectedNode,
        ...EDGES.filter((e) => e.source === selectedNode || e.target === selectedNode)
          .flatMap((e) => [e.source, e.target]),
      ])
    : null

  const selectedNodeData = selectedNode ? getNodeById(selectedNode) : null
  const connectedEdges = selectedNode
    ? EDGES.filter((e) => e.source === selectedNode || e.target === selectedNode)
    : []

  return (
    <div className="flex h-full flex-col p-6 md:p-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <p className="research-label mb-1">Interactive Visualization</p>
          <h1 className="text-2xl font-bold text-fog tracking-tight flex items-center gap-2">
            <Network className="w-6 h-6 text-morning-blue" strokeWidth={1.5} />
            AI Supply Chain Graph
          </h1>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fog-dim/50" />
          <input
            type="text"
            placeholder="Search node…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-surface/50 border border-white/[0.06] rounded-lg text-sm text-fog placeholder:text-fog-dim/40 focus:outline-none focus:ring-1 focus:ring-indigo/40 w-40"
          />
        </div>
      </motion.div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* ── SVG Graph ────────────────────────────────────── */}
        <motion.div
          className="flex-1 glass-card rounded-xl overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <svg
            ref={svgRef}
            viewBox="0 0 980 560"
            className="w-full h-full"
            style={{ background: 'transparent' }}
          >
            <defs>
              {Object.entries(TIER_COLORS).map(([tier, color]) => (
                <radialGradient key={tier} id={`grad-${tier}`} cx="50%" cy="35%" r="65%">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.12} />
                </radialGradient>
              ))}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* ── Tier lane backgrounds ───────────────────── */}
            {[
              { x: 60, w: 200, tier: 'upstream' },
              { x: 310, w: 200, tier: 'midstream' },
              { x: 660, w: 160, tier: 'downstream' },
              { x: 820, w: 150, tier: 'hyperscaler' },
            ].map((lane) => (
              <rect
                key={lane.tier}
                x={lane.x}
                y={20}
                width={lane.w}
                height={520}
                rx={8}
                fill={`url(#grad-${lane.tier})`}
                opacity={0.25}
              />
            ))}

            {/* ── Edges ──────────────────────────────────── */}
            {EDGES.map((edge, i) => {
              const src = getNodeById(edge.source)
              const tgt = getNodeById(edge.target)
              if (!src || !tgt) return null
              const isHighlighted =
                connectedNodeIds?.has(edge.source) && connectedNodeIds?.has(edge.target)
              const opacity = connectedNodeIds ? (isHighlighted ? 0.7 : 0.1) : 0.35
              return (
                <line
                  key={i}
                  x1={src.x} y1={src.y}
                  x2={tgt.x} y2={tgt.y}
                  stroke={isHighlighted ? src.color : 'rgba(255,255,255,0.2)'}
                  strokeWidth={isHighlighted ? edge.strength * 2.5 : 1}
                  strokeOpacity={opacity}
                  strokeDasharray={isHighlighted ? 'none' : '4 4'}
                />
              )
            })}

            {/* ── Nodes ──────────────────────────────────── */}
            {NODES.map((node) => {
              const dimmed = connectedNodeIds ? !connectedNodeIds.has(node.id) : false
              const isSelected = selectedNode === node.id
              const matchesSearch = search && node.id.toLowerCase().includes(search.toLowerCase())
              return (
                <g
                  key={node.id}
                  onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Glow ring for selected */}
                  {isSelected && (
                    <circle
                      cx={node.x} cy={node.y}
                      r={node.size / 2 + 6}
                      fill="none"
                      stroke={node.color}
                      strokeWidth={2}
                      strokeOpacity={0.5}
                      filter="url(#glow)"
                    />
                  )}
                  {/* Main circle */}
                  <circle
                    cx={node.x} cy={node.y}
                    r={node.size / 2}
                    fill={dimmed ? 'rgba(255,255,255,0.03)' : `${node.color}22`}
                    stroke={dimmed ? 'rgba(255,255,255,0.08)' : node.color}
                    strokeWidth={isSelected ? 2 : 1.25}
                    strokeOpacity={dimmed ? 0.2 : 0.8}
                  />
                  {/* Ticker label */}
                  <text
                    x={node.x} y={node.y + 1}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={node.size > 34 ? 11 : 9}
                    fontWeight={isSelected ? 700 : 600}
                    fill={dimmed ? 'rgba(255,255,255,0.2)' : node.color}
                    style={{ fontFamily: 'var(--font-geist-mono)', userSelect: 'none' }}
                  >
                    {node.id}
                  </text>
                  {/* Name label below */}
                  {!dimmed && (
                    <text
                      x={node.x} y={node.y + node.size / 2 + 10}
                      textAnchor="middle"
                      fontSize={8}
                      fill="rgba(244,244,242,0.45)"
                      style={{ fontFamily: 'var(--font-geist-sans)', userSelect: 'none' }}
                    >
                      {node.name}
                    </text>
                  )}
                </g>
              )
            })}

            {/* ── Tier labels ─────────────────────────────── */}
            {[
              { x: 160, label: 'UPSTREAM' },
              { x: 410, label: 'MIDSTREAM' },
              { x: 560, label: 'FOCAL' },
              { x: 740, label: 'DOWNSTREAM' },
              { x: 895, label: 'CUSTOMERS' },
            ].map((l) => (
              <text
                key={l.label}
                x={l.x} y={540}
                textAnchor="middle"
                fontSize={8}
                letterSpacing={2}
                fill="rgba(255,255,255,0.2)"
                style={{ fontFamily: 'var(--font-geist-sans)', userSelect: 'none', textTransform: 'uppercase' }}
              >
                {l.label}
              </text>
            ))}
          </svg>
        </motion.div>

        {/* ── Side panel ──────────────────────────────────── */}
        <motion.div
          className="w-64 flex flex-col gap-4 flex-shrink-0"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {selectedNodeData ? (
            <>
              <GlassCard padding="md">
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: selectedNodeData.color }}
                  />
                  <p className="text-sm font-bold text-fog">{selectedNodeData.id}</p>
                </div>
                <p className="text-xs text-fog-dim mb-1">{selectedNodeData.name}</p>
                <p className="text-[10px] text-fog-dim/60">{TIER_LABELS[selectedNodeData.tier]}</p>
                <div className="mt-3 pt-3 border-t border-white/[0.05]">
                  <p className="research-label mb-2">Subsector</p>
                  <p className="text-xs text-fog">{selectedNodeData.subsector}</p>
                </div>
              </GlassCard>

              <GlassCard padding="md" noHover>
                <p className="research-label mb-3">Connections ({connectedEdges.length})</p>
                <div className="space-y-2">
                  {connectedEdges.map((edge, i) => {
                    const other = edge.source === selectedNodeData.id ? edge.target : edge.source
                    const dir = edge.source === selectedNodeData.id ? '→' : '←'
                    const otherNode = getNodeById(other)
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-fog-dim/50 text-xs w-3 text-center">{dir}</span>
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: otherNode?.color ?? '#888' }}
                        />
                        <span className="text-xs text-fog flex-1">{other}</span>
                        <div
                          className="h-0.5 rounded-full"
                          style={{ width: `${edge.strength * 24}px`, backgroundColor: otherNode?.color ?? '#888', opacity: 0.6 }}
                        />
                      </div>
                    )
                  })}
                </div>
              </GlassCard>
            </>
          ) : (
            <GlassCard padding="md">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-morning-blue mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-fog mb-1">Select a node</p>
                  <p className="text-xs text-fog-dim leading-relaxed">
                    Click any company in the graph to see its supply chain connections and dependencies.
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Legend */}
          <GlassCard padding="md" noHover>
            <p className="research-label mb-3">Legend</p>
            <div className="space-y-2">
              {Object.entries(TIER_COLORS).map(([tier, color]) => (
                <div key={tier} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[11px] text-fog-dim capitalize">{TIER_LABELS[tier]}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
