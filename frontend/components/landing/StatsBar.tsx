'use client'

import { motion } from 'framer-motion'

const STATS = [
  { value: '10', label: 'Specialized AI Agents', accent: '#B5A6D8' },
  { value: '5', label: 'Research Domains', accent: '#8FA9D8' },
  { value: '5–8 pg', label: 'Report Length', accent: '#E0B96A' },
  { value: '< 5 min', label: 'Report Generation', accent: '#E4B8A0' },
  { value: 'GS-Level', label: 'Research Standard', accent: '#5E6FA3' },
]

export default function StatsBar() {
  return (
    <section className="relative z-10 py-12 border-y border-white/[0.05]">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(5,6,8,0) 0%, rgba(11,14,19,0.6) 20%, rgba(11,14,19,0.6) 80%, rgba(5,6,8,0) 100%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-white/[0.04]">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="flex flex-col items-center py-8 px-4 bg-abyss/80 backdrop-blur-xs text-center"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
            >
              <span
                className="text-3xl font-bold tracking-tight mono-nums"
                style={{ color: stat.accent }}
              >
                {stat.value}
              </span>
              <span className="mt-1.5 text-xs text-fog-dim text-center leading-tight">
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
