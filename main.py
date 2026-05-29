"""
Equity Research OS — Entry Point
Usage:
    python main.py NVDA
    python main.py NVDA --name "NVIDIA Corporation" --domain "AI Supply Chain"
    python main.py MRNA --domain Biotechnology --fast
    python main.py ANET --domain "Data Center Ecosystem"

Environment:
    ANTHROPIC_API_KEY must be set in .env or environment.
"""

from __future__ import annotations
import sys
import os
import argparse

# Ensure we can import from project root
sys.path.insert(0, os.path.dirname(__file__))

from rich.console import Console
from core import configure_logging, validate_or_exit

console = Console()


def get_company_name(ticker: str) -> str:
    """Try to get company name from yfinance, fall back to ticker."""
    try:
        import yfinance as yf
        info = yf.Ticker(ticker).info
        return info.get("longName") or info.get("shortName") or ticker
    except Exception:
        return ticker


def main():
    parser = argparse.ArgumentParser(
        description="AI-Native Institutional Equity Research OS",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py NVDA
  python main.py NVDA --name "NVIDIA Corporation" --domain "AI Supply Chain"
  python main.py MRNA --domain Biotechnology
  python main.py ANET --domain "Data Center Ecosystem" --fast
  python main.py AVGO --supply-chain    # Show supply chain analysis only

Supported domains:
  - AI Supply Chain
  - Semiconductor Infrastructure
  - Data Center Ecosystem
  - Biotechnology
  - Frontier Technology
        """,
    )
    parser.add_argument("ticker", help="Stock ticker symbol (e.g. NVDA, MRNA, ANET)")
    parser.add_argument("--name", "-n", help="Company full name (auto-detected if omitted)")
    parser.add_argument(
        "--domain", "-d",
        help="Research domain (auto-detected if omitted)",
    )
    parser.add_argument(
        "--fast", "-f", action="store_true",
        help="Use faster model (Sonnet) for all agents instead of Opus",
    )
    parser.add_argument(
        "--supply-chain", action="store_true",
        help="Print AI supply chain beneficiary map for this ticker and exit",
    )
    args = parser.parse_args()

    # Validate configuration (masked) before any agent runs.
    configure_logging()
    settings = validate_or_exit(console)
    console.print(
        f"[dim]Config OK — Anthropic {settings.anthropic_api_key.masked()} | "
        f"OpenAI {settings.openai_api_key.masked()} | env={settings.environment}[/dim]"
    )

    ticker = args.ticker.upper()

    # Supply chain mode
    if args.supply_chain:
        from domains import AISupplyChainDomain
        domain = AISupplyChainDomain()
        console.print(f"\n[bold cyan]AI Supply Chain Analysis for {ticker}[/bold cyan]\n")
        console.print(domain.who_benefits_if(ticker))
        console.print("\n")
        console.print(domain.dependency_map(ticker))
        return

    # Get company name
    company_name = args.name
    if not company_name:
        console.print(f"[dim]Looking up company name for {ticker}...[/dim]")
        company_name = get_company_name(ticker)
        console.print(f"[dim]Company: {company_name}[/dim]")

    # Run full research pipeline
    from orchestrator import ResearchOrchestrator
    orchestrator = ResearchOrchestrator(
        ticker=ticker,
        company_name=company_name,
        domain=args.domain,
        fast_mode=args.fast,
    )

    try:
        report_path = orchestrator.run()
        console.print(f"\n[bold green]✓ Report saved:[/bold green] {report_path}")
    except KeyboardInterrupt:
        console.print("\n[yellow]Research interrupted by user.[/yellow]")
        sys.exit(0)
    except Exception as e:
        console.print(f"\n[bold red]ERROR:[/bold red] {e}")
        raise


if __name__ == "__main__":
    main()
