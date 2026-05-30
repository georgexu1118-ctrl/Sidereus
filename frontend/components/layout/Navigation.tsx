'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  Network,
  GitBranch,
  Star,
  Bot,
  Settings,
  Zap,
  FlaskConical,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Dashboard',       href: '/dashboard',        icon: LayoutDashboard },
  { label: 'Research',        href: '/research',          icon: FileText },
  { label: 'AI Supply Chain', href: '/supply-chain',      icon: Network },
  { label: 'Biotech Analysis',href: '/biotech',           icon: FlaskConical },
  { label: 'Knowledge Graph', href: '/knowledge-graph',   icon: GitBranch },
  { label: 'Watchlists',      href: '/watchlists',        icon: Star },
  { label: 'Agents',          href: '/agents',            icon: Bot, badge: true },
]

const SECTOR_ITEMS = [
  { label: 'AI Infrastructure',  href: '/research?domain=ai-supply-chain',      color: '#8FA9D8' },
  { label: 'Semiconductors',     href: '/research?domain=semiconductors',        color: '#B5A6D8' },
  { label: 'Data Centers',       href: '/research?domain=data-center',           color: '#E0B96A' },
  { label: 'Biotechnology',      href: '/research?domain=biotechnology',         color: '#E4B8A0' },
  { label: 'Frontier Tech',      href: '/research?domain=frontier-technology',   color: '#5E6FA3' },
]

const MONET_URL =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/59/Monet_-_Impression%2C_Sunrise.jpg/80px-Monet_-_Impression%2C_Sunrise.jpg'

export default function Navigation() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href.split('?')[0])
  }

  return (
    <nav className="flex flex-col h-full glass-heavy border-r border-white/[0.05]">
      {/* ── Logo ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/[0.05]">
        <div className="relative flex-shrink-0">
          {/* Monet painting as logo */}
          <img
            src={MONET_URL}
            alt="Impression, Sunrise — Monet"
            className="w-9 h-9 rounded-lg object-cover ring-1 ring-white/10"
            style={{ imageRendering: 'auto' }}
          />
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-gold animate-pulse-soft" />
        </div>
        <div>
          <span className="text-fog font-semibold text-base tracking-tight">Sidereus</span>
          <div className="flex items-center gap-1 mt-0">
            <Zap className="w-2.5 h-2.5 text-gold" />
            <span className="text-[10px] text-gold/80 tracking-widest uppercase font-medium">
              Research OS
            </span>
          </div>
        </div>
      </div>

      {/* ── Main nav ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150',
                  active
                    ? 'bg-morning-blue/12 text-morning-blue'
                    : 'text-fog-dim hover:text-fog hover:bg-white/[0.04]'
                )}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-morning-blue"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={active ? 2.5 : 1.75} />
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold animate-pulse-soft" />
                )}
              </motion.div>
            </Link>
          )
        })}

        {/* ── Sectors ──────────────────────────────────────── */}
        <div className="mt-5 mb-2 px-3">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-white/[0.05]" />
            <span className="research-label text-[9px]">Sectors</span>
            <div className="h-px flex-1 bg-white/[0.05]" />
          </div>
        </div>

        {SECTOR_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            <motion.div
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-fog-dim hover:text-fog hover:bg-white/[0.03] transition-colors duration-150"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.15 }}
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs font-medium">{item.label}</span>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="px-3 pb-4 pt-3 border-t border-white/[0.05]">
        <Link href="/settings">
          <motion.div
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-fog-dim hover:text-fog hover:bg-white/[0.04] transition-colors duration-150"
            whileHover={{ x: 2 }}
            transition={{ duration: 0.15 }}
          >
            <Settings className="w-4 h-4" strokeWidth={1.75} />
            <span className="text-sm font-medium">Settings</span>
          </motion.div>
        </Link>
      </div>
    </nav>
  )
}
