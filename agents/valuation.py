"""
Agent 6: Valuation
Runs DCF, comps, and sum-of-parts analysis. Derives price targets for bull/base/bear.
"""

from __future__ import annotations
from .base_agent import BaseAgent


class ValuationAgent(BaseAgent):
    ROLE = "Equity Valuation Specialist"
    PERSONA = (
        "You are a managing director-level equity valuation expert. "
        "You run DCF, EV/EBITDA, P/E, P/S, and sum-of-parts analyses. "
        "You calibrate discount rates using CAPM with beta and risk premium adjustments. "
        "You triangulate across methodologies to derive defensible price targets. "
        "You think like a Jefferies or Evercore ISI senior analyst."
    )

    def __init__(self, ticker, company_name, domain, market_data: dict = None, model_output: dict = None, use_fast_model=False):
        super().__init__(ticker, company_name, domain, use_fast_model)
        self.market_data = market_data or {}
        self.model_output = model_output or {}

    def run(self) -> dict:
        fundamentals = self.market_data.get("fundamentals", {})
        price_history = self.market_data.get("price_history", {})

        context_lines = []
        if fundamentals:
            context_lines.append("CURRENT MARKET DATA:")
            for k, v in list(fundamentals.items())[:20]:
                context_lines.append(f"  {k}: {v}")
        if price_history:
            context_lines.append("\nPRICE DATA:")
            for k, v in price_history.items():
                context_lines.append(f"  {k}: {v}")
        context = "\n".join(context_lines)

        dcf_analysis = self._research_call(
            f"Build a DCF valuation for {self.company_name} ({self.ticker}).\n\n"
            "1. DCF FRAMEWORK:\n"
            "   - 5-year FCF forecast (bull/base/bear)\n"
            "   - WACC derivation (risk-free rate, beta, equity risk premium, cost of debt)\n"
            "   - Terminal value method (perpetuity growth or exit multiple)\n"
            "   - Terminal growth rate assumption and justification\n"
            "   - Implied price target per share for each scenario\n\n"
            "2. SENSITIVITY TABLE:\n"
            "   - WACC vs. terminal growth rate grid\n"
            "   - Which assumption drives the most value?\n\n"
            "3. DCF SANITY CHECK:\n"
            "   - Implied FCF yield at current price\n"
            "   - Is DCF consistent with comps?\n\n"
            "Be explicit about every assumption. Label as estimate where needed.",
            context=context,
            max_tokens=2500,
        )

        comps_analysis = self._research_call(
            f"Build a comparable company analysis for {self.company_name} ({self.ticker}).\n\n"
            "1. PEER GROUP:\n"
            "   - Select 5-8 most comparable public companies\n"
            "   - Explain selection criteria (business model, growth profile, margin structure)\n\n"
            "2. TRADING MULTIPLES TABLE:\n"
            "   - EV/Revenue, EV/EBITDA, P/E, P/FCF for each peer\n"
            "   - Current vs. 1-year forward multiples\n"
            "   - Where does {self.ticker} trade vs. peer median and mean?\n\n"
            "3. PREMIUM/DISCOUNT JUSTIFICATION:\n"
            "   - Should {self.ticker} trade at premium or discount and why?\n"
            "   - What metrics justify a re-rating?\n\n"
            "4. IMPLIED VALUATION:\n"
            "   - Target price implied by comps (bull/base/bear)\n"
            "   - Upside/downside from current levels",
            context=context,
            max_tokens=2500,
        )

        price_targets = self._research_call(
            f"Synthesize a final price target framework for {self.company_name} ({self.ticker}):\n\n"
            "1. Weighted price target (DCF 50% + Comps 35% + Other 15%)\n"
            "2. Bull case price target with key assumptions\n"
            "3. Base case price target with key assumptions\n"
            "4. Bear case price target with key assumptions\n"
            "5. Expected return vs. current price\n"
            "6. Rating: Buy / Hold / Sell / Underperform with conviction level\n"
            "7. Catalyst timeline for re-rating\n\n"
            "Be specific. All price targets need derivation, not just numbers.",
            context=context,
            max_tokens=1500,
        )

        result = {
            "dcf_analysis": dcf_analysis,
            "comps_analysis": comps_analysis,
            "price_targets": price_targets,
        }
        self.output = result
        return result
