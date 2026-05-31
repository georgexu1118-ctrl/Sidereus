Run a Sidereus institutional research report for a given ticker using the Python CLI.

Usage: /research TICKER [--fast] [--domain DOMAIN] [--supply-chain]

Executes: python main.py $ARGUMENTS

## Examples

```
/research NVDA
/research AAPL --fast
/research TSM --domain semiconductor_infrastructure
/research MRNA --domain biotechnology --supply-chain
/research PLTR --name "Palantir" --domain ai_supply_chain
```

## Available Domains

```
ai_supply_chain
biotechnology
semiconductor_infrastructure
data_center_ecosystem
frontier_technology
```

## Time Estimates

- Full mode (Claude Opus): 5–30 minutes
- Fast mode (--fast, Claude Sonnet): ~2 minutes

## Output

Report saved to `output/` directory as markdown. Also prints to terminal via rich.
