"""
Agent 9: Skeptical Analyst (Devil's Advocate)
Attacks every bullish thesis. Finds what consensus is missing.
The most important agent in the system — prevents groupthink.
"""

from __future__ import annotations
from .base_agent import BaseAgent


class SkepticalAnalystAgent(BaseAgent):
    ROLE = "Skeptical Analyst / Devil's Advocate"
    PERSONA = (
        "You are a contrarian analyst. Your job is to destroy investment theses. "
        "You are the short-seller in the room. You have zero tolerance for "
        "optimistic assumptions, management hype, or sell-side cheerleading. "
        "You think like David Einhorn, Hindenburg Research, or a seasoned bear. "
        "You are not negative for sport — you are rigorous in identifying what is wrong. "
        "You ask: What if this company doesn't deserve its multiple? "
        "What if the growth story is already priced in? What if the moat is illusory?"
    )

    def __init__(self, ticker, company_name, domain, bull_thesis: str = "", use_fast_model=False):
        super().__init__(ticker, company_name, domain, use_fast_model)
        self.bull_thesis = bull_thesis

    def run(self) -> dict:
        thesis_attack = self._research_call(
            f"Attack the bull case for {self.company_name} ({self.ticker}) in {self.domain}.\n\n"
            "The bull thesis you must demolish:\n"
            f"{self.bull_thesis if self.bull_thesis else 'Standard bull case for this company'}\n\n"
            "YOUR ATTACKS:\n\n"
            "1. THESIS INVALIDATORS — What single event or datapoint would destroy the thesis?\n\n"
            "2. WRONG ASSUMPTIONS — What assumptions are built into this thesis that are wrong?\n"
            "   - Name the assumption\n"
            "   - Explain why it's wrong or fragile\n"
            "   - What the data actually shows\n\n"
            "3. CONSENSUS BLIND SPOTS — What is the market missing?\n"
            "   - Not priced in negatives\n"
            "   - Valuation air pockets\n"
            "   - Narrative that doesn't match fundamentals\n\n"
            "4. MANAGEMENT CREDIBILITY HOLES — Where has management been wrong or misleading?\n\n"
            "5. STRUCTURAL PROBLEMS — What is fundamentally broken in this business model?\n\n"
            "6. COMPETITIVE REALITY CHECK — Is the moat as wide as bulls claim?\n\n"
            "7. VALUATION CRITIQUE — Why is the current multiple unjustified?\n\n"
            "Be aggressive. Be specific. No softening language.",
            max_tokens=3000,
        )

        bear_case_construction = self._research_call(
            f"Construct the strongest possible bear case for {self.company_name} ({self.ticker}).\n\n"
            "The bear case should:\n"
            "- Be internally consistent (not just a list of risks)\n"
            "- Have a clear narrative arc: what goes wrong, in what sequence, over what timeframe\n"
            "- Include specific financial outcomes (revenue miss, margin compression, multiple contraction)\n"
            "- Identify the catalyst that starts the bear thesis playing out\n"
            "- Derive a bear case price target with methodology\n\n"
            "FORMAT:\n"
            "Catalyst → Fundamental Deterioration → Market Reaction → Price Target\n\n"
            "Include probability of bear case materializing (be honest).",
            max_tokens=2000,
        )

        variant_perception = self._research_call(
            f"What is the variant perception on {self.company_name} ({self.ticker})?\n\n"
            "A variant perception is a view that:\n"
            "- Differs materially from consensus\n"
            "- Is supported by evidence\n"
            "- If right, produces outsized alpha\n\n"
            "Identify:\n"
            "1. The consensus view (what does the street believe?)\n"
            "2. Why consensus might be wrong (specific evidence)\n"
            "3. The variant perception (what do we believe that consensus doesn't?)\n"
            "4. How to size the variant perception (what data would confirm or deny?)\n"
            "5. Time horizon for the variant perception to play out\n\n"
            "This is the most important output — differentiated thinking.",
            max_tokens=2000,
        )

        result = {
            "thesis_attack": thesis_attack,
            "bear_case": bear_case_construction,
            "variant_perception": variant_perception,
        }
        self.output = result
        return result
