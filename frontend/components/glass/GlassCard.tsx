'use client'

import { forwardRef } from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCardProps extends HTMLMotionProps<'div'> {
  /** 'default' | 'heavy' (more opaque) | 'light' (more transparent) */
  variant?: 'default' | 'heavy' | 'light' | 'elevated'
  /** adds the premium colored border gradient  */
  gradient?: boolean
  /** disable hover elevation effect */
  noHover?: boolean
  /** accent glow color */
  glow?: 'lavender' | 'blue' | 'gold' | 'none'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

const variantStyles = {
  default: 'glass-card',
  heavy: 'glass-heavy rounded-xl',
  light: 'glass-light rounded-xl',
  elevated: [
    'rounded-xl',
    'bg-gradient-to-br from-surface-mid/70 to-surface/50',
    'backdrop-blur-heavy',
    'border border-white/[0.07]',
    'shadow-[0_8px_48px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.07)]',
  ].join(' '),
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
  xl: 'p-8',
}

const glowStyles = {
  none: '',
  lavender: 'glow-lavender',
  blue: 'glow-blue',
  gold: 'glow-gold',
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      variant = 'default',
      gradient = false,
      noHover = false,
      glow = 'none',
      padding = 'md',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const inner = (
      <motion.div
        ref={ref}
        className={cn(
          variantStyles[variant],
          paddingStyles[padding],
          glowStyles[glow],
          !noHover && 'transition-all duration-300 ease-out',
          !noHover && 'hover:border-lavender/15 hover:shadow-glass-hover',
          className
        )}
        whileHover={!noHover ? { y: -2, transition: { duration: 0.25, ease: 'easeOut' } } : undefined}
        {...props}
      >
        {children}
      </motion.div>
    )

    if (gradient) {
      return (
        <div className="research-card-border transition-opacity duration-300 hover:opacity-100">
          {inner}
        </div>
      )
    }

    return inner
  }
)

GlassCard.displayName = 'GlassCard'
export default GlassCard
