"""
Agent 5: Financial Modeling
Builds a 3-statement model framework, unit economics, and scenario analysis.
"""

from __future__ import annotations
import json
from .base_agent import BaseAgent


class FinancialModelingAgent(BaseAgent):
    ROLE = "Financial Modeling Specialist"
    PERSONA = (
        "You are a CFA-certified financial modeling specialist who builds "
        "3-statement models, DCF models, and scenario analyses for institutional clients. "
        "You decompose revenue into drivers, build bottoms-up forecasts, "
        "and stress-test assumptions. You model like a Goldman Sachs TMT analyst."
    )

    def __init__(self, ticker, company_name, domain, market_data: dict = None, use_fast_model=False):
        super().__init__(ticker, company_name, domain, use_fast_model)
        self.market_data = market_data or {}

    def run(self) -> dict:
        # Build context from market data
        fundamentals = self.market_data.get("fundamentals", {})
        context_parts = []
        if fundamentals:
            context_parts.append("AVAILABLE FINANCIAL DATA:")
            for k, v in fundamentals.items():
                context_parts.append(f"  {k}: {v}")
        context = "\n".join(context_parts)

        revenue_model = self._research_call(
            f"Build a revenue decomposition model for {self.company_name} ({self.ticker}).\n\n"
            "1. REVENUE DRIVERS:\n"
            "   - Decompose revenue into 3-5 key drivers (volume × price, segment mix, etc.)\n"
            "   - Historical growth rates by segment (if known)\n"
            "   - Forward projections for FY+1 and FY+2 with bull/base/bear assumptions\n\n"
            "2. UNIT ECONOMICS:\n"
            "   - Revenue per unit / per user / per seat (whichever applies)\n"
            "   - Customer acquisition cost vs. lifetime value (if applicable)\n"
            "   - Gross margin by segment\n\n"
            "3. COST STRUCTURE:\n"
            "   - Fixed vs. variable cost breakdown\n"
            "   - Operating leverage analysis (what happens to margins if revenue +20%?)\n"
            "   - R&D as % of revenue vs. peers\n\n"
            "4. CONSENSUS ESTIMATES:\n"
            "   - Street consensus for next 2 years (revenue, EBITDA, EPS)\n"
            "   - Your bull/base/bear vs. consensus\n\n"
            "5. FREE CASH FLOW:\n"
            "   - FCF conversion rate\n"
            "   - Working capital dynamics\n"
            "   - Capex intensity\n\n"
            "Use specific numbers. Format as a structured model framework.",
            context=context,
            max_tokens=3000,
        )

        margin_analysis = self._research_call(
            f"Margin trajectory analysis for {self.company_name} ({self.ticker}):\n\n"
            "1. Gross margin expansion/contraction drivers (next 2 years)\n"
            "2. Operating leverage inflection point (at what revenue does EBIT margin improve materially?)\n"
            "3. EBITDA margin target vs. current and path to get there\n"
            "4. SG&A efficiency — is spend scaling below or above revenue?\n"
            "5. Key margin risks (input cost, pricing pressure, mix shift)\n"
            "6. Comparison to sector median and best-in-class peers",
            context=context,
            max_tokens=1500,
        )

        result = {
            "revenue_model": revenue_model,
            "margin_analysis": margin_analysis,
        }
        self.output = result
        return result
