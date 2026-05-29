import type { NavigationItem } from '@/types'

export const APP_NAME = 'Sidereus'
export const APP_TAGLINE = 'AI-Native Equity Research'
export const APP_DESCRIPTION =
  'Institutional-grade intelligence across AI infrastructure, semiconductors, and biotechnology.'

export const RESEARCH_DOMAINS = [
  'AI Supply Chain',
  'Semiconductors',
  'Data Center',
  'Biotechnology',
  'Frontier Technology',
] as const

export const SECTOR_META = [
  {
    id: 'ai-supply-chain',
    label: 'AI Supply Chain',
    description: 'GPU ecosystems, foundries, optical interconnects, packaging, and HBM memory',
    icon: '⬡',
    color: '#8FA9D8',
    gradient: 'from-morning-blue/20 to-transparent',
    tickers: ['NVDA', 'TSM', 'ASML', 'AMAT', 'LRCX', 'MU'],
    stat: '$1.2T TAM by 2030',
  },
  {
    id: 'semiconductors',
    label: 'Semiconductors',
    description: 'Foundry economics, node transitions, ASIC/FPGA, power management, analog',
    icon: '◈',
    color: '#B5A6D8',
    gradient: 'from-lavender/20 to-transparent',
    tickers: ['AVGO', 'MRVL', 'AMD', 'INTC', 'QCOM', 'CDNS'],
    stat: '$1T+ market by 2030',
  },
  {
    id: 'data-center',
    label: 'Data Center',
    description: 'Hyperscaler capex, power density, cooling, rack architecture, colocation',
    icon: '▣',
    color: '#E0B96A',
    gradient: 'from-gold/20 to-transparent',
    tickers: ['VRT', 'SMCI', 'EQIX', 'DLR', 'DELL', 'HPE'],
    stat: '62GW new capacity by 2027',
  },
  {
    id: 'biotechnology',
    label: 'Biotechnology',
    description: 'Drug pipelines, FDA pathways, clinical trial analysis, rNPV modeling',
    icon: '⬡',
    color: '#E4B8A0',
    gradient: 'from-peach/20 to-transparent',
    tickers: ['MRNA', 'REGN', 'VRTX', 'GILD', 'ALNY', 'BEAM'],
    stat: '$3.7T biopharma by 2030',
  },
  {
    id: 'frontier-technology',
    label: 'Frontier Technology',
    description: 'Foundation model companies, AI infrastructure, robotics, quantum computing',
    icon: '◎',
    color: '#5E6FA3',
    gradient: 'from-indigo/20 to-transparent',
    tickers: ['META', 'GOOGL', 'MSFT', 'AAPL', 'AMZN', 'TSLA'],
    stat: '$15T AI value creation',
  },
]

export const NAVIGATION: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    label: 'Research',
    href: '/research',
    icon: 'FileText',
    children: [
      { label: 'All Reports', href: '/research' },
      { label: 'AI Supply Chain', href: '/research?domain=ai-supply-chain' },
      { label: 'Semiconductors', href: '/research?domain=semiconductors' },
      { label: 'Data Center', href: '/research?domain=data-center' },
      { label: 'Biotechnology', href: '/research?domain=biotechnology' },
      { label: 'Frontier Tech', href: '/research?domain=frontier-technology' },
    ],
  },
  {
    label: 'Supply Chain',
    href: '/supply-chain',
    icon: 'Network',
  },
  {
    label: 'Knowledge Graph',
    href: '/knowledge-graph',
    icon: 'GitBranch',
  },
  {
    label: 'Watchlists',
    href: '/watchlists',
    icon: 'Star',
  },
  {
    label: 'Agents',
    href: '/agents',
    icon: 'Bot',
    badge: '●',
  },
]

export const AGENT_NAMES: Record<string, string> = {
  data_collection: 'Data Collection',
  sec_filing: 'SEC Filing',
  earnings_call: 'Earnings Intelligence',
  industry_research: 'Industry Research',
  financial_modeling: 'Financial Modeling',
  valuation: 'Valuation',
  competitive_intelligence: 'Competitive Intelligence',
  risk_assessment: 'Risk Assessment',
  skeptical_analyst: 'Skeptical Analyst',
  portfolio_manager: 'Portfolio Manager',
}

export const AGENT_COLORS: Record<string, string> = {
  data_collection: '#8FA9D8',
  sec_filing: '#B5A6D8',
  earnings_call: '#E0B96A',
  industry_research: '#E4B8A0',
  financial_modeling: '#5E6FA3',
  valuation: '#6AA87A',
  competitive_intelligence: '#8FA9D8',
  risk_assessment: '#A86A6A',
  skeptical_analyst: '#E0B96A',
  portfolio_manager: '#B5A6D8',
}

export const MOCK_TICKERS = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation', domain: 'AI Supply Chain' as const },
  { ticker: 'ASML', name: 'ASML Holding', domain: 'Semiconductors' as const },
  { ticker: 'TSM', name: 'Taiwan Semiconductor', domain: 'Semiconductors' as const },
  { ticker: 'VRT', name: 'Vertiv Holdings', domain: 'Data Center' as const },
  { ticker: 'MRNA', name: 'Moderna', domain: 'Biotechnology' as const },
  { ticker: 'AVGO', name: 'Broadcom', domain: 'AI Supply Chain' as const },
  { ticker: 'ANET', name: 'Arista Networks', domain: 'Data Center' as const },
  { ticker: 'MU', name: 'Micron Technology', domain: 'AI Supply Chain' as const },
]
