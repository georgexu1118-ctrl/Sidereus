"""
Report Generator — Sidereus / Serenity Framework
Assembles all agent outputs into a structured institutional research report.

Structure is modelled on the best independent research:
  1. The Trade (not a company overview — readers know what NVDA is)
  2. Supply chain position & chokepoint verdict
  3. Evidence assessment (confidence-tiered)
  4. Financial analysis
  5. Thesis attack & variant perception
  6. Investment conclusion

Reports are designed to be read in 5-8 minutes by a portfolio manager.
Every section must answer "so what?" not just "here is information."
"""

from __future__ import annotations
import os
from datetime import datetime
from typing import Any


DISCLAIMER = (
    "\n\n---\n"
    "*Sidereus Research — AI-generated institutional research for informational purposes only. "
    "Not investment advice. All projections, price targets, and ratings are illustrative. "
    "Verify all data independently. Past performance does not predict future results.*\n"
)


def _fmt(val: Any, decimals: int = 2) -> str:
    if val is None:
        return "N/A"
    try:
        v = float(val)
        if abs(v) >= 1e12:
            return f"${v/1e12:.{decimals}f}T"
        if abs(v) >= 1e9:
            return f"${v/1e9:.{decimals}f}B"
        if abs(v) >= 1e6:
            return f"${v/1e6:.{decimals}f}M"
        return f"${v:,.{decimals}f}"
    except (TypeError, ValueError):
        return str(val)


def _pct(val: Any) -> str:
    if val is None:
        return "N/A"
    try:
        return f"{float(val)*100:.1f}%"
    except (TypeError, ValueError):
        return str(val)


def _price(val: Any) -> str:
    if val is None:
        return "N/A"
    try:
        return f"${float(val):,.2f}"
    except (TypeError, ValueError):
        return str(val)


class ReportGenerator:
    def __init__(self, ticker: str, company_name: str, domain: str, rating: str = ""):
        self.ticker = ticker.upper()
        self.company_name = company_name
        self.domain = domain
        self.rating = rating
        self.generated_at = datetime.now()

    def _h1(self, title: str) -> str:
        return f"\n{'═' * 80}\n# {title}\n{'═' * 80}\n"

    def _h2(self, title: str) -> str:
        return f"\n{'─' * 60}\n## {title}\n{'─' * 60}\n"

    def _h3(self, title: str) -> str:
        return f"\n### {title}\n"

    def build_cover_page(self, market_data: dict, pm_output: dict) -> str:
        fund = market_data.get("fundamentals", {})
        price_hist = market_data.get("price_history", {})
        analyst_rec = market_data.get("analyst_recommendations", {})
        exec_summary = pm_output.get("executive_summary", "")
        pm_decision = pm_output.get("investment_decision", "")

        total_buy = analyst_rec.get("strongBuy", 0) + analyst_rec.get("buy", 0)
        total_hold = analyst_rec.get("hold", 0)
        total_sell = analyst_rec.get("sell", 0) + analyst_rec.get("strongSell", 0)

        return f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║          SIDEREUS RESEARCH — SERENITY FRAMEWORK EQUITY REPORT              ║
║          Institutional-Grade AI-Native Research System                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

# {self.company_name} ({self.ticker})
**Domain:** {self.domain}  |  **Date:** {self.generated_at.strftime('%B %d, %Y')}

---

| Metric | Value |
|--------|-------|
| Market Cap | {_fmt(fund.get('marketCap'))} |
| Enterprise Value | {_fmt(fund.get('enterpriseValue'))} |
| 52-Week Range | {_price(price_hist.get('52w_low'))} – {_price(price_hist.get('52w_high'))} |
| 1-Year Performance | {price_hist.get('price_change_pct', 'N/A')}% |
| P/S (TTM) | {fund.get('priceToSalesTrailing12Months', 'N/A')}× |
| EV/Revenue (TTM) | {fund.get('enterpriseToRevenue', 'N/A')}× |
| EV/EBITDA (TTM) | {fund.get('enterpriseToEbitda', 'N/A')}× |
| Forward P/E | {fund.get('forwardPE', 'N/A')}× |
| Revenue Growth (YoY) | {_pct(fund.get('revenueGrowth'))} |
| Gross Margin | {_pct(fund.get('grossMargins'))} |
| Operating Margin | {_pct(fund.get('operatingMargins'))} |
| Free Cash Flow | {_fmt(fund.get('freeCashflow'))} |
| Beta | {fund.get('beta', 'N/A')} |

**Street Consensus:** Buy: {total_buy} | Hold: {total_hold} | Sell: {total_sell}

---

### How to read this report

This report is structured for asymmetry-hunting, not consensus reinforcement.
Each section is written to answer *"so what?"* — what does this fact change about
the trade?  Confidence tiers are explicit: **[CONFIRMED] · [HIGH] · [MEDIUM] ·
[INFERRED] · [SPECULATIVE]**. A `[MEDIUM]` claim no one else has mapped is
worth more than a `[CONFIRMED]` claim already in consensus.

The framework draws from Citrini Research (atoms vs. bits, mechanical
repricing, chokepoint identification), Aleabitoreddit (OSINT supply chain
triangulation), and SemiconSam (technical precision in semiconductor analysis).

---

{self._h1('EXECUTIVE SUMMARY — THE TRADE')}

{exec_summary}

{DISCLAIMER}
"""

    def build_full_report(self, all_outputs: dict) -> str:
        md = []
        market_data = all_outputs.get("data_collection", {})
        pm_out = all_outputs.get("portfolio_manager", {})
        industry = all_outputs.get("industry_research", {})
        sec = all_outputs.get("sec_filing", {})
        earnings = all_outputs.get("earnings_call", {})
        fin = all_outputs.get("financial_modeling", {})
        val = all_outputs.get("valuation", {})
        comp = all_outputs.get("competitive_intelligence", {})
        risk = all_outputs.get("risk_assessment", {})
        skeptic = all_outputs.get("skeptical_analyst", {})
        supply_enrich = all_outputs.get("supply_chain_enrichment", {})
        dc_enrich = all_outputs.get("datacenter_enrichment", {})
        bio_enrich = all_outputs.get("biotech_enrichment", {})

        # ── COVER PAGE ─────────────────────────────────────────────
        md.append(self.build_cover_page(market_data, pm_out))

        # ── SECTION 1: INVESTMENT DECISION ─────────────────────────
        md.append(self._h1("SECTION I — INVESTMENT DECISION & PORTFOLIO MANAGER VERDICT"))
        md.append(pm_out.get("investment_decision", "Not generated."))

        # ── SECTION 2: SUPPLY CHAIN POSITION / CHOKEPOINT ──────────
        if industry.get("supply_chain_map"):
            md.append(self._h1("SECTION II — SUPPLY CHAIN POSITION & CHOKEPOINT ANALYSIS"))
            md.append(industry["supply_chain_map"])
            if supply_enrich:
                md.append(self._h3("Beneficiary Mapping"))
                if supply_enrich.get("beneficiaries"):
                    md.append(f"**2nd/3rd-Order Beneficiaries:**\n{supply_enrich['beneficiaries']}")
                if supply_enrich.get("dependencies"):
                    md.append(f"\n**Dependency Map:**\n{supply_enrich['dependencies']}")

        # ── SECTION 3: INDUSTRY / TAM / SECULAR TRENDS ─────────────
        md.append(self._h1("SECTION III — INDUSTRY ANALYSIS & TAM"))
        md.append(industry.get("tam_and_trends", "Not generated."))

        if dc_enrich:
            md.append(self._h3("Data Center Domain Enrichment"))
            md.append(f"**Hyperscaler Capex:**\n{dc_enrich.get('hyperscaler_capex', '')}")
            md.append(f"\n**Power Density Trend:**\n{dc_enrich.get('power_density_trend', '')}")

        # ── SECTION 4: BIOTECH PIPELINE ─────────────────────────────
        if industry.get("biotech_analysis"):
            md.append(self._h1("SECTION IV — BIOTECH PIPELINE & CLINICAL ANALYSIS"))
            md.append(industry["biotech_analysis"])
            if bio_enrich:
                md.append(self._h3("Historical Probability of Success Benchmarks"))
                pos = bio_enrich.get("pos_by_phase", {})
                if pos:
                    md.append(
                        f"- Phase 1 → Approval: {pos.get('Phase_1_to_approval', 'N/A')}\n"
                        f"- Phase 2 → Phase 3: {pos.get('Phase_2_to_Phase_3', 'N/A')}\n"
                        f"- Phase 3 → Approval: {pos.get('Phase_3_to_approval', 'N/A')}\n"
                    )

        # ── SECTION 5: COMPANY OVERVIEW & SEC ANALYSIS ─────────────
        md.append(self._h1("SECTION V — COMPANY OVERVIEW & SEC FILING INTELLIGENCE"))
        md.append(sec.get("analysis", "Not generated."))

        # ── SECTION 6: EARNINGS INTELLIGENCE ───────────────────────
        md.append(self._h1("SECTION VI — EARNINGS CALL INTELLIGENCE"))
        md.append(earnings.get("earnings_analysis", "Not generated."))
        if earnings.get("management_credibility"):
            md.append(self._h2("Management Credibility Assessment"))
            md.append(earnings["management_credibility"])

        # ── SECTION 7: FINANCIAL MODELING ──────────────────────────
        md.append(self._h1("SECTION VII — FINANCIAL MODELING & REVENUE ARCHITECTURE"))
        md.append(fin.get("revenue_model", "Not generated."))
        if fin.get("margin_analysis"):
            md.append(self._h2("Margin Trajectory"))
            md.append(fin["margin_analysis"])

        # ── SECTION 8: VALUATION ─────────────────────────────────
        md.append(self._h1("SECTION VIII — VALUATION FRAMEWORK"))
        md.append(val.get("dcf_analysis", "Not generated."))
        if val.get("comps_analysis"):
            md.append(self._h2("Comparable Company Analysis"))
            md.append(val["comps_analysis"])
        if val.get("price_targets"):
            md.append(self._h2("Price Target Summary — Bull / Base / Bear"))
            md.append(val["price_targets"])

        # ── SECTION 9: COMPETITIVE POSITIONING ──────────────────
        md.append(self._h1("SECTION IX — COMPETITIVE POSITIONING & DISPLACEMENT SIGNALS"))
        md.append(comp.get("competitive_landscape", "Not generated."))
        if comp.get("moat_analysis"):
            md.append(self._h2("Moat Forensics"))
            md.append(comp["moat_analysis"])
        if comp.get("disruption_risks"):
            md.append(self._h2("Disruption Risk Assessment"))
            md.append(comp["disruption_risks"])

        # ── SECTION 10: RISK ASSESSMENT ──────────────────────────
        md.append(self._h1("SECTION X — RISK ASSESSMENT"))
        md.append(risk.get("primary_risks", "Not generated."))
        if risk.get("tail_risks"):
            md.append(self._h2("Non-Consensus Tail Risks"))
            md.append(risk["tail_risks"])
        if risk.get("risk_reward_summary"):
            md.append(self._h2("Risk/Reward Summary"))
            md.append(risk["risk_reward_summary"])

        # ── SECTION 11: THESIS ATTACK (MOST IMPORTANT SECTION) ───
        md.append(self._h1("SECTION XI — THESIS ATTACK & SKEPTICAL REVIEW"))
        md.append("*This section presents the strongest case AGAINST the investment. "
                  "If the arguments here are dismissed too easily, reconsider the position.*\n")
        md.append(skeptic.get("thesis_attack", "Not generated."))

        if skeptic.get("bear_case"):
            md.append(self._h2("Bear Case Construction"))
            md.append(skeptic["bear_case"])

        # ── SECTION 12: VARIANT PERCEPTION ───────────────────────
        md.append(self._h1("SECTION XII — VARIANT PERCEPTION"))
        md.append("*The variant perception is the ONLY reason to own this stock over alternatives. "
                  "If you cannot articulate a genuine variant, the thesis is not differentiated.*\n")
        md.append(skeptic.get("variant_perception", "Not generated."))

        # ── FOOTER ───────────────────────────────────────────────
        md.append(
            f"\n{'═' * 80}\n"
            f"*Report generated: {self.generated_at.strftime('%Y-%m-%d %H:%M')} UTC*\n"
            f"*Sidereus AI Research System — Serenity Framework v2.0*\n"
            f"*10 specialized agents | Supply chain intelligence | OSINT triangulation*\n"
        )

        return "\n".join(md)

    def save(self, report_text: str, output_dir: str) -> str:
        os.makedirs(output_dir, exist_ok=True)
        timestamp = self.generated_at.strftime("%Y%m%d_%H%M%S")
        filename = f"{self.ticker}_sidereus_{timestamp}.md"
        filepath = os.path.join(output_dir, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(report_text)
        return filepath
