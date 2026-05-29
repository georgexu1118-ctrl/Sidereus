"""
Agent 8: Risk Assessment
Systematic risk identification across financial, operational, regulatory, geopolitical,
and macro dimensions. Assigns probability and impact scores.
"""

from __future__ import annotations
from .base_agent import BaseAgent


class RiskAssessmentAgent(BaseAgent):
    ROLE = "Risk Assessment Specialist"
    PERSONA = (
        "You are a senior risk analyst who thinks probabilistically. "
        "You identify both obvious consensus risks and non-consensus tail risks. "
        "You score risks by probability and impact magnitude. "
        "You think like a risk manager at a long/short hedge fund — you are paid to be right "
        "about what kills positions, not to be polite about it."
    )

    def run(self) -> dict:
        primary_risks = self._research_call(
            f"Systematic risk assessment for {self.company_name} ({self.ticker}) in {self.domain}.\n\n"
            "For each risk, provide: Description | Probability (H/M/L) | Impact (H/M/L) | Timeline | Mitigant\n\n"
            "CATEGORY 1 — FINANCIAL RISKS:\n"
            "- Balance sheet risks (leverage, liquidity, covenants)\n"
            "- Revenue concentration risk\n"
            "- Margin compression risk\n"
            "- Dilution risk (equity issuance)\n\n"
            "CATEGORY 2 — OPERATIONAL RISKS:\n"
            "- Execution risk on key initiatives\n"
            "- Key-man dependency\n"
            "- Supply chain fragility\n"
            "- Manufacturing or technology ramp risk\n\n"
            "CATEGORY 3 — COMPETITIVE RISKS:\n"
            "- Market share loss to specific named competitor\n"
            "- Customer concentration / loss of anchor customer\n"
            "- Product commoditization\n\n"
            "CATEGORY 4 — REGULATORY & LEGAL:\n"
            "- Antitrust exposure\n"
            "- Export controls / CHIPS Act / AI regulation\n"
            "- IP litigation\n"
            "- ESG / compliance risks\n\n"
            "CATEGORY 5 — MACRO & GEOPOLITICAL:\n"
            "- China exposure and decoupling risk\n"
            "- Interest rate sensitivity on valuation\n"
            "- Capex cycle slowdown risk\n"
            "- Semiconductor cycle risk\n\n"
            "Format: structured table-like output, not narrative prose.",
            max_tokens=3000,
        )

        tail_risks = self._research_call(
            f"Identify 3 non-consensus tail risks for {self.company_name} ({self.ticker}) "
            "that the market is NOT pricing in:\n\n"
            "For each tail risk:\n"
            "1. The specific scenario (be precise)\n"
            "2. Why the market is currently ignoring it\n"
            "3. Probability estimate (even if low)\n"
            "4. Downside to stock if it materializes\n"
            "5. Early warning indicators to watch\n\n"
            "These should be differentiated insights — not the obvious risks already in consensus.",
            max_tokens=2000,
        )

        risk_reward = self._research_call(
            f"Risk/reward summary for {self.company_name} ({self.ticker}):\n\n"
            "1. Asymmetry assessment: Is the upside larger than the downside? By how much?\n"
            "2. Maximum drawdown scenario and probability\n"
            "3. What is the biggest risk that, if resolved, would be a clear buy signal?\n"
            "4. What is the single most important variable to monitor?\n"
            "5. Overall risk rating: High / Moderate / Low with justification",
            max_tokens=1000,
        )

        result = {
            "primary_risks": primary_risks,
            "tail_risks": tail_risks,
            "risk_reward_summary": risk_reward,
        }
        self.output = result
        return result
