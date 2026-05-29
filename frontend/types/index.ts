// ─────────────────────────────────────────────────────────────
// Sidereus — Core TypeScript Types
// ─────────────────────────────────────────────────────────────

export type ResearchDomain =
  | 'AI Supply Chain'
  | 'Semiconductors'
  | 'Data Center'
  | 'Biotechnology'
  | 'Frontier Technology'

export type ReportRating = 'BUY' | 'HOLD' | 'SELL' | 'UNDERPERFORM' | 'OUTPERFORM'

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed'

// ── Company ────────────────────────────────────────────────
export interface Company {
  id: string
  ticker: string
  name: string
  domain: ResearchDomain
  sector: string
  exchange: string
  logo_url?: string
  description?: string
  market_cap?: number
  created_at: string
  updated_at: string
}

export interface CompanyMetrics {
  price: number
  price_change: number
  price_change_pct: number
  market_cap: number
  pe_ratio?: number
  pb_ratio?: number
  ps_ratio?: number
  ev_ebitda?: number
  revenue_ttm?: number
  revenue_growth_yoy?: number
  gross_margin?: number
  ebitda_margin?: number
  net_margin?: number
  free_cash_flow?: number
  debt_to_equity?: number
  current_ratio?: number
  beta?: number
  week_52_high?: number
  week_52_low?: number
  avg_volume?: number
}

// ── Research Report ────────────────────────────────────────
export interface ResearchReport {
  id: string
  company_id: string
  ticker: string
  company_name: string
  domain: ResearchDomain
  rating: ReportRating
  price_target: number
  current_price: number
  upside_pct: number

  // Report sections
  executive_summary: string
  investment_thesis: string
  industry_overview: string
  company_overview: string
  competitive_positioning: string
  management_analysis: string
  financial_analysis: string
  valuation: string
  bull_case: string
  base_case: string
  bear_case: string
  catalysts: string[]
  risks: string[]
  variant_perception: string
  key_monitoring_indicators: string[]
  investment_conclusion: string

  // Cases with prices
  bull_price_target: number
  base_price_target: number
  bear_price_target: number
  bull_probability: number
  base_probability: number
  bear_probability: number

  // Metadata
  analyst_name?: string
  version: number
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
}

// ── Supply Chain ────────────────────────────────────────────
export interface SupplyChainNode {
  id: string
  ticker: string
  name: string
  tier: 'upstream' | 'midstream' | 'downstream'
  subsector: string
  revenue_exposure?: number
  is_primary: boolean
}

export interface SupplyChainEdge {
  source: string
  target: string
  relationship: 'supplier' | 'customer' | 'competitor' | 'partner'
  strength: number
  revenue_exposure?: number
}

export interface SupplyChainGraph {
  nodes: SupplyChainNode[]
  edges: SupplyChainEdge[]
  focal_ticker: string
  second_order: SupplyChainNode[]
  third_order: SupplyChainNode[]
}

// ── Knowledge Graph ─────────────────────────────────────────
export type EntityType =
  | 'Company'
  | 'Product'
  | 'Technology'
  | 'Executive'
  | 'Patent'
  | 'Disease'
  | 'Drug'
  | 'ClinicalAsset'
  | 'Market'

export interface KnowledgeNode {
  id: string
  type: EntityType
  name: string
  ticker?: string
  metadata: Record<string, unknown>
  created_at: string
}

export interface KnowledgeEdge {
  id: string
  source_id: string
  target_id: string
  relationship: string
  weight: number
  metadata: Record<string, unknown>
  created_at: string
}

// ── Agent System ─────────────────────────────────────────────
export type AgentType =
  | 'data_collection'
  | 'sec_filing'
  | 'earnings_call'
  | 'industry_research'
  | 'financial_modeling'
  | 'valuation'
  | 'competitive_intelligence'
  | 'risk_assessment'
  | 'skeptical_analyst'
  | 'portfolio_manager'

export interface AgentRun {
  id: string
  report_id: string
  agent_type: AgentType
  status: AgentStatus
  started_at?: string
  completed_at?: string
  elapsed_seconds?: number
  output?: Record<string, unknown>
  error?: string
}

export interface AgentLog {
  id: string
  run_id: string
  level: 'info' | 'warning' | 'error'
  message: string
  created_at: string
}

// ── Watchlist ────────────────────────────────────────────────
export interface WatchlistItem {
  id: string
  user_id: string
  ticker: string
  company_name: string
  domain: ResearchDomain
  notes?: string
  alert_price_target?: number
  added_at: string
}

// ── Research Project ─────────────────────────────────────────
export interface ResearchProject {
  id: string
  user_id: string
  name: string
  description?: string
  domain: ResearchDomain
  tickers: string[]
  status: 'active' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}

// ── Biotech specific ─────────────────────────────────────────
export interface ClinicalTrial {
  asset_name: string
  indication: string
  phase: 'Phase 1' | 'Phase 2' | 'Phase 3' | 'NDA' | 'Approved'
  mechanism: string
  primary_endpoint: string
  readout_date?: string
  pos_estimate: number
  npv_estimate?: number
  peak_sales_estimate?: number
}

export interface BiotechPipeline {
  company_ticker: string
  assets: ClinicalTrial[]
  total_npv?: number
  cash_position?: number
  cash_runway_months?: number
}

// ── Financial model ─────────────────────────────────────────
export interface RevenueSegment {
  name: string
  revenue: number
  growth_yoy: number
  margin: number
  pct_of_total: number
}

export interface FinancialModel {
  ticker: string
  fiscal_year: number
  revenue_segments: RevenueSegment[]
  total_revenue: number
  total_revenue_growth: number
  gross_profit: number
  gross_margin: number
  ebitda: number
  ebitda_margin: number
  net_income: number
  net_margin: number
  free_cash_flow: number
  capex: number
  dcf_intrinsic_value?: number
  ev_ebitda_multiple?: number
  price_target?: number
}

// ── Chart data ───────────────────────────────────────────────
export interface TimeSeriesPoint {
  date: string
  value: number
  label?: string
}

export interface OHLCPoint {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// ── UI state ─────────────────────────────────────────────────
export interface ResearchPanelState {
  ticker: string
  isExpanded: boolean
  activeSection: string
}

export type Theme = 'dark'

export interface NavigationItem {
  label: string
  href: string
  icon?: string
  badge?: string | number
  children?: NavigationItem[]
}
