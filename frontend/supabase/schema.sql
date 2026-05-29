-- ═══════════════════════════════════════════════════════════════
-- Sidereus — Supabase Database Schema
-- Run via: Supabase SQL Editor or supabase db push
-- ═══════════════════════════════════════════════════════════════

-- ── Extensions ────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- fuzzy search on ticker/name

-- ── Users (extends Supabase auth.users) ──────────────────────
create table if not exists public.user_profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  email           text unique not null,
  full_name       text,
  role            text not null default 'analyst',   -- analyst | pm | admin
  firm_name       text,
  preferences     jsonb not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
comment on table public.user_profiles is 'Extended profile for each authenticated user.';

-- ── Companies ──────────────────────────────────────────────────
create table if not exists public.companies (
  id              uuid primary key default uuid_generate_v4(),
  ticker          text not null unique,
  name            text not null,
  domain          text not null,   -- AI Supply Chain | Semiconductors | Data Center | Biotechnology | Frontier Technology
  sector          text,
  exchange        text,
  logo_url        text,
  description     text,
  market_cap      bigint,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists companies_ticker_idx on public.companies (ticker);
create index if not exists companies_domain_idx on public.companies (domain);
create index if not exists companies_name_trgm on public.companies using gin (name gin_trgm_ops);

-- ── Research Projects ──────────────────────────────────────────
create table if not exists public.research_projects (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.user_profiles(id) on delete cascade,
  name            text not null,
  description     text,
  domain          text not null,
  tickers         text[] not null default '{}',
  status          text not null default 'active',    -- active | completed | archived
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists research_projects_user_idx on public.research_projects (user_id);

-- ── Research Reports ───────────────────────────────────────────
create table if not exists public.research_reports (
  id                      uuid primary key default uuid_generate_v4(),
  company_id              uuid references public.companies(id) on delete set null,
  project_id              uuid references public.research_projects(id) on delete set null,
  user_id                 uuid not null references public.user_profiles(id) on delete cascade,

  -- Company snapshot
  ticker                  text not null,
  company_name            text not null,
  domain                  text not null,

  -- Research output
  rating                  text,           -- BUY | HOLD | SELL | OUTPERFORM | UNDERPERFORM
  price_target            numeric(12, 2),
  current_price           numeric(12, 2),
  upside_pct              numeric(6, 2),

  bull_price_target       numeric(12, 2),
  base_price_target       numeric(12, 2),
  bear_price_target       numeric(12, 2),
  bull_probability        numeric(4, 3),
  base_probability        numeric(4, 3),
  bear_probability        numeric(4, 3),

  -- Report sections (markdown)
  executive_summary       text,
  investment_thesis       text,
  industry_overview       text,
  company_overview        text,
  competitive_positioning text,
  management_analysis     text,
  financial_analysis      text,
  valuation               text,
  bull_case               text,
  base_case               text,
  bear_case               text,
  catalysts               text[],
  risks                   text[],
  variant_perception      text,
  key_monitoring_indicators text[],
  investment_conclusion   text,

  -- Raw agent outputs stored as JSON
  raw_agent_outputs       jsonb,

  -- Metadata
  analyst_name            text,
  version                 integer not null default 1,
  status                  text not null default 'draft',  -- draft | published | archived
  generated_at            timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists reports_ticker_idx     on public.research_reports (ticker);
create index if not exists reports_user_idx       on public.research_reports (user_id);
create index if not exists reports_status_idx     on public.research_reports (status);
create index if not exists reports_domain_idx     on public.research_reports (domain);
create index if not exists reports_created_idx    on public.research_reports (created_at desc);

-- ── Report Versions (immutable snapshot history) ──────────────
create table if not exists public.report_versions (
  id          uuid primary key default uuid_generate_v4(),
  report_id   uuid not null references public.research_reports(id) on delete cascade,
  version     integer not null,
  snapshot    jsonb not null,   -- full report JSON at this version
  created_at  timestamptz not null default now(),
  unique (report_id, version)
);

-- ── Agent Runs ─────────────────────────────────────────────────
create table if not exists public.agent_runs (
  id              uuid primary key default uuid_generate_v4(),
  report_id       uuid not null references public.research_reports(id) on delete cascade,
  agent_type      text not null,  -- data_collection | sec_filing | ... | portfolio_manager
  status          text not null default 'pending',  -- pending | running | completed | failed
  started_at      timestamptz,
  completed_at    timestamptz,
  elapsed_seconds numeric(8, 2),
  output          jsonb,
  error           text,
  created_at      timestamptz not null default now()
);

create index if not exists agent_runs_report_idx on public.agent_runs (report_id);
create index if not exists agent_runs_status_idx on public.agent_runs (status);

-- ── Agent Logs ─────────────────────────────────────────────────
create table if not exists public.agent_logs (
  id          bigint generated always as identity primary key,
  run_id      uuid not null references public.agent_runs(id) on delete cascade,
  level       text not null default 'info',  -- info | warning | error
  message     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists agent_logs_run_idx on public.agent_logs (run_id);

-- ── Knowledge Graph — Nodes ────────────────────────────────────
create table if not exists public.knowledge_nodes (
  id          uuid primary key default uuid_generate_v4(),
  entity_type text not null,  -- Company | Product | Technology | Executive | Patent | Disease | Drug | ClinicalAsset | Market
  name        text not null,
  ticker      text,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists kg_nodes_type_idx    on public.knowledge_nodes (entity_type);
create index if not exists kg_nodes_ticker_idx  on public.knowledge_nodes (ticker) where ticker is not null;
create index if not exists kg_nodes_name_trgm   on public.knowledge_nodes using gin (name gin_trgm_ops);

-- ── Knowledge Graph — Edges ────────────────────────────────────
create table if not exists public.knowledge_edges (
  id              uuid primary key default uuid_generate_v4(),
  source_id       uuid not null references public.knowledge_nodes(id) on delete cascade,
  target_id       uuid not null references public.knowledge_nodes(id) on delete cascade,
  relationship    text not null,  -- supplies | competes_with | manufactures | leads | owns | treats | etc.
  weight          numeric(4, 3) not null default 1.0,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index if not exists kg_edges_source_idx on public.knowledge_edges (source_id);
create index if not exists kg_edges_target_idx on public.knowledge_edges (target_id);
create index if not exists kg_edges_rel_idx    on public.knowledge_edges (relationship);

-- ── Watchlists ─────────────────────────────────────────────────
create table if not exists public.watchlists (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.user_profiles(id) on delete cascade,
  ticker              text not null,
  company_name        text not null,
  domain              text,
  notes               text,
  alert_price_target  numeric(12, 2),
  added_at            timestamptz not null default now(),
  unique (user_id, ticker)
);

create index if not exists watchlists_user_idx on public.watchlists (user_id);

-- ── Research Notes ─────────────────────────────────────────────
create table if not exists public.research_notes (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.user_profiles(id) on delete cascade,
  report_id   uuid references public.research_reports(id) on delete set null,
  ticker      text,
  content     text not null,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists notes_user_idx   on public.research_notes (user_id);
create index if not exists notes_ticker_idx on public.research_notes (ticker) where ticker is not null;

-- ── Uploaded Documents ─────────────────────────────────────────
create table if not exists public.uploaded_documents (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.user_profiles(id) on delete cascade,
  report_id       uuid references public.research_reports(id) on delete set null,
  ticker          text,
  filename        text not null,
  storage_path    text not null,
  file_size       bigint,
  content_type    text,
  doc_type        text,   -- 10-K | 10-Q | transcript | press-release | other
  extracted_text  text,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

-- ── Citations ──────────────────────────────────────────────────
create table if not exists public.citations (
  id          uuid primary key default uuid_generate_v4(),
  report_id   uuid not null references public.research_reports(id) on delete cascade,
  section     text not null,
  text        text not null,
  source      text not null,
  url         text,
  accessed_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists citations_report_idx on public.citations (report_id);

-- ═══════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════

alter table public.user_profiles       enable row level security;
alter table public.research_projects   enable row level security;
alter table public.research_reports    enable row level security;
alter table public.report_versions     enable row level security;
alter table public.agent_runs          enable row level security;
alter table public.agent_logs          enable row level security;
alter table public.watchlists          enable row level security;
alter table public.research_notes      enable row level security;
alter table public.uploaded_documents  enable row level security;
alter table public.citations           enable row level security;

-- Users: own their data
create policy "Users own their profile"     on public.user_profiles     for all using (auth.uid() = id);
create policy "Users own their projects"    on public.research_projects  for all using (auth.uid() = user_id);
create policy "Users own their reports"     on public.research_reports   for all using (auth.uid() = user_id);
create policy "Users own their watchlists"  on public.watchlists         for all using (auth.uid() = user_id);
create policy "Users own their notes"       on public.research_notes     for all using (auth.uid() = user_id);
create policy "Users own their documents"   on public.uploaded_documents for all using (auth.uid() = user_id);

-- Companies and knowledge graph: read-only for authenticated users
alter table public.companies          enable row level security;
alter table public.knowledge_nodes    enable row level security;
alter table public.knowledge_edges    enable row level security;

create policy "Companies: read by authenticated" on public.companies       for select using (auth.role() = 'authenticated');
create policy "KG nodes: read by authenticated"  on public.knowledge_nodes for select using (auth.role() = 'authenticated');
create policy "KG edges: read by authenticated"  on public.knowledge_edges for select using (auth.role() = 'authenticated');

-- Agent runs/logs accessible by the report owner
create policy "Agent runs by report owner" on public.agent_runs
  for all using (
    exists (
      select 1 from public.research_reports r
      where r.id = report_id and r.user_id = auth.uid()
    )
  );

create policy "Agent logs by run owner" on public.agent_logs
  for all using (
    exists (
      select 1 from public.agent_runs ar
      join public.research_reports r on r.id = ar.report_id
      where ar.id = run_id and r.user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════
-- Realtime
-- ═══════════════════════════════════════════════════════════════
begin;
  -- Enable realtime for agent progress tracking
  alter publication supabase_realtime add table public.agent_runs;
  alter publication supabase_realtime add table public.agent_logs;
  alter publication supabase_realtime add table public.research_reports;
commit;

-- ═══════════════════════════════════════════════════════════════
-- Seed: core companies
-- ═══════════════════════════════════════════════════════════════
insert into public.companies (ticker, name, domain, sector, exchange) values
  ('NVDA',  'NVIDIA Corporation',        'AI Supply Chain',     'Semiconductors', 'NASDAQ'),
  ('ASML',  'ASML Holding NV',           'Semiconductors',      'Equipment',      'NASDAQ'),
  ('TSM',   'Taiwan Semiconductor Mfg.', 'Semiconductors',      'Foundry',        'NYSE'),
  ('AMAT',  'Applied Materials',         'Semiconductors',      'Equipment',      'NASDAQ'),
  ('LRCX',  'Lam Research',              'Semiconductors',      'Equipment',      'NASDAQ'),
  ('MU',    'Micron Technology',         'AI Supply Chain',     'Memory',         'NASDAQ'),
  ('AVGO',  'Broadcom Inc.',             'AI Supply Chain',     'Networking',     'NASDAQ'),
  ('MRVL',  'Marvell Technology',        'AI Supply Chain',     'Networking',     'NASDAQ'),
  ('VRT',   'Vertiv Holdings',           'Data Center',         'Infrastructure', 'NYSE'),
  ('SMCI',  'Super Micro Computer',      'Data Center',         'Systems',        'NASDAQ'),
  ('EQIX',  'Equinix',                   'Data Center',         'Colocation',     'NASDAQ'),
  ('ANET',  'Arista Networks',           'Data Center',         'Networking',     'NYSE'),
  ('MRNA',  'Moderna Inc.',              'Biotechnology',       'mRNA Therapy',   'NASDAQ'),
  ('REGN',  'Regeneron Pharmaceuticals', 'Biotechnology',       'Biologics',      'NASDAQ'),
  ('VRTX',  'Vertex Pharmaceuticals',    'Biotechnology',       'Small Molecule', 'NASDAQ'),
  ('ALNY',  'Alnylam Pharmaceuticals',   'Biotechnology',       'RNAi Therapy',   'NASDAQ')
on conflict (ticker) do nothing;
