"""
Agent 3: Earnings Call Intelligence
Analyzes earnings call transcripts and management commentary patterns.
Uses Claude to reason about tone, guidance changes, and analyst Q&A signals.
"""

from __future__ import annotations
from .base_agent import BaseAgent


class EarningsCallAgent(BaseAgent):
    ROLE = "Earnings Call Analyst"
    PERSONA = (
        "You are an expert at dissecting earnings call transcripts. "
        "You detect management tone shifts, guidance conservatism or aggression, "
        "analyst probing patterns, and discrepancies between prepared remarks and Q&A. "
        "You think like a seasoned buy-side analyst who has listened to 10,000 earnings calls."
    )

    def run(self) -> dict:
        # Generate earnings analysis from Claude's training knowledge
        prepared_remarks_analysis = self._research_call(
            f"Analyze recent earnings calls for {self.company_name} ({self.ticker}). "
            "Produce:\n"
            "1. Management tone assessment (bullish/neutral/defensive) with evidence\n"
            "2. Key guidance metrics provided (revenue, margins, capex)\n"
            "3. Topics management emphasized vs. avoided\n"
            "4. Notable analyst questions and management responses\n"
            "5. Beat/miss history over last 4 quarters (EPS and revenue)\n"
            "6. Changes in language or key performance indicators from prior calls\n"
            "7. Red flags: vague answers, deflection, CEO/CFO disagreement signals\n"
            "8. Confidence level in forward guidance\n\n"
            "Be specific. Name actual metrics and quote-style observations. "
            "Label assumptions where live transcript is unavailable.",
            max_tokens=2500,
        )

        tone_shift_analysis = self._research_call(
            f"For {self.company_name} ({self.ticker}), perform a management credibility assessment:\n"
            "- Has management historically delivered on guidance?\n"
            "- What is the pattern of upward vs. downward revisions?\n"
            "- Are there recurring hedging phrases that signal uncertainty?\n"
            "- What is management's track record on capital allocation commentary?\n"
            "- Are there concerning patterns in how they discuss competition or market share?\n\n"
            "Produce a Management Credibility Score: 1-10 with detailed justification.",
            max_tokens=1500,
        )

        result = {
            "earnings_analysis": prepared_remarks_analysis,
            "management_credibility": tone_shift_analysis,
        }
        self.output = result
        return result
