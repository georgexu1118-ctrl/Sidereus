'use client'

import { motion } from 'framer-motion'
import { cn, getChangeColor, formatPct } from '@/lib/utils'
import GlassCard from './GlassCard'

interface MetricCardProps {
  label: string
  value: string | number
  subValue?: string
  change?: number
  changeLabel?: string
  accent?: string
  icon?: React.ReactNode
  large?: boolean
  className?: string
  delay?: number
}

export default function MetricCard({
  label,
  value,
  subValue,
  change,
  changeLabel,
  accent,
  icon,
  large = false,
  className,
  delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    >
      <GlassCard className={cn('relative overflow-hidden', className)} padding="md">
        {/* Accent color bar at top */}
        {accent && (
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${accent}60, transparent)` }}
          />
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="research-label mb-1.5 truncate">{label}</p>
            <p
              className={cn(
                'font-medium mono-nums tracking-tight text-fog',
                large ? 'text-3xl' : 'text-xl'
              )}
            >
              {value}
            </p>
            {subValue && (
              <p className="text-xs text-fog-dim mt-0.5 truncate">{subValue}</p>
            )}
          </div>

          {icon && (
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: accent ? `${accent}15` : 'rgba(255,255,255,0.04)' }}
            >
              {icon}
            </div>
          )}
        </div>

        {change !== undefined && (
          <div className={cn('flex items-center gap-1.5 mt-2.5', getChangeColor(change))}>
            <span className="text-sm font-medium mono-nums">
              {formatPct(change)}
            </span>
            {changeLabel && (
              <span className="text-xs text-fog-dim">{changeLabel}</span>
            )}
          </div>
        )}
      </GlassCard>
    </motion.div>
  )
}
