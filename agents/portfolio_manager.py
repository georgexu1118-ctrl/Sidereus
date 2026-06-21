"""
Agent 10: Portfolio Manager Synthesis
Reads all agent outputs, renders a final investment decision using the
Serenity Framework: chokepoint verdict, confidence-tiered thesis, the trade,
and a monitoring plan with specific signals.

Think: a concentrated long/short PM with 20 years of experience who has
read thousands of research reports and knows that most of them are wrong.
The PM's job is to find the 10 ideas per year that actually generate alpha.
"""

from __future__ import annotations
from .base_agent import BaseAgent


class PortfolioManagerAgent(BaseAgent):
    ROLE = "Portfolio Manager — Investment Decision Synthesis"

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
                        sections.append(f"\n[{key}]\n{value[:1200]}...")
                    elif value is not None:
                        sections.append(f"\n[{key}]: {str(value)[:400]}")
        return "\n".join(sections)[:8000]

    def run(self) -> dict:
        context = self._build_synthesis_context()

        # ── Investment decision ───────────────────────────────────
        investment_decision = self._research_call(
            f"You have read all research outputs for {self.company_name} ({self.ticker}) "
            f"in the {self.domain} sector. Synthesize and render a final investment decision.\n\n"

            "You manage a concentrated long/short fund. You are looking for the 10 ideas per year "
            "that generate meaningful alpha. Most ideas are PASS.\n\n"

            "SECTION 1 — THE RATING:\n"
            "  Rating: BUY / HOLD / SELL\n"
            "  Conviction: HIGH (core position) / MEDIUM (starter position) / LOW (watch)\n"
            "  Price Target (12-month): $X (methodology: specify multiple on which year metric)\n"
            "  Bull / Base / Bear price targets with probability weights (must sum to 100%)\n\n"

            "SECTION 2 — THE THESIS IN THREE SENTENCES:\n"
            "  Each sentence must carry a specific fact, not a general assertion.\n"
            "  Wrong: 'NVDA benefits from AI demand.' Right: 'NVDA's CoWoS-constrained\n"
            "  B200 allocation is sold out through at least mid-2026 per TSMC's backlog data,\n"
            "  creating a supply-constrained pricing environment that consensus models\n"
            "  still underestimate by ~15% in FY26E revenue.'\n\n"

            "SECTION 3 — THE VARIANT PERCEPTION:\n"
            "  State your variant in the format:\n"
            "  'The market believes [CONSENSUS]. We believe [VARIANT]. The gap closes when [CATALYST].'\n"
            "  This is the CORE of the thesis — if you can't articulate a genuine variant,\n"
            "  the idea doesn't deserve capital.\n\n"

            "SECTION 4 — THE TRADE:\n"
            "  Position sizing:\n"
            "    Core (3-5%) — chokepoint company with confirmed demand, durable moat, asymmetric upside\n"
            "    Starter (1-2%) — high conviction but needs catalyst confirmation\n"
            "    Pass — thesis not differentiated enough to justify position\n"
            "  Why this size vs. alternative uses of capital?\n"
            "  Risk/reward: Expected value = (upside × probability) - (downside × probability) = X%\n\n"

            "SECTION 5 — THE KEY ASSUMPTIONS:\n"
            "  List the 3 assumptions that MUST hold for the thesis to work.\n"
            "  For each:\n"
            "    • State the assumption precisely\n"
            "    • Confidence level: [CONFIRMED] / [HIGH] / [MEDIUM] / [SPECULATIVE]\n"
            "    • What is the downside if this assumption fails?\n\n"

            "SECTION 6 — CATALYSTS (2-3 SPECIFIC EVENTS):\n"
            "  Each catalyst must have:\n"
            "    • Specific event description\n"
            "    • Expected timing: Q[X] [YEAR]\n"
            "    • Expected market impact: +X% to stock price if positive / -X% if negative\n"
            "    • Probability: X%\n\n"

            "SECTION 7 — EXIT TRIGGERS (NOT PRICE LEVELS):\n"
            "  What would make you EXIT this position?\n"
            "  Do NOT say 'if the stock drops 20%' — say:\n"
            "    • '[Customer] announces they are qualifying a second source for [component]'\n"
            "    • 'Revenue miss in [segment] of >15% driven by [pricing or volume]'\n"
            "    • 'Management reduces full-year guidance more than one quarter in a row'\n"
            "  List 3 specific exit triggers.\n\n"

            "SECTION 8 — MONITORING PLAN (3 QUARTERLY KPIs):\n"
            "  Each KPI must be:\n"
            "    • Measurable (not 'track AI demand' — track 'data center revenue growth YoY in %')\n"
            "    • Available (earnings reports, earnings call commentary, industry data)\n"
            "    • Directional (what direction signals thesis intact vs. thesis at risk?)\n\n"

            "SECTION 9 — FINAL CONVICTION STATEMENT:\n"
            "  One sentence. Direct. No hedging.\n"
            "  Format: 'We are [LONG/SHORT] [TICKER] because [specific insight] while the market\n"
            "  believes [consensus view], and the gap closes [specific catalyst timeline].'",
            context=context,
            max_tokens=4000,
        )

        # ── Executive summary ─────────────────────────────────────
        executive_summary = self._research_call(
            f"Write the EXECUTIVE SUMMARY for the {self.company_name} ({self.ticker}) research report.\n\n"

            "This is the FIRST PAGE of the report. A PM reads it in 45 seconds.\n"
            "It must make them either immediately interested or immediately uninterested.\n"
            "Generic executive summaries that could apply to any company are UNACCEPTABLE.\n\n"

            "FORMAT:\n\n"
            "[TICKER] | [COMPANY NAME] | [DOMAIN] | [RATING] | PT: $[X] | [DATE]\n\n"

            "THE TRADE (2 sentences):\n"
            "[What is the asymmetric thesis? What does the market miss?]\n\n"

            "THREE BULLETS — each with a specific fact:\n"
            "• [Structural advantage with evidence]\n"
            "• [Near-term catalyst with timing and probability]\n"
            "• [Variant perception vs. consensus]\n\n"

            "PRIMARY RISK (1 sentence — the one thing that could destroy the thesis):\n\n"

            "PRICE TARGET FRAMEWORK:\n"
            "Bull: $[X] (X% upside, X% probability) — [one-line scenario]\n"
            "Base: $[X] (X% upside, X% probability) — [one-line scenario]\n"
            "Bear: $[X] (X% downside, X% probability) — [one-line scenario]\n"
            "Expected Value: $[X] ([X]% upside/downside from current)\n\n"

            "KEY MONITORING INDICATOR: [One metric. If this metric does X, the thesis is intact.]",
            context=context,
            max_tokens=1200,
        )

        result = {
            "investment_decision": investment_decision,
            "executive_summary": executive_summary,
        }
        self.output = result
        return result
