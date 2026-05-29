"""
Agent 4: Industry Research
Produces sector context, TAM sizing, secular trends, and regulatory environment analysis.
Specializes in AI supply chain, semiconductors, biotech, and data center domains.
"""

from __future__ import annotations
from .base_agent import BaseAgent


DOMAIN_SYSTEM_ADDITIONS = {
    "AI Supply Chain": (
        "You have deep expertise in the AI semiconductor supply chain: "
        "foundries (TSMC, Samsung, Intel Foundry), memory (HBM, GDDR, LPDDR), "
        "networking (InfiniBand, Ethernet, RoCE), optical interconnects, "
        "advanced packaging (CoWoS, SoIC, HBM stacking), power delivery, "
        "ASIC vs. GPU tradeoffs, and custom silicon programs at hyperscalers."
    ),
    "Semiconductor Infrastructure": (
        "You have deep expertise in semiconductor equipment, EDA, IP licensing, "
        "process nodes (3nm, 2nm, 1.6nm), yield economics, and the equipment supply chain "
        "(ASML, Applied Materials, Lam Research, KLA, Tokyo Electron)."
    ),
    "Biotechnology": (
        "You have deep expertise in drug mechanisms, clinical trial design, "
        "FDA regulatory pathways (IND, NDA, BLA, sNDA, breakthrough designation), "
        "probability of clinical success by phase and indication, "
        "commercial market sizing, and biotech competitive dynamics."
    ),
    "Data Center Ecosystem": (
        "You have deep expertise in hyperscaler capex cycles, colocation, "
        "power infrastructure, cooling technology, AI accelerator deployment, "
        "and the full data center supply chain from real estate to silicon."
    ),
    "Frontier Technology": (
        "You have deep expertise in frontier AI companies, autonomous systems, "
        "robotics, quantum computing, and other emerging technology verticals."
    ),
}


class IndustryResearchAgent(BaseAgent):
    ROLE = "Senior Industry Research Analyst"

    @property
    def PERSONA(self):
        base = (
            "You are a senior sell-side sector analyst with 15+ years of experience. "
            "You produce institutional-quality industry analysis with specific data points, "
            "not vague generalities. Every TAM estimate includes methodology. "
            "Every trend includes timing and magnitude."
        )
        domain_add = DOMAIN_SYSTEM_ADDITIONS.get(self.domain, "")
        return f"{base}\n\n{domain_add}"

    def run(self) -> dict:
        tam_analysis = self._research_call(
            f"For {self.company_name} ({self.ticker}) in the {self.domain} sector:\n\n"
            "1. TAM / SAM / SOM Analysis:\n"
            "   - Total addressable market with sizing methodology\n"
            "   - Serviceable addressable market for this company's product portfolio\n"
            "   - Market growth rate (CAGR) with timeframe and drivers\n\n"
            "2. Secular Trends:\n"
            "   - 3 tailwinds with magnitude and timing\n"
            "   - 2 headwinds with probability of impact\n\n"
            "3. Regulatory Environment:\n"
            "   - Key regulations affecting this sector\n"
            "   - Upcoming regulatory events (2025-2026)\n"
            "   - Export controls or geopolitical risks\n\n"
            "4. Technology Inflection Points:\n"
            "   - What technology shift is coming that could disrupt incumbents?\n"
            "   - What is this company's positioning for that shift?\n\n"
            "Use specific numbers. Label estimates with confidence level.",
            max_tokens=3000,
        )

        supply_chain_map = None
        if self.domain in ("AI Supply Chain", "Semiconductor Infrastructure", "Data Center Ecosystem"):
            supply_chain_map = self._research_call(
                f"Generate a supply chain dependency map for {self.company_name} ({self.ticker}):\n\n"
                "UPSTREAM (Suppliers):\n"
                "- List top 5 suppliers with % revenue exposure estimate\n"
                "- Single-source dependencies and alternatives\n"
                "- Geographic concentration risk\n\n"
                "DOWNSTREAM (Customers):\n"
                "- List top 5 customers with % revenue concentration\n"
                "- Customer HHI (Herfindahl-Hirschman Index) estimate\n"
                "- Customer purchasing pattern signals\n\n"
                "SECOND-ORDER BENEFICIARIES:\n"
                "- If this company's revenue grows 20%, which companies benefit?\n"
                "- If this company loses a major customer, who wins?\n\n"
                "COMPETITIVE SUBSTITUTES:\n"
                "- What products could displace this company's offerings?\n"
                "- Timeline for displacement risk\n\n"
                "Format as structured sections, not prose.",
                max_tokens=2500,
            )

        biotech_analysis = None
        if self.domain == "Biotechnology":
            biotech_analysis = self._research_call(
                f"For {self.company_name} ({self.ticker}) biotech analysis:\n\n"
                "PIPELINE ANALYSIS:\n"
                "- List all clinical-stage assets with phase, indication, mechanism\n"
                "- Probability of success for each (use historical PoS by phase/indication)\n"
                "- Key catalysts and expected timing\n\n"
                "REGULATORY PATHWAY:\n"
                "- FDA pathway for lead asset (standard/expedited/breakthrough)\n"
                "- PDUFA dates or expected submission timeline\n"
                "- Precedent approvals in this indication\n\n"
                "COMMERCIAL OPPORTUNITY:\n"
                "- Peak sales potential for lead asset\n"
                "- Standard of care disruption potential\n"
                "- Pricing dynamics and reimbursement risk\n\n"
                "COMPETITIVE LANDSCAPE:\n"
                "- Direct competitors and their trial status\n"
                "- First-mover vs. fast-follower dynamics\n\n"
                "PLATFORM VALUE:\n"
                "- Is the platform replicable across indications?\n"
                "- What is the option value of the pipeline?",
                max_tokens=3000,
            )

        result = {
            "tam_and_trends": tam_analysis,
            "supply_chain_map": supply_chain_map,
            "biotech_analysis": biotech_analysis,
        }
        self.output = result
        return result
