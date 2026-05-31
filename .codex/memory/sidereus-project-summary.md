# Sidereus Project Summary

> Codex memory file. See `AGENTS.md` at repo root for the full canonical reference.

## Identity

Sidereus is an AI-native institutional equity research system. The core product idea is: enter a ticker, and Sidereus generates a deep research report aimed at hedge-fund / sell-side quality analysis, especially for AI infrastructure, semiconductors, data centers, biotech, and frontier technology.

- **Repository:** https://github.com/georgexu1118-ctrl/Sidereus
- **Live app:** https://sidereus-nuncius.vercel.app/
- **Named after:** Galileo's 1610 treatise *Sidereus Nuncius*

## Two Product Modes — Critical Distinction

| Mode | Entry point | Price targets | Framing |
|------|-------------|---------------|---------|
| **Frontend (live)** | `frontend/app/api/research/generate/route.ts` | No | Academic research paper |
| **Python CLI (full)** | `main.py` → `orchestrator.py` | Yes (bull/base/bear) | Institutional hedge-fund quality |

Do not merge these modes unless explicitly asked.

## Current Live App

- Minimal landing page with Sidereus branding and a Launch button
- `/dashboard` — ticker input / report generator
- Manual or automatic domain selection
- Quick-pick tickers: `AXTI`, `AAOI`, `ABVX`, `LITE`, `SNDK`, `RKLB`
- Output: academic-style equity research paper — no valuation, no price targets

**Frontend report sections:**
1. Key Market Data
2. Company Overview
3. Technology Breakdown
4. Supply Chain Analysis
5. Investment Analysis

**Other frontend workspaces:**
- Interactive AI supply-chain workspace (first/second/third-order beneficiary traversal)
- Demo knowledge graph workspace
- Biotech workspace (pipeline phases, PoS, peak sales, risk-adjusted NPV, FDA pathways)

**Frontend capabilities:**
- Markdown rendering with tables, Mermaid diagrams, and KaTeX equations
- Client-side print/PDF export + `/api/research/pdf` endpoint
- `/api/market/quotes` — provider fallback: Finnhub → Twelve Data → Yahoo Finance
- Fast mode (~21s) with single-pass GPT-4o-mini

## Python CLI — 10-Agent Pipeline

Sequential pipeline in `orchestrator.py`:

1. Data Collection — market data, OHLC, fundamentals
2. SEC Filing Analysis — 10-K/10-Q via SEC Edgar (OpenAI GPT-4o-mini)
3. Earnings Call Intelligence — management tone, guidance
4. Industry Research — sector dynamics, TAM
5. Financial Modeling — projections, margins (uses Agent 1)
6. Valuation — bull/base/bear targets + probabilities (uses Agent 5)
7. Competitive Intelligence — peer benchmarking, moat
8. Risk Assessment — downside scenarios, stop-loss triggers
9. Skeptical Analyst — devil's advocate, thesis attacks
10. Portfolio Manager Synthesis — final rec, sizing, catalysts, monitoring

Generates institutional markdown + raw JSON. Includes domain enrichment for AI supply chain, data centers, and biotech. Report time: 5–30 min (full) or ~2 min (--fast Sonnet).

## Serenity Framework

All agents embed the Serenity Framework from `core/research_methodology.py`:
- **Citrini Research:** supply chain chokepoints, atoms-vs-bits rotation
- **Aleabitoreddit:** OSINT triangulation (website archaeology, patents, LinkedIn)
- **SemiconSam/Jukan:** Korean semiconductor depth, process economics

Core question: *"Where is the market wrong, and what is the trade?"*

## Tech Stack

- **Frontend:** Next.js 15, React 18, TypeScript, Tailwind, Framer Motion
- **UI/data:** Recharts, D3, Mermaid, React Markdown, KaTeX, Lucide icons
- **Backend:** Next.js route handlers + on-demand Python agent invocation
- **Python:** Anthropic Claude (Opus/Sonnet), OpenAI GPT-4o-mini, Pydantic v2, rich, yfinance, sec-edgar-downloader
- **Database:** Supabase (PostgreSQL + Auth)
- **Deployment:** Vercel (region: iad1)

## Supabase Schema

Tables: `user_profiles`, `companies`, `research_projects`, `research_reports`, `knowledge_graph_entities`, `knowledge_graph_relationships`

Extensions: `uuid-ossp`, `pg_trgm`

TypeScript types auto-generated to `frontend/lib/supabase/types.ts` — never edit by hand.

## Design Character

Dark, restrained institutional aesthetic — research terminal meets buy-side workstation. Celestial / Galileo-inspired branding (Sidereus Nuncius logo) but the product is financial-research focused.

## Security

- `ANTHROPIC_API_KEY` required at startup
- `OPENAI_API_KEY` recommended
- All secrets via environment variables only — never committed, never prefixed `NEXT_PUBLIC_`
- Run `python scripts/check_secrets.py` before every commit
- Full policy in `SECURITY.md`
