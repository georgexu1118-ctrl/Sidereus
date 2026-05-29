"""
Agent 10: Portfolio Manager Synthesis
Acts as the PM who reads all agent outputs and renders a final investment decision.
Weights bull vs. bear cases, assigns conviction, and produces actionable conclusions.
"""

from __future__ import annotations
from .base_agent import BaseAgent


class PortfolioManagerAgent(BaseAgent):
    ROLE = "Portfolio Manager / Senior Investment Officer"
    PERSONA = (
        "You are a portfolio manager with 20+ years of experience managing a concentrated "
        "long/short equity fund. You have read thousands of research reports. "
        "You synthesize conflicting evidence and render decisions. "
        "You are direct. You say Buy or you say Don't Buy. "
        "You have no time for waffling or 'on the one hand... on the other hand.' "
        "You think like Stanley Druckenmiller — macro-aware, fundamentals-grounded, "
        "catalyst-focused, and willing to be contrarian when the evidence supports it."
    )

    def __init__(self, ticker, company_name, domain, all_agent_outputs: dict = None, use_fast_model=False):
        super().__init__(ticker, company_name, domain, use_fast_model)
        self.all_outputs = all_agent_outputs or {}

    def _build_synthesis_context(self) -> str:
        sections = []
        for agent_name, output in self.all_outputs.items():
            if isinstance(output, dict):
                sections.append(f"\n=== {agent_name.upper()} OUTPUTS ===")
                for key, value in output.items():
                    if isinstance(value, str) and len(value) > 50:
                        sections.append(f"\n[{key}]\n{value[:800]}...")
                    elif value is not None:
                        sections.append(f"\n[{key}]: {str(value)[:300]}")
        return "\n".join(sections)[:6000]

    def run(self) -> dict:
        context = self._build_synthesis_context()

        investment_decision = self._research_call(
            f"You have read all research agent outputs for {self.company_name} ({self.ticker}) "
            f"in the {self.domain} sector.\n\n"
            "As Portfolio Manager, render your final investment decision:\n\n"
            "1. RATING: Buy / Hold / Sell (with conviction: High / Medium / Low)\n\n"
            "2. INVESTMENT THESIS (2-3 sentences): What is the core reason to own or avoid?\n\n"
            "3. KEY ASSUMPTIONS THAT MUST BE TRUE for the thesis to work\n\n"
            "4. PRIMARY VARIANT PERCEPTION vs. consensus\n\n"
            "5. POSITION SIZING RATIONALE:\n"
            "   - Core position (2-4%) / Starter (0.5-1%) / Pass\n"
            "   - Why this sizing given the risk/reward?\n\n"
            "6. CATALYSTS: 2-3 specific events that will drive the stock (with timing)\n\n"
            "7. STOP LOSS: At what point would you exit the position? (specific triggers, not price)\n\n"
            "8. MONITORING PLAN: 3 KPIs to watch quarterly\n\n"
            "9. TIME HORIZON: 6-month / 12-month / 24-month thesis\n\n"
            "10. FINAL CONVICTION STATEMENT (1 sentence): Why are YOU right and consensus is wrong?\n\n"
            "Be definitive. No hedging. Own the call.",
            context=context,
            max_tokens=3000,
        )

        executive_summary = self._research_call(
            f"Write the executive summary for the {self.company_name} ({self.ticker}) research report.\n\n"
            "This is the first page of the report that a portfolio manager reads in 60 seconds. "
            "It must capture:\n"
            "- Rating and price target\n"
            "- 3-bullet investment thesis\n"
            "- Key risk\n"
            "- Primary catalyst\n"
            "- Variant perception vs. consensus\n\n"
            "Format: Professional institutional research executive summary. "
            "Crisp, direct, actionable. Under 400 words.",
            context=context,
            max_tokens=1000,
        )

        result = {
            "investment_decision": investment_decision,
            "executive_summary": executive_summary,
        }
        self.output = result
        return result
