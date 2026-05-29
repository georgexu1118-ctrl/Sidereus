import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Number formatting ────────────────────────────────────────
export function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  return `$${value.toFixed(0)}`
}

export function formatRevenue(value: number): string {
  return formatMarketCap(value)
}

export function formatPrice(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPct(value: number, decimals = 1): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

export function formatMultiple(value: number, suffix = 'x'): string {
  return `${value.toFixed(1)}${suffix}`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

// ── Color helpers ────────────────────────────────────────────
export function getChangeColor(value: number): string {
  if (value > 0) return 'text-bull'
  if (value < 0) return 'text-bear'
  return 'text-fog-dim'
}

export function getRatingColor(rating: string): string {
  const map: Record<string, string> = {
    BUY: 'text-bull',
    OUTPERFORM: 'text-bull',
    HOLD: 'text-neutral',
    SELL: 'text-bear',
    UNDERPERFORM: 'text-bear',
  }
  return map[rating] ?? 'text-fog-dim'
}

export function getRatingBadgeClass(rating: string): string {
  const map: Record<string, string> = {
    BUY: 'bg-bull/10 text-bull border-bull/20',
    OUTPERFORM: 'bg-bull/10 text-bull border-bull/20',
    HOLD: 'bg-morning-blue/10 text-morning-blue border-morning-blue/20',
    SELL: 'bg-bear/10 text-bear border-bear/20',
    UNDERPERFORM: 'bg-bear/10 text-bear border-bear/20',
  }
  return map[rating] ?? 'bg-surface text-fog-dim'
}

export function getDomainColor(domain: string): string {
  const map: Record<string, string> = {
    'AI Supply Chain': '#8FA9D8',
    Semiconductors: '#B5A6D8',
    'Data Center': '#E0B96A',
    Biotechnology: '#E4B8A0',
    'Frontier Technology': '#5E6FA3',
  }
  return map[domain] ?? '#888884'
}

export function getDomainBadgeClass(domain: string): string {
  const map: Record<string, string> = {
    'AI Supply Chain': 'bg-morning-blue/10 text-morning-blue border-morning-blue/20',
    Semiconductors: 'bg-lavender/10 text-lavender border-lavender/20',
    'Data Center': 'bg-gold/10 text-gold border-gold/20',
    Biotechnology: 'bg-peach/10 text-peach border-peach/20',
    'Frontier Technology': 'bg-indigo/10 text-indigo border-indigo/20',
  }
  return map[domain] ?? 'bg-surface text-fog-dim'
}

// ── Date helpers ─────────────────────────────────────────────
export function formatDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(new Date(dateStr))
}

export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return `${Math.floor(diffDays / 365)}y ago`
}

// ── Misc ─────────────────────────────────────────────────────
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen).trim() + '…'
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function interpolateColor(color1: string, color2: string, factor: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16)
  const g1 = parseInt(color1.slice(3, 5), 16)
  const b1 = parseInt(color1.slice(5, 7), 16)
  const r2 = parseInt(color2.slice(1, 3), 16)
  const g2 = parseInt(color2.slice(3, 5), 16)
  const b2 = parseInt(color2.slice(5, 7), 16)
  const r = Math.round(r1 + (r2 - r1) * factor)
  const g = Math.round(g1 + (g2 - g1) * factor)
  const b = Math.round(b1 + (b2 - b1) * factor)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}
