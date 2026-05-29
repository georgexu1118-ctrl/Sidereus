// Auto-generated from Supabase schema — regenerate with:
//   supabase gen types typescript --project-id <id> > lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: string
          firm_name: string | null
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }
      companies: {
        Row: {
          id: string
          ticker: string
          name: string
          domain: string
          sector: string | null
          exchange: string | null
          logo_url: string | null
          description: string | null
          market_cap: number | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
      }
      research_reports: {
        Row: {
          id: string
          company_id: string | null
          project_id: string | null
          user_id: string
          ticker: string
          company_name: string
          domain: string
          rating: string | null
          price_target: number | null
          current_price: number | null
          upside_pct: number | null
          bull_price_target: number | null
          base_price_target: number | null
          bear_price_target: number | null
          bull_probability: number | null
          base_probability: number | null
          bear_probability: number | null
          executive_summary: string | null
          investment_thesis: string | null
          industry_overview: string | null
          company_overview: string | null
          competitive_positioning: string | null
          management_analysis: string | null
          financial_analysis: string | null
          valuation: string | null
          bull_case: string | null
          base_case: string | null
          bear_case: string | null
          catalysts: string[] | null
          risks: string[] | null
          variant_perception: string | null
          key_monitoring_indicators: string[] | null
          investment_conclusion: string | null
          raw_agent_outputs: Json | null
          analyst_name: string | null
          version: number
          status: string
          generated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['research_reports']['Row'], 'id' | 'version' | 'status' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['research_reports']['Insert']>
      }
      agent_runs: {
        Row: {
          id: string
          report_id: string
          agent_type: string
          status: string
          started_at: string | null
          completed_at: string | null
          elapsed_seconds: number | null
          output: Json | null
          error: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['agent_runs']['Row'], 'id' | 'status' | 'created_at'>
        Update: Partial<Database['public']['Tables']['agent_runs']['Insert']>
      }
      watchlists: {
        Row: {
          id: string
          user_id: string
          ticker: string
          company_name: string
          domain: string | null
          notes: string | null
          alert_price_target: number | null
          added_at: string
        }
        Insert: Omit<Database['public']['Tables']['watchlists']['Row'], 'id' | 'added_at'>
        Update: Partial<Database['public']['Tables']['watchlists']['Insert']>
      }
      knowledge_nodes: {
        Row: {
          id: string
          entity_type: string
          name: string
          ticker: string | null
          metadata: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['knowledge_nodes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['knowledge_nodes']['Insert']>
      }
      knowledge_edges: {
        Row: {
          id: string
          source_id: string
          target_id: string
          relationship: string
          weight: number
          metadata: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['knowledge_edges']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['knowledge_edges']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
