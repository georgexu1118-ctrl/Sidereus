# Sidereus — CLAUDE.md

AI-native institutional equity research OS. 10-agent Python pipeline + Next.js 15 frontend on Vercel.

- **Repo:** https://github.com/georgexu1118-ctrl/Sidereus
- **Live:** https://sidereus-nuncius.vercel.app/
- **Full reference:** `AGENTS.md` — architecture, workflows, conventions, all constraints

---

## Commands

### Python backend

```bash
pip install -r requirements.txt
python main.py AAPL                          # Full research (Claude Opus, ~5–30 min)
python main.py AAPL --fast                   # Fast mode (Claude Sonnet, ~2 min)
python main.py AAPL --domain ai_supply_chain
python main.py AAPL --supply-chain           # Include supply chain graph
pytest tests/ -v                             # Full test suite
pytest tests/test_config.py -v              # Secret management tests (17 cases)
python scripts/check_secrets.py             # Pre-commit secret audit
```

### Frontend

```bash
npm run dev          # http://localhost:3000
npm run build        # Production build → frontend/.next
npm start            # Production server
```

### Regenerate Supabase TypeScript types after schema changes

```bash
cd frontend
npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > lib/supabase/types.ts
```

---

## Architecture Quick-Reference

### 10-Agent Pipeline (`orchestrator.py` — sequential)

```
DataCollection → SECFiling (OpenAI) → EarningsCall → IndustryResearch →
FinancialModeling → Valuation → CompetitiveIntelligence →
RiskAssessment → SkepticalAnalyst → PortfolioManager
```

All agents inherit `BaseAgent` (`agents/base_agent.py`), which embeds the **Serenity Framework** system prompt and Claude API integration.

### LLM Routing (`core/llm.py`)

| Model | Used for |
|-------|----------|
| Claude Opus (default) | All primary research — thesis, synthesis, analysis |
| Claude Sonnet (`--fast`) | Fast-mode CLI and frontend pipeline |
| GPT-4o-mini | SEC filing extraction, Mermaid diagram gen, table gen |

### Frontend API Routes

| Route | Purpose | Timeout |
|-------|---------|---------|
| `POST /api/research/generate` | 3-phase: Extraction → Visualization → Narrative | 300s |
| `POST /api/research/pdf` | Export report to PDF | — |
| `GET /api/market/quotes?tickers=…` | Finnhub → TwelveData → Yahoo Finance | — |

### Two Product Modes — Do Not Conflate

| Mode | Framing | Price targets |
|------|---------|--------------|
| **Frontend (live app)** | Academic research paper | No |
| **Python CLI** | Institutional hedge-fund quality | Yes (bull/base/bear) |

---

## Security Rules — Never Violate

- **Never** hardcode API keys or secrets in any file
- **Never** prefix secrets with `NEXT_PUBLIC_`, `VITE_`, `REACT_APP_`, or `PUBLIC_`
- **Never** commit `.env` files (enforced by `.gitignore`)
- Wrap all new secret values in `SecretStr` from `core/secrets.py`
- Run `python scripts/check_secrets.py` before every commit
- `validate_or_exit()` in `core/config.py` aborts startup on missing required keys

---

## Python Conventions

- Type hints on all function signatures
- Pydantic v2 for all data models
- **No `print()`** in agents, core, or domains — use `logging` via `core/log_config.py`
- All agents inherit `BaseAgent` and implement `run(self, context: dict) -> dict`
- Agent outputs must include confidence tiers: `[CONFIRMED]` `[HIGH]` `[MEDIUM]` `[INFERRED]` `[SPECULATIVE]`

## TypeScript / Next.js Conventions

- App Router only — no Pages Router
- No implicit `any`
- **Never hand-edit** `frontend/lib/supabase/types.ts` — always regenerate from schema
- API routes set `Cache-Control: no-cache` for research and market endpoints

---

## Testing

```bash
pytest tests/ -v
pytest tests/test_config.py -v    # 17 secret management test cases
```

All new `core/` utilities need corresponding tests. Do not mock the secret management system — tests rely on real env behavior.

---

## Key Files

| File | What it does |
|------|-------------|
| `orchestrator.py` | 10-agent pipeline — start here for pipeline changes |
| `agents/base_agent.py` | Base class + Serenity Framework prompt |
| `core/research_methodology.py` | Analytical DNA — read before editing agent prompts |
| `core/config.py` | Secret management, settings, startup validation |
| `frontend/app/api/research/generate/route.ts` | Frontend 3-phase research pipeline |
| `frontend/supabase/schema.sql` | Database schema — source of truth |
| `SECURITY.md` | Full secret management policy |
