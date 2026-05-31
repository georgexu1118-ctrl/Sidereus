# AGENTS.md — Sidereus

> Canonical reference for AI coding agents (Claude Code, Codex, and others) working on this repository.
> Read this before touching any code. If anything here conflicts with what you see in the codebase, the codebase wins — update this document accordingly.

---

## 1. Project Overview

**Sidereus** is an AI-native institutional equity research operating system.
It produces hedge-fund / sell-side quality investment research reports by orchestrating 10 specialized AI agents across market data, SEC filings, earnings calls, financial modeling, valuation, competitive intelligence, risk assessment, and portfolio synthesis.

- **Repository:** https://github.com/georgexu1118-ctrl/Sidereus
- **Production app:** https://sidereus-nuncius.vercel.app/
- **Named after:** Galileo's 1610 astronomical treatise *Sidereus Nuncius* ("Starry Messenger")

### Two Product Modes — Critical Distinction

| Mode | Entry point | Framing | Output |
|------|-------------|---------|--------|
| **Frontend (live)** | `frontend/app/api/research/generate/route.ts` | Academic — no valuation, no price targets | 5-section markdown |
| **Python CLI (full)** | `main.py` → `orchestrator.py` | Institutional — includes valuation + price targets | 17-section markdown + JSON |

Do not merge these modes unless explicitly instructed.

---

## 2. Repository Layout

```
Sidereus/                              # Monorepo root
├── agents/                            # 10 Python research agents
│   ├── base_agent.py                  # Abstract base — Serenity Framework embedded
│   ├── data_collection.py             # Agent 1  — market data, OHLC, fundamentals
│   ├── sec_filing.py                  # Agent 2  — 10-K/10-Q via SEC Edgar (OpenAI)
│   ├── earnings_call.py               # Agent 3  — management commentary
│   ├── industry_research.py           # Agent 4  — sector context
│   ├── financial_modeling.py          # Agent 5  — projections (uses Agent 1 output)
│   ├── valuation.py                   # Agent 6  — fair value (uses Agent 5 output)
│   ├── competitive_intelligence.py    # Agent 7  — peer benchmarking
│   ├── risk_assessment.py             # Agent 8  — downside scenarios
│   ├── skeptical_analyst.py           # Agent 9  — devil's advocate
│   └── portfolio_manager.py           # Agent 10 — synthesis + recommendation
├── core/
│   ├── config.py                      # Settings, SecretStr, ValidationResult, startup validation
│   ├── llm.py                         # get_anthropic_client(), get_openai_client()
│   ├── research_methodology.py        # Serenity Framework — analytical DNA for all agents
│   ├── secrets.py                     # mask_secret(), SecretStr, SecretMaskingFilter
│   └── log_config.py                  # configure_logging() — automatic secret masking
├── domains/
│   ├── ai_supply_chain.py             # Supply chain entity graph, beneficiary traversal
│   ├── semiconductors.py              # Process node economics, capacity constraints
│   ├── biotech.py                     # FDA pathways, PoS by phase, NPV models
│   └── data_center.py                 # Hyperscaler capex, power density metrics
├── knowledge_graph/
│   ├── entities.py                    # Entity, EntityType models
│   └── graph.py                       # KnowledgeGraph class
├── report/
│   └── generator.py                   # ReportGenerator — assembles markdown from agent outputs
├── scripts/
│   └── check_secrets.py               # Audit for API keys in version control
├── tests/
│   └── test_config.py                 # 17 secret management test cases
├── frontend/                          # Next.js 15 app — deployed on Vercel
│   ├── app/
│   │   ├── (marketing)/               # Public landing page
│   │   ├── (app)/                     # Auth-protected dashboard
│   │   │   ├── dashboard/             # Ticker input + report display
│   │   │   ├── research/[ticker]/     # Dynamic per-company research page
│   │   │   ├── biotech/               # Biotech workspace
│   │   │   ├── supply-chain/          # AI supply chain visualizer
│   │   │   └── knowledge-graph/       # Knowledge graph explorer
│   │   └── api/
│   │       ├── research/generate/route.ts   # POST — generate report (300s timeout)
│   │       ├── research/pdf/route.ts        # POST — export to PDF
│   │       └── market/quotes/route.ts       # GET  — multi-provider market quotes
│   ├── components/
│   │   ├── dashboard/                 # DashboardClient
│   │   ├── research/                  # ReportRenderer, CompanyResearchPage, MermaidDiagram
│   │   ├── landing/                   # Hero, AgentSection, FloatingPanels, SectorCards
│   │   ├── layout/                    # Providers, Navigation
│   │   ├── glass/                     # GlassCard, MetricCard
│   │   ├── atmosphere/                # AtmosphereBackground, AtmosphereWrapper
│   │   ├── biotech/                   # BiotechPage
│   │   ├── knowledge-graph/           # KnowledgeGraphPage
│   │   └── supply-chain/              # SupplyChainPage
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── browser.ts             # Browser Supabase client
│   │   │   ├── server.ts              # Server Supabase client (SSR)
│   │   │   └── types.ts               # Auto-generated DB types — never edit by hand
│   │   ├── constants.ts
│   │   └── utils.ts
│   ├── supabase/schema.sql            # PostgreSQL schema — source of truth
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── vercel.json
├── config.py                          # App-level constants (models, domains, report sections)
├── main.py                            # Python CLI entry point
├── orchestrator.py                    # ResearchOrchestrator — 10-agent pipeline coordinator
├── requirements.txt                   # Python dependencies
├── package.json                       # Root monorepo scripts (proxies to frontend/ via --prefix)
├── vercel.json                        # Root Vercel config
├── .env.example                       # Environment variable template
├── .gitignore
├── AGENTS.md                          # This file
├── CLAUDE.md                          # Claude Code operational guide
└── SECURITY.md                        # Secret management policy
```

---

## 3. Tech Stack

### Python Backend

| Component | Library / Version |
|-----------|-------------------|
| Runtime | Python 3.x |
| Primary LLM | Anthropic Claude Opus (`ANTHROPIC_PRIMARY_MODEL`) |
| Fast LLM | Anthropic Claude Sonnet (`ANTHROPIC_FAST_MODEL`) |
| Extraction LLM | OpenAI GPT-4o-mini (`OPENAI_MODEL`) |
| HTTP | httpx ≥0.27.0 |
| Data models | Pydantic v2 ≥2.7.0 |
| Financial data | yfinance ≥0.2.40 |
| SEC filings | sec-edgar-downloader ≥5.0.4 |
| Web scraping | BeautifulSoup4, lxml, requests |
| Data processing | pandas, numpy, networkx |
| CLI output | rich ≥13.7.0 |
| Templating | jinja2 ≥3.1.4 |
| Env management | python-dotenv |
| Visualization | matplotlib ≥3.9.0 |

### Frontend

| Component | Library / Version |
|-----------|-------------------|
| Framework | Next.js 15.3.0 (App Router) |
| Language | TypeScript 5.7.2 |
| Runtime | React 18.3.1 |
| Styling | Tailwind CSS 3.4.17 |
| Animation | Framer Motion |
| Charts | Recharts 2.14.1, D3 7.9.0 |
| Diagrams | Mermaid 11.15.0 |
| Markdown | react-markdown, remark-gfm, remark-math, rehype-katex |
| UI primitives | Radix UI (dialog, dropdown, tabs, tooltip, scroll-area) |
| State | Zustand 5.0.2 |
| Data fetching | TanStack React Query 5.62.0 |
| Database | @supabase/supabase-js + @supabase/ssr |
| Fonts | Geist (sans + mono) |
| Icons | Lucide React |
| Notifications | Sonner |
| Utilities | date-fns, numeral, clsx, class-variance-authority, tailwind-merge |

### Infrastructure

| Component | Service |
|-----------|---------|
| Frontend hosting | Vercel (region: iad1, US East) |
| Database | Supabase (PostgreSQL + Auth) |
| CI/CD | Vercel auto-deploy from GitHub `main` |

---

## 4. Architecture

### 4.1 Python CLI — 10-Agent Pipeline

`ResearchOrchestrator` in `orchestrator.py` runs agents sequentially, feeding outputs downstream as context.

| # | Agent class | LLM | Key inputs | Key outputs |
|---|-------------|-----|------------|-------------|
| 1 | `DataCollectionAgent` | APIs (no LLM) | ticker | OHLC, fundamentals, price history |
| 2 | `SECFilingAgent` | GPT-4o-mini | ticker | 10-K/10-Q facts, risk factors, MD&A |
| 3 | `EarningsCallAgent` | Claude | agents 1–2 | Management tone, guidance, KPIs |
| 4 | `IndustryResearchAgent` | Claude | agents 1–3 | Sector dynamics, TAM, trends |
| 5 | `FinancialModelingAgent` | Claude | agent 1 | Revenue projections, margins, FCF |
| 6 | `ValuationAgent` | Claude | agent 5 | Bull/base/bear price targets + probabilities |
| 7 | `CompetitiveIntelligenceAgent` | Claude | agents 1–6 | Peer benchmarking, moat analysis |
| 8 | `RiskAssessmentAgent` | Claude | agents 1–7 | Downside scenarios, stop-loss triggers |
| 9 | `SkepticalAnalystAgent` | Claude | full chain | Devil's advocate, thesis attacks |
| 10 | `PortfolioManagerAgent` | Claude | all 9 outputs | Final rec, position sizing, catalysts, monitoring |

**`BaseAgent`** (agents/base_agent.py) provides:
- Anthropic API integration with primary/fast model selection
- Serenity Framework system prompt injection
- Evidence accumulation with confidence-tiered structured output
- Interface contract: `run(self, context: dict) -> dict`

### 4.2 Serenity Framework (core/research_methodology.py)

Three analyst archetypes merged into every agent's system prompt:

| Archetype | Specialty | Key technique |
|-----------|-----------|---------------|
| Citrini Research | Cross-asset thematic asymmetry | Supply chain chokepoints, atoms-vs-bits rotation, mechanical repricing |
| Aleabitoreddit | OSINT supply chain detective | Website archaeology, patent triangulation, LinkedIn hiring signals |
| SemiconSam / Jukan | Korean semiconductor depth | Process node economics, 18-month qualification timelines |

**Core framing question agents must answer:** *"Where is the market wrong, and what is the trade?"*

**Required confidence tiers in all agent outputs:**
`[CONFIRMED]` `[HIGH]` `[MEDIUM]` `[INFERRED]` `[SPECULATIVE]`

### 4.3 Frontend Research Pipeline

**Route:** `frontend/app/api/research/generate/route.ts` — POST, 300-second hard timeout.

Three phases:

| Phase | Model | Role |
|-------|-------|------|
| 1. Extraction | Claude Sonnet | SEC/10-K/10-Q parsing, supply chain facts, competitive signals |
| 2. Visualization | GPT-4o-mini | Mermaid diagrams, KaTeX equations, markdown tables |
| 3. Narrative | Claude Sonnet | Synthesizes structured 5-section report |

**Output sections:** Key Market Data · Company Overview · Technology Breakdown · Supply Chain Analysis · Investment Analysis

**Fast mode** (`fast: true` in request body): Single-pass GPT-4o-mini (~21s). Graceful degradation to demo mode on timeout.

### 4.4 Market Quotes (app/api/market/quotes/route.ts)

GET `/api/market/quotes?tickers=AAPL,GOOGL` (up to 20 symbols)

Provider fallback chain: **Finnhub → TwelveData → Yahoo Finance**

Returns per ticker: `{ ticker, price, changePercent, marketCap, provider, asOf }`

Data validation: prices must be finite and > 0. Timestamps converted from Unix to ISO 8601.

### 4.5 LLM Routing (core/llm.py)

| Client | Default model | Used for |
|--------|--------------|----------|
| `get_anthropic_client()` | `ANTHROPIC_PRIMARY_MODEL` (Opus) | All research agents except SEC filing |
| `get_anthropic_client()` | `ANTHROPIC_FAST_MODEL` (Sonnet) | `--fast` flag mode |
| `get_openai_client()` | `OPENAI_MODEL` (GPT-4o-mini) | SEC filing extraction, Mermaid gen, table gen |

### 4.6 Database Schema (frontend/supabase/schema.sql)

| Table | Purpose |
|-------|---------|
| `user_profiles` | Auth extension — role (analyst / pm / admin), firm name |
| `companies` | Ticker, domain, sector, exchange, market cap, logo |
| `research_projects` | User's research bundles (array of tickers, status) |
| `research_reports` | Full report snapshots — markdown sections + raw agent JSONB |
| `knowledge_graph_entities` | Supply chain entities extracted from reports |
| `knowledge_graph_relationships` | Directional edges (customer / supplier / competitor / partner) |

Required PostgreSQL extensions: `uuid-ossp`, `pg_trgm` (fuzzy search on company names).

TypeScript types live in `frontend/lib/supabase/types.ts` — **auto-generated, never edit by hand**.

### 4.7 Secret Management (core/secrets.py + core/config.py)

- `SecretStr` — wrapper that masks values in `repr`/`str`/logs; use `.reveal()` only at SDK call boundary
- `mask_secret()` — shows first 3 + last 4 chars, masks middle
- `SecretMaskingFilter` — `logging.Filter` that scrubs all registered secret values from log records
- `validate_or_exit()` — startup validation; missing `ANTHROPIC_API_KEY` aborts with error

Environment variable precedence: **real env > `.env.local` > `.env`**

Frontend exposure guard: any secret prefixed `NEXT_PUBLIC_`, `VITE_`, `REACT_APP_`, `PUBLIC_`, or `EXPO_PUBLIC_` raises a `ValidationError`.

---

## 5. Development Workflow

### 5.1 Environment Setup

```bash
# Python backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Copy and fill environment variables
cp .env.example .env
# Set ANTHROPIC_API_KEY (required) and OPENAI_API_KEY (recommended)

# Frontend
npm install                        # proxies to frontend/ via --prefix
```

### 5.2 Running Locally

```bash
# Python CLI — full institutional research pipeline
python main.py AAPL
python main.py AAPL --fast                          # Sonnet instead of Opus (~2 min)
python main.py AAPL --domain ai_supply_chain        # Domain-specific enrichment
python main.py AAPL --supply-chain                  # Include supply chain graph
python main.py NVDA --name "NVIDIA" --domain semiconductor_infrastructure

# Frontend dev server
npm run dev                                          # http://localhost:3000

# Test suite
pytest tests/ -v
pytest tests/test_config.py -v                      # Secret management (17 cases)

# Pre-commit audit
python scripts/check_secrets.py
```

### 5.3 Environment Variables Reference

```ini
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Recommended
OPENAI_API_KEY=sk-proj-...

# Optional — model overrides
ANTHROPIC_PRIMARY_MODEL=claude-opus-4-8             # default (deep research)
ANTHROPIC_FAST_MODEL=claude-sonnet-4-6              # --fast flag
OPENAI_MODEL=gpt-4o-mini                            # extraction tasks

# Optional — market data (falls back to Yahoo Finance if absent)
FINNHUB_API_KEY=...
TWELVEDATA_API_KEY=...

# Auto-set by Vercel
VERCEL_ENV=production
```

### 5.4 Adding a New Research Agent

1. Create `agents/new_agent.py` inheriting `BaseAgent`
2. Implement `run(self, context: dict) -> dict` with confidence-tiered output
3. Export from `agents/__init__.py`
4. Wire into `orchestrator.py` at the correct sequence position
5. Add output section to `report/generator.py`
6. Write corresponding tests in `tests/`

### 5.5 Schema Changes

1. Edit `frontend/supabase/schema.sql` (source of truth)
2. Apply via Supabase dashboard or `supabase db push`
3. Regenerate TypeScript types:
   ```bash
   cd frontend
   npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > lib/supabase/types.ts
   ```
4. Never edit `lib/supabase/types.ts` directly

---

## 6. Deployment Workflow

### 6.1 Frontend (Vercel)

| Setting | Value |
|---------|-------|
| Trigger | Push to `main` → automatic deploy |
| Build command | `npm run build` (`npm install --prefix frontend && npm run build --prefix frontend`) |
| Output directory | `frontend/.next` |
| Region | `iad1` (US East, Northern Virginia) |

Security headers enforced globally:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Cache-Control: no-cache, no-store   (applied to all /api/* routes)
```

### 6.2 Python Backend

Python agents run on-demand — invoked by the Next.js API route. There is no standalone Python server deployment. For full CLI use, run locally with all environment variables set.

### 6.3 Database (Supabase)

- `frontend/supabase/schema.sql` is the canonical schema
- Migrations applied via Supabase dashboard or `supabase db push`
- Connections managed by `frontend/lib/supabase/server.ts` (SSR) and `browser.ts` (client)

---

## 7. Repository Conventions

### Python

- Type hints on **all** function signatures
- Pydantic v2 for all data models
- **No `print()`** in agents, core, or domains — use `logging` via `core/log_config.py`
- All agents inherit `BaseAgent` and implement `run(self, context: dict) -> dict`
- All agent outputs include confidence tiers: `[CONFIRMED]` `[HIGH]` `[MEDIUM]` `[INFERRED]` `[SPECULATIVE]`
- Black-compatible style, 4-space indent

### TypeScript / Next.js

- App Router only — no Pages Router patterns
- No implicit `any` — explicit types everywhere
- Supabase types from `lib/supabase/types.ts` — regenerate, never hand-edit
- API routes set `Cache-Control: no-cache` for research and market endpoints
- 4-space indent, single quotes, no semicolons (match existing file style)

### Git

- Commit messages: imperative mood, present tense (`Add risk agent`, not `Added`)
- Never commit `.env` or any file containing real API keys
- Run `python scripts/check_secrets.py` before every commit
- Feature branches: `feature/short-description`; fixes: `fix/short-description`

---

## 8. Important Constraints

### Security — Non-Negotiable

| Rule | Detail |
|------|--------|
| No hardcoded secrets | API keys must live in environment variables only |
| No frontend-exposed secrets | Never prefix secrets with `NEXT_PUBLIC_`, `VITE_`, `REACT_APP_`, or `PUBLIC_` |
| No committed `.env` files | `.gitignore` enforces; `check_secrets.py` audits |
| Wrap new secrets in `SecretStr` | From `core/secrets.py` — automatic masking in logs and repr |
| Startup validation | `validate_or_exit()` aborts on missing required keys |

### Architecture Constraints

- Do not edit `lib/supabase/types.ts` by hand — regenerate from schema
- Do not change which LLM handles which task without updating `core/llm.py` and this document
- Respect the 300-second API route timeout — frontend agent work must complete within budget
- Keep the two product modes distinct — frontend (no valuation) and CLI (full institutional) serve different audiences

### Data Source Compliance

| Source | Constraint |
|--------|------------|
| SEC Edgar | Must include `User-Agent` header per SEC fair-access policy |
| Yahoo Finance | Free; no key required; rate-limit aware |
| Finnhub / TwelveData | Require respective API keys; graceful degradation if absent |

---

## 9. Quick Reference

### Available Domains

```
ai_supply_chain
biotechnology
semiconductor_infrastructure
data_center_ecosystem
frontier_technology
```

### CLI Report Sections

```
executive_summary · investment_thesis · industry_overview · company_overview
competitive_positioning · management_analysis · financial_analysis · valuation
bull_case · base_case · bear_case · catalysts · risks · variant_perception
key_monitoring_indicators · investment_conclusion · appendix
```

### Frontend Quick-Pick Tickers

`AXTI` · `AAOI` · `ABVX` · `LITE` · `SNDK` · `RKLB`

### Key Files at a Glance

| File | Why it matters |
|------|----------------|
| `orchestrator.py` | Entire 10-agent sequence — start here for pipeline changes |
| `agents/base_agent.py` | All agents inherit this; Serenity Framework prompt lives here |
| `core/research_methodology.py` | Analytical DNA — read before changing any agent prompt |
| `core/config.py` | Secret management + startup validation logic |
| `core/llm.py` | LLM client factories and model routing |
| `frontend/app/api/research/generate/route.ts` | Frontend 3-phase pipeline (300s) |
| `frontend/supabase/schema.sql` | Database schema — source of truth |
| `SECURITY.md` | Full secret management policy |
| `.env.example` | All supported environment variables with descriptions |
