"""
Agent 7: Competitive Intelligence
Maps competitive dynamics, market share, moat assessment, and disruption risk.
"""

from __future__ import annotations
from .base_agent import BaseAgent


class CompetitiveIntelligenceAgent(BaseAgent):
    ROLE = "Competitive Intelligence Analyst"
    PERSONA = (
        "You are a competitive intelligence specialist with deep sector expertise. "
        "You map competitive landscapes with surgical precision — market share data, "
        "pricing power analysis, switching cost assessment, and disruption vectors. "
        "You think like a strategy consultant who covers the same sector for 10 years."
    )

    def run(self) -> dict:
        competitive_map = self._research_call(
            f"Comprehensive competitive analysis of {self.company_name} ({self.ticker}) in {self.domain}:\n\n"
            "1. COMPETITIVE LANDSCAPE:\n"
            "   - Direct competitors with approximate market share\n"
            "   - Indirect competitors and substitutes\n"
            "   - New entrants in the last 18 months\n"
            "   - Which competitor poses the greatest risk over 12 months?\n\n"
            "2. MARKET SHARE DYNAMICS:\n"
            "   - Is this company gaining or losing share? Evidence?\n"
            "   - Win rate vs. key competitors\n"
            "   - Customer retention / churn signals\n\n"
            "3. PRICING POWER:\n"
            "   - Can this company raise prices without losing volume?\n"
            "   - Historical price/mix trends\n"
            "   - Pricing vs. peers (premium, parity, or discount)\n\n"
            "4. DISTRIBUTION AND GO-TO-MARKET:\n"
            "   - Channel strategy vs. competitors\n"
            "   - Customer access advantages\n\n"
            "5. TECHNOLOGY DIFFERENTIATION:\n"
            "   - Performance gap vs. nearest competitor\n"
            "   - Time-to-close the gap for competitors\n\n"
            "Be specific. Name competitors, not just 'peers'.",
            max_tokens=2500,
        )

        moat_analysis = self._research_call(
            f"Moat assessment for {self.company_name} ({self.ticker}):\n\n"
            "Rate and justify each moat source (Strong/Moderate/Weak/None):\n\n"
            "1. NETWORK EFFECTS — Does value increase with more users?\n"
            "2. SWITCHING COSTS — How painful is it for customers to leave?\n"
            "3. COST ADVANTAGES — Scale, process, or location-based?\n"
            "4. INTANGIBLE ASSETS — Patents, brands, regulatory licenses\n"
            "5. EFFICIENT SCALE — Is the market too small for profitable competition?\n\n"
            "MOAT DURABILITY:\n"
            "- How long will the moat last? (2-year / 5-year / 10-year horizon)\n"
            "- What is the single biggest threat to the moat?\n\n"
            "OVERALL MOAT RATING: Wide / Narrow / None\n"
            "Justify with specific evidence, not generic statements.",
            max_tokens=2000,
        )

        disruption_analysis = self._research_call(
            f"Disruption risk analysis for {self.company_name} ({self.ticker}):\n\n"
            "1. TECHNOLOGY DISRUPTION:\n"
            "   - What technology could make this company's product obsolete?\n"
            "   - Timeline: imminent (1-2yr) / medium-term (3-5yr) / long-term (5yr+)\n"
            "   - Is management addressing it or ignoring it?\n\n"
            "2. BUSINESS MODEL DISRUPTION:\n"
            "   - What business model innovation could undercut this company?\n"
            "   - Is there a 'Innovator's Dilemma' dynamic at play?\n\n"
            "3. REGULATORY DISRUPTION:\n"
            "   - What regulation could materially harm this business?\n\n"
            "4. MACRO DISRUPTION:\n"
            "   - Interest rate sensitivity\n"
            "   - Geopolitical / trade war exposure\n"
            "   - China revenue dependency\n\n"
            "Probability-weight each disruption scenario.",
            max_tokens=1500,
        )

        result = {
            "competitive_landscape": competitive_map,
            "moat_analysis": moat_analysis,
            "disruption_risks": disruption_analysis,
        }
        self.output = result
        return result
