'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, Filter, Search, Info } from 'lucide-react'
import GlassCard from '@/components/glass/GlassCard'

const ENTITY_TYPES = ['Company', 'Product', 'Technology', 'Executive', 'Patent', 'Disease', 'Drug'] as const
type EntityType = typeof ENTITY_TYPES[number]

const ENTITY_COLORS: Record<EntityType, string> = {
  Company: '#8FA9D8',
  Product: '#B5A6D8',
  Technology: '#E0B96A',
  Executive: '#E4B8A0',
  Patent: '#5E6FA3',
  Disease: '#A86A6A',
  Drug: '#6AA87A',
}

const DEMO_NODES = [
  { id: '1', type: 'Company' as EntityType, name: 'NVIDIA', x: 480, y: 240, size: 44 },
  { id: '2', type: 'Product' as EntityType, name: 'H200 GPU', x: 340, y: 160, size: 30 },
  { id: '3', type: 'Product' as EntityType, name: 'B200 GPU', x: 340, y: 320, size: 32 },
  { id: '4', type: 'Technology' as EntityType, name: 'CUDA', x: 240, y: 240, size: 36 },
  { id: '5', type: 'Technology' as EntityType, name: 'NVLink', x: 620, y: 160, size: 28 },
  { id: '6', type: 'Company' as EntityType, name: 'TSMC', x: 200, y: 380, size: 36 },
  { id: '7', type: 'Company' as EntityType, name: 'Microsoft', x: 680, y: 280, size: 34 },
  { id: '8', type: 'Company' as EntityType, name: 'Google', x: 680, y: 380, size: 32 },
  { id: '9', type: 'Executive' as EntityType, name: 'Jensen Huang', x: 480, y: 100, size: 26 },
  { id: '10', type: 'Technology' as EntityType, name: 'CoWoS', x: 300, y: 440, size: 24 },
  { id: '11', type: 'Patent' as EntityType, name: 'DLSS Patent', x: 560, y: 440, size: 22 },
  { id: '12', type: 'Company' as EntityType, name: 'AWS', x: 800, y: 220, size: 30 },
]

const DEMO_EDGES = [
  { s: '1', t: '2', label: 'manufactures' },
  { s: '1', t: '3', label: 'manufactures' },
  { s: '4', t: '1', label: 'owned_by' },
  { s: '5', t: '1', label: 'owned_by' },
  { s: '6', t: '2', label: 'foundry_for' },
  { s: '6', t: '3', label: 'foundry_for' },
  { s: '6', t: '10', label: 'provides' },
  { s: '1', t: '7', label: 'supplies' },
  { s: '1', t: '8', label: 'supplies' },
  { s: '1', t: '12', label: 'supplies' },
  { s: '9', t: '1', label: 'leads' },
  { s: '11', t: '1', label: 'owned_by' },
]

export default function KnowledgeGraphPage() {
  const [selectedType, setSelectedType] = useState<EntityType | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const selectedNodeData = selectedNode ? DEMO_NODES.find((n) => n.id === selectedNode) : null
  const connectedIds = selectedNode
    ? new Set([selectedNode, ...DEMO_EDGES.filter((e) => e.s === selectedNode || e.t === selectedNode).flatMap((e) => [e.s, e.t])])
    : null

  return (
    <div className="flex h-full flex-col p-6 md:p-8">
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <p className="research-label mb-1">Entity Relationship Explorer</p>
          <h1 className="text-2xl font-bold text-fog tracking-tight flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-lavender" strokeWidth={1.5} />
            Knowledge Graph
          </h1>
        </div>

        {/* Entity type filters */}
        <div className="flex items-center gap-1.5">
          {ENTITY_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(selectedType === type ? null : type)}
              className="text-[10px] font-medium px-2.5 py-1.5 rounded-md transition-all duration-150"
              style={{
                background: selectedType === type ? `${ENTITY_COLORS[type]}20` : 'rgba(255,255,255,0.04)',
                color: selectedType === type ? ENTITY_COLORS[type] : '#888884',
                border: `1px solid ${selectedType === type ? `${ENTITY_COLORS[type]}30` : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </motion.div>

      <div className="flex gap-5 flex-1 min-h-0">
        {/* Graph */}
        <motion.div
          className="flex-1 glass-card rounded-xl overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <svg viewBox="0 0 980 540" className="w-full h-full">
            <defs>
              <filter id="nodeGlow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Edges */}
            {DEMO_EDGES.map((edge, i) => {
              const src = DEMO_NODES.find((n) => n.id === edge.s)
              const tgt = DEMO_NODES.find((n) => n.id === edge.t)
              if (!src || !tgt) return null
              const highlighted = connectedIds ? connectedIds.has(src.id) && connectedIds.has(tgt.id) : true
              return (
                <line
                  key={i}
                  x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                  stroke={highlighted ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.06)'}
                  strokeWidth={highlighted ? 1.5 : 0.75}
                  strokeDasharray={highlighted ? 'none' : '4 4'}
                />
              )
            })}

            {/* Nodes */}
            {DEMO_NODES.map((node) => {
              const dimmed = (connectedIds && !connectedIds.has(node.id)) ||
                (selectedType && node.type !== selectedType)
              const color = ENTITY_COLORS[node.type]
              const isSelected = selectedNode === node.id
              return (
                <g key={node.id} onClick={() => setSelectedNode(node.id === selectedNode ? null : node.id)} style={{ cursor: 'pointer' }}>
                  {isSelected && (
                    <circle cx={node.x} cy={node.y} r={node.size / 2 + 7}
                      fill="none" stroke={color} strokeWidth={2} strokeOpacity={0.4} filter="url(#nodeGlow)" />
                  )}
                  <circle
                    cx={node.x} cy={node.y} r={node.size / 2}
                    fill={dimmed ? 'rgba(255,255,255,0.02)' : `${color}18`}
                    stroke={dimmed ? 'rgba(255,255,255,0.06)' : color}
                    strokeWidth={isSelected ? 2 : 1.2}
                    strokeOpacity={dimmed ? 0.2 : 0.75}
                  />
                  <text
                    x={node.x} y={node.y}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={9} fontWeight={600}
                    fill={dimmed ? 'rgba(255,255,255,0.15)' : color}
                    style={{ fontFamily: 'var(--font-geist-sans)', userSelect: 'none' }}
                  >
                    {node.name.length > 10 ? node.name.slice(0, 10) + '…' : node.name}
                  </text>
                  <text
                    x={node.x} y={node.y + node.size / 2 + 10}
                    textAnchor="middle" fontSize={7.5}
                    fill={dimmed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.35)'}
                    style={{ fontFamily: 'var(--font-geist-sans)', userSelect: 'none' }}
                  >
                    {node.type}
                  </text>
                </g>
              )
            })}
          </svg>
        </motion.div>

        {/* Side panel */}
        <motion.div
          className="w-64 flex flex-col gap-4 flex-shrink-0"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {selectedNodeData ? (
            <GlassCard padding="md">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ENTITY_COLORS[selectedNodeData.type] }} />
                <p className="text-sm font-bold text-fog">{selectedNodeData.name}</p>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full border"
                style={{
                  background: `${ENTITY_COLORS[selectedNodeData.type]}12`,
                  color: ENTITY_COLORS[selectedNodeData.type],
                  borderColor: `${ENTITY_COLORS[selectedNodeData.type]}25`,
                }}
              >
                {selectedNodeData.type}
              </span>

              <div className="mt-4 pt-4 border-t border-white/[0.05]">
                <p className="research-label mb-2">Relationships</p>
                <div className="space-y-2">
                  {DEMO_EDGES.filter((e) => e.s === selectedNodeData.id || e.t === selectedNodeData.id).map((e, i) => {
                    const other = e.s === selectedNodeData.id ? e.t : e.s
                    const otherNode = DEMO_NODES.find((n) => n.id === other)
                    const dir = e.s === selectedNodeData.id ? '→' : '←'
                    return (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="text-fog-dim/40 w-3">{dir}</span>
                        <span className="text-fog">{otherNode?.name}</span>
                        <span className="text-fog-dim/60 text-[10px] ml-auto">{e.label}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </GlassCard>
          ) : (
            <GlassCard padding="md">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-lavender mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-fog mb-1">Knowledge Graph</p>
                  <p className="text-xs text-fog-dim leading-relaxed">
                    Entities across companies, products, technologies, executives, and clinical assets — all linked.
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          <GlassCard padding="md" noHover>
            <p className="research-label mb-3">Entity Types</p>
            <div className="space-y-2">
              {ENTITY_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ENTITY_COLORS[type] }} />
                  <span className="text-[11px] text-fog-dim">{type}</span>
                  <span className="ml-auto text-[10px] mono-nums text-fog-dim/50">
                    {DEMO_NODES.filter((n) => n.type === type).length}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
