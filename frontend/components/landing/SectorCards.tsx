'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SECTOR_META } from '@/lib/constants'

export default function SectorCards() {
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
            Coverage Universe
          </motion.p>
          <motion.h2
            className="text-4xl md:text-5xl font-bold tracking-tight text-gradient-white"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Five frontier domains.
            <br />
            <span className="text-gradient-gold">Zero compromise on depth.</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTOR_META.map((sector, i) => (
            <motion.div
              key={sector.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: 'easeOut' }}
              className={i === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}
            >
              <Link href={`/research?domain=${sector.id}`} className="block h-full">
                <motion.div
                  className="glass-card h-full rounded-xl p-6 flex flex-col gap-4 cursor-pointer group"
                  whileHover={{ y: -4, transition: { duration: 0.2, ease: 'easeOut' } }}
                >
                  {/* Top bar accent */}
                  <div
                    className="w-8 h-0.5 rounded-full"
                    style={{ background: sector.color }}
                  />

                  {/* Header */}
                  <div>
                    <p
                      className="text-lg font-semibold mb-1.5 group-hover:opacity-90 transition-opacity"
                      style={{ color: sector.color }}
                    >
                      {sector.label}
                    </p>
                    <p className="text-sm text-fog-dim leading-relaxed">
                      {sector.description}
                    </p>
                  </div>

                  {/* Ticker chips */}
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {sector.tickers.map((ticker) => (
                      <span
                        key={ticker}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md mono-nums"
                        style={{
                          background: `${sector.color}12`,
                          color: sector.color,
                          border: `1px solid ${sector.color}20`,
                        }}
                      >
                        {ticker}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
                    <span className="text-xs text-fog-dim">{sector.stat}</span>
                    <ArrowRight
                      className="w-4 h-4 text-fog-dim group-hover:text-fog group-hover:translate-x-1 transition-all duration-200"
                    />
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
