# Sidereus — AI-Native Institutional Equity Research OS

An AI research organization (not a chatbot) that produces hedge-fund- and
sell-side-quality research on the **AI supply chain, semiconductors, the data
center ecosystem, biotechnology, and frontier technology**. Ten specialized
agents — data collection, SEC filings, earnings, industry, financial modeling,
valuation, competitive intelligence, risk, a skeptical analyst, and a portfolio
manager — reason independently and produce an evidence-backed report with a
price target.

> This repository is the **backend**. A frontend for online deployment will
> follow.

## Quick start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure secrets (local dev)
cp .env.example .env        # then edit .env and paste your real keys

# 3. Run a research report
python main.py NVDA
python main.py MRNA --domain Biotechnology
python main.py AVGO --supply-chain        # supply-chain beneficiary map only
```

## Configuration

All configuration is environment-driven and centralized in
[`core/config.py`](core/config.py). Copy `.env.example` → `.env` and fill in:

| Variable            | Required | Purpose                                                       |
| ------------------- | -------- | ------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | yes      | thesis generation, skeptical analysis, final report (Claude) |
| `OPENAI_API_KEY`    | rec.     | SEC/earnings/supply-chain extraction, graph (GPT-4o-mini)    |
| `APP_ENV`           | no       | `development` (default) or `production`                      |

Optional model overrides: `ANTHROPIC_PRIMARY_MODEL`, `ANTHROPIC_FAST_MODEL`,
`OPENAI_MODEL`, `OUTPUT_DIR`.

Keys are validated at startup, masked in logs, and never exposed to the
frontend. See **[SECURITY.md](SECURITY.md)** for the full model.

### Market data providers

`DataCollectionAgent` now supports multi-provider quote retrieval with fallback:

1. `finnhub`
2. `twelvedata`
3. `yahoo` (via `yfinance`)

Configure in `.env`:

```bash
MARKET_DATA_PROVIDER_ORDER=finnhub,twelvedata,yahoo
FINNHUB_API_KEY=...
TWELVEDATA_API_KEY=...
```

Notes:
- Yahoo can be delayed on some exchanges.
- For Japan, China, and Europe, use vendor plans with real-time exchange entitlements.
- The agent output includes a `live_quote` block with provider metadata and timestamp.

### Deploying on Vercel

Set the same variables under **Project → Settings → Environment Variables**.
Do **not** prefix any secret with `NEXT_PUBLIC_` — the startup guard will refuse
to run if a secret is found under a browser-exposed prefix.

## Verifying the secret setup

```bash
python -m pytest tests/          # unit tests for masking & validation
python scripts/check_secrets.py  # fails if a secret is tracked by git
```

## Project layout

```
core/            Central configuration service, secret masking, log filter, LLM factories
agents/          The 10 research agents (base_agent + specialists)
domains/         Domain logic: AI supply chain, semiconductors, data center, biotech
knowledge_graph/ Entity/graph model linking companies, products, suppliers, etc.
report/          Institutional report assembly
config.py        Non-sensitive constants (domains, report sections, models)
main.py          CLI entry point
```
