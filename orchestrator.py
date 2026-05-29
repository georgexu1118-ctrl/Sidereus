"""
Research Orchestrator
Coordinates all 10 agents, manages execution flow, and produces the final report.
This is the brain of the Equity Research OS.
"""

from __future__ import annotations
import sys
import os
import json
import time
from datetime import datetime
from typing import Any

from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
from rich.table import Table
from rich.text import Text

from config import OUTPUT_DIR, REPORT_SECTIONS
from agents import (
    DataCollectionAgent,
    SECFilingAgent,
    EarningsCallAgent,
    IndustryResearchAgent,
    FinancialModelingAgent,
    ValuationAgent,
    CompetitiveIntelligenceAgent,
    RiskAssessmentAgent,
    SkepticalAnalystAgent,
    PortfolioManagerAgent,
)
from domains import AISupplyChainDomain, DataCenterDomain, BiotechDomain
from report import ReportGenerator

console = Console()


def _detect_domain(ticker: str, user_domain: str | None) -> str:
    """Auto-detect domain from ticker if not specified."""
    if user_domain:
        return user_domain

    AI_SUPPLY_TICKERS = {"NVDA", "AMD", "INTC", "AVGO", "MRVL", "ASML", "AMAT", "LRCX", "KLAC",
                         "MU", "SNPS", "CDNS", "ANET", "CSCO", "LITE", "COHR"}
    DATA_CENTER_TICKERS = {"VRT", "SMCI", "HPE", "DELL", "EQIX", "DLR", "AMT"}
    BIOTECH_TICKERS = {"MRNA", "BNTX", "REGN", "VRTX", "GILD", "BIIB", "SGEN", "BMRN",
                       "ALNY", "IONS", "BLUE", "BEAM", "NTLA", "CRSP"}

    ticker = ticker.upper()
    if ticker in AI_SUPPLY_TICKERS:
        return "AI Supply Chain"
    if ticker in DATA_CENTER_TICKERS:
        return "Data Center Ecosystem"
    if ticker in BIOTECH_TICKERS:
        return "Biotechnology"
    return "Frontier Technology"


class ResearchOrchestrator:
    """
    Runs all 10 research agents in sequence, feeds outputs between agents,
    and generates a final institutional research report.
    """

    def __init__(self, ticker: str, company_name: str, domain: str | None = None,
                 fast_mode: bool = False):
        self.ticker = ticker.upper()
        self.company_name = company_name
        self.domain = _detect_domain(ticker, domain)
        self.fast_mode = fast_mode
        self.outputs: dict[str, Any] = {}
        self.timing: dict[str, float] = {}
        self.start_time = None

    def _run_agent(self, name: str, agent_fn):
        """Run one agent with timing and rich output."""
        t0 = time.time()
        console.print(f"\n  [bold cyan]▶[/bold cyan] Running [bold]{name}[/bold]...")
        try:
            result = agent_fn()
            elapsed = time.time() - t0
            self.timing[name] = elapsed
            console.print(f"  [green]✓[/green] {name} completed in {elapsed:.1f}s")
            return result
        except Exception as e:
            elapsed = time.time() - t0
            self.timing[name] = elapsed
            console.print(f"  [red]✗[/red] {name} failed: {e}")
            return {"error": str(e)}

    def run(self) -> str:
        """Execute the full research pipeline and return the report path."""
        self.start_time = time.time()

        console.print(Panel(
            f"[bold white]EQUITY RESEARCH OS[/bold white]\n"
            f"[yellow]{self.company_name} ({self.ticker})[/yellow]\n"
            f"[dim]Sector: {self.domain}[/dim]\n"
            f"[dim]Mode: {'Fast' if self.fast_mode else 'Full'} | {datetime.now().strftime('%Y-%m-%d %H:%M')}[/dim]",
            border_style="blue",
            width=60,
        ))

        # ─────────────────────────────────────────
        # AGENT 1: Data Collection
        # ─────────────────────────────────────────
        agent1 = DataCollectionAgent(
            self.ticker, self.company_name, self.domain, use_fast_model=self.fast_mode
        )
        self.outputs["data_collection"] = self._run_agent("Agent 1: Data Collection", agent1.run)
        market_data = self.outputs["data_collection"]

        # ─────────────────────────────────────────
        # AGENT 2: SEC Filing Analysis
        # ─────────────────────────────────────────
        agent2 = SECFilingAgent(
            self.ticker, self.company_name, self.domain, use_fast_model=self.fast_mode
        )
        self.outputs["sec_filing"] = self._run_agent("Agent 2: SEC Filing Analysis", agent2.run)

        # ─────────────────────────────────────────
        # AGENT 3: Earnings Call Intelligence
        # ─────────────────────────────────────────
        agent3 = EarningsCallAgent(
            self.ticker, self.company_name, self.domain, use_fast_model=self.fast_mode
        )
        self.outputs["earnings_call"] = self._run_agent("Agent 3: Earnings Call Intelligence", agent3.run)

        # ─────────────────────────────────────────
        # AGENT 4: Industry Research
        # ─────────────────────────────────────────
        agent4 = IndustryResearchAgent(
            self.ticker, self.company_name, self.domain, use_fast_model=self.fast_mode
        )
        self.outputs["industry_research"] = self._run_agent("Agent 4: Industry Research", agent4.run)

        # ─────────────────────────────────────────
        # AGENT 5: Financial Modeling
        # ─────────────────────────────────────────
        agent5 = FinancialModelingAgent(
            self.ticker, self.company_name, self.domain,
            market_data=market_data, use_fast_model=self.fast_mode
        )
        self.outputs["financial_modeling"] = self._run_agent("Agent 5: Financial Modeling", agent5.run)

        # ─────────────────────────────────────────
        # AGENT 6: Valuation
        # ─────────────────────────────────────────
        agent6 = ValuationAgent(
            self.ticker, self.company_name, self.domain,
            market_data=market_data,
            model_output=self.outputs.get("financial_modeling", {}),
            use_fast_model=self.fast_mode,
        )
        self.outputs["valuation"] = self._run_agent("Agent 6: Valuation", agent6.run)

        # ─────────────────────────────────────────
        # AGENT 7: Competitive Intelligence
        # ─────────────────────────────────────────
        agent7 = CompetitiveIntelligenceAgent(
            self.ticker, self.company_name, self.domain, use_fast_model=self.fast_mode
        )
        self.outputs["competitive_intelligence"] = self._run_agent(
            "Agent 7: Competitive Intelligence", agent7.run
        )

        # ─────────────────────────────────────────
        # AGENT 8: Risk Assessment
        # ─────────────────────────────────────────
        agent8 = RiskAssessmentAgent(
            self.ticker, self.company_name, self.domain, use_fast_model=self.fast_mode
        )
        self.outputs["risk_assessment"] = self._run_agent("Agent 8: Risk Assessment", agent8.run)

        # ─────────────────────────────────────────
        # AGENT 9: Skeptical Analyst (Devil's Advocate)
        # ─────────────────────────────────────────
        bull_thesis = self.outputs.get("financial_modeling", {}).get("revenue_model", "")
        agent9 = SkepticalAnalystAgent(
            self.ticker, self.company_name, self.domain,
            bull_thesis=bull_thesis, use_fast_model=self.fast_mode
        )
        self.outputs["skeptical_analyst"] = self._run_agent(
            "Agent 9: Skeptical Analyst", agent9.run
        )

        # ─────────────────────────────────────────
        # AGENT 10: Portfolio Manager (Synthesis)
        # ─────────────────────────────────────────
        agent10 = PortfolioManagerAgent(
            self.ticker, self.company_name, self.domain,
            all_agent_outputs=self.outputs, use_fast_model=self.fast_mode
        )
        self.outputs["portfolio_manager"] = self._run_agent(
            "Agent 10: Portfolio Manager Synthesis", agent10.run
        )

        # ─────────────────────────────────────────
        # Domain-specific enrichment
        # ─────────────────────────────────────────
        self._run_domain_enrichment()

        # ─────────────────────────────────────────
        # Report Generation
        # ─────────────────────────────────────────
        console.print("\n  [bold cyan]▶[/bold cyan] Assembling final report...")
        generator = ReportGenerator(self.ticker, self.company_name, self.domain)
        report_text = generator.build_full_report(self.outputs)
        filepath = generator.save(report_text, OUTPUT_DIR)

        # Save raw outputs as JSON
        json_path = filepath.replace(".md", "_raw.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(self.outputs, f, indent=2, default=str)

        total_time = time.time() - self.start_time
        self._print_summary(filepath, total_time)

        return filepath

    def _run_domain_enrichment(self):
        """Add domain-specific knowledge graph and supply chain analysis."""
        if self.domain in ("AI Supply Chain", "Semiconductor Infrastructure", "Data Center Ecosystem"):
            domain_ctrl = AISupplyChainDomain()
            ticker = self.ticker
            if ticker in domain_ctrl.graph.entities:
                beneficiaries = domain_ctrl.who_benefits_if(ticker)
                deps = domain_ctrl.dependency_map(ticker)
                self.outputs["supply_chain_enrichment"] = {
                    "beneficiaries": beneficiaries,
                    "dependencies": deps,
                }

        if self.domain == "Data Center Ecosystem":
            dc = DataCenterDomain()
            self.outputs["datacenter_enrichment"] = {
                "hyperscaler_capex": dc.get_hyperscaler_capex(),
                "power_density_trend": dc.get_power_density_trend(),
                "power_intensity_assessment": dc.assess_power_intensity(self.ticker),
                "total_addressable_power_opportunity": dc.total_addressable_power_opportunity(),
            }

        if self.domain == "Biotechnology":
            bio = BiotechDomain()
            self.outputs["biotech_enrichment"] = {
                "fda_pathways": bio.get_all_pathways(),
                "pos_by_phase": {
                    "Phase_1_to_approval": bio.get_pos("Phase_1_to_approval"),
                    "Phase_2_to_Phase_3": bio.get_pos("Phase_2_to_Phase_3"),
                    "Phase_3_to_approval": bio.get_pos("Phase_3_to_approval"),
                },
            }

    def _print_summary(self, filepath: str, total_time: float):
        table = Table(title="Research Pipeline Summary", border_style="blue")
        table.add_column("Agent", style="cyan")
        table.add_column("Time", justify="right", style="green")
        table.add_column("Status", justify="center")

        for agent_name, t in self.timing.items():
            status = "[red]FAILED[/red]" if "error" in str(self.outputs.get(agent_name, {})) else "[green]✓[/green]"
            table.add_row(agent_name, f"{t:.1f}s", status)

        console.print("\n", table)
        console.print(Panel(
            f"[bold green]Report Generated Successfully[/bold green]\n"
            f"[dim]Path:[/dim] {filepath}\n"
            f"[dim]Total time:[/dim] {total_time:.1f}s",
            border_style="green",
            width=70,
        ))
