"""
Agent 4: Industry Research
Produces sector context, supply chain chokepoint analysis, TAM sizing,
OSINT-triangulated customer/supplier relationships, and second-order effects.

Methodology: Serenity Framework — find where the value chain concentrates,
map it with confidence tiers, identify what second/third-order plays emerge.
"""

from __future__ import annotations
from .base_agent import BaseAgent


class IndustryResearchAgent(BaseAgent):
    ROLE = "Senior Industry Research Analyst — Supply Chain Intelligence & OSINT"

    def run(self) -> dict:

        # ── 1. TAM and secular trends ──────────────────────────────
        tam_analysis = self._research_call(
            f"Produce a precise TAM and secular trend analysis for {self.company_name} ({self.ticker}) "
            f"in the {self.domain} sector.\n\n"

            "1. TAM SIZING WITH METHODOLOGY:\n"
            "   - Total addressable market: state the $ figure, the year, and EXACTLY how you calculated it\n"
            "     (bottom-up: units × ASP × market share, or top-down: capex × content-per-dollar)\n"
            "   - SAM (serviceable addressable market): what does this company specifically address?\n"
            "   - CAGR: with start/end year and 2 key assumptions driving the number\n"
            "   - Compare your TAM estimate to sell-side consensus — where do you diverge and why?\n\n"

            "2. SECULAR TAILWINDS (3, with magnitude and timing):\n"
            "   For each tailwind:\n"
            "   - Name it precisely (not 'AI growth' — name the specific technology transition)\n"
            "   - Quantify the magnitude: how many dollars of incremental TAM?\n"
            "   - Timing: when does this become material (2025 / 2026 / 2027)?\n"
            "   - Who SPECIFICALLY captures it in the supply chain?\n\n"

            "3. STRUCTURAL HEADWINDS (2, with probability of impact):\n"
            "   - Name the risk precisely\n"
            "   - Probability of material impact in next 12 months: X%\n"
            "   - Who is most vulnerable? Who is least vulnerable?\n\n"

            "4. TECHNOLOGY INFLECTION POINT:\n"
            "   - What is the single most important technology transition in this sector in 2025-2027?\n"
            "   - Who is positioned well for it? Who is at risk?\n"
            "   - At what point does the transition become investable (not just thematic)?\n\n"

            "5. SO WHAT? — The trade implication:\n"
            "   Given your TAM and trend analysis, what is the most asymmetric position in this sector "
            "   and why is it mispriced?\n\n"

            "Use confidence tiers: [CONFIRMED], [HIGH CONFIDENCE], [INFERRED], [SPECULATIVE]",
            max_tokens=3500,
        )

        # ── 2. Supply chain chokepoint analysis ───────────────────
        supply_chain_map = None
        if self.domain in ("AI Supply Chain", "Semiconductor Infrastructure",
                           "Data Center Ecosystem", "Frontier Technology"):
            supply_chain_map = self._research_call(
                f"Perform a supply chain chokepoint analysis for {self.company_name} ({self.ticker}).\n\n"

                "THE CHOKEPOINT QUESTION:\n"
                "Where does this company sit in the value chain, and is it a chokepoint?\n"
                "A chokepoint = sole or dual-source supply, multi-year qualification cycle, "
                "no viable near-term substitute, with growing demand behind it.\n\n"

                "UPSTREAM DEPENDENCIES — What does this company need to operate?\n"
                "For each major supplier:\n"
                "  • Name the supplier (not just 'foundry partner' — name TSMC, Samsung, etc.)\n"
                "  • % of COGS or production dependency\n"
                "  • Single-source vs. dual-source risk\n"
                "  • Lead time to qualify alternative if supplier fails\n"
                "  • Geographic concentration risk (Taiwan, Korea, China exposure)\n"
                "  • [Confidence tier]\n\n"

                "DOWNSTREAM CUSTOMERS — Who buys from this company?\n"
                "For each major customer (or inferred customer):\n"
                "  • Name the customer\n"
                "  • Revenue concentration estimate (% of total)\n"
                "  • Contract structure: spot, annual, multi-year?\n"
                "  • Customer's alternatives and switching cost assessment\n"
                "  • OSINT signals: any public evidence of relationship beyond official disclosure?\n"
                "    (Patent cross-references, conference slides, ecosystem partner lists,\n"
                "     geographic revenue patterns, unit volume matching)\n"
                "  • [Confidence tier for each customer]\n\n"

                "SECOND-ORDER BENEFICIARIES:\n"
                "If this company's revenue grows 30% next year, NAME the 3 companies that benefit most "
                "and explain the mechanism. Be specific — not 'the sector benefits.'\n\n"

                "COMPETITIVE DISPLACEMENT SIGNALS:\n"
                "Is there evidence that a competitor has LOST a customer relationship "
                "(removed from ecosystem lists, earnings call language changes, market share shift)? "
                "If so, who is taking the share? What is the evidence?\n\n"

                "QUALIFICATION AND RAMP TIMELINE:\n"
                "For key customer relationships (confirmed and inferred):\n"
                "  • Current stage: sampling / qualification / production ramp / full production\n"
                "  • Expected revenue ramp timeline\n"
                "  • What milestones to watch\n\n"

                "CHOKEPOINT VERDICT:\n"
                "Is this company a chokepoint? Rate: STRONG / MODERATE / WEAK / NOT A CHOKEPOINT\n"
                "Justify with specific evidence.\n"
                "If strong chokepoint: what is the correct risk premium, and is it priced in?",
                max_tokens=4000,
            )

        # ── 3. Biotech pipeline (biotech domain) ─────────────────
        biotech_analysis = None
        if self.domain == "Biotechnology":
            biotech_analysis = self._research_call(
                f"Produce a comprehensive pipeline and commercial analysis for {self.company_name} ({self.ticker}).\n\n"

                "PIPELINE OVERVIEW — ALL CLINICAL ASSETS:\n"
                "For each asset (most to least advanced):\n"
                "  • Drug name / program code\n"
                "  • Indication and patient population size (US + global)\n"
                "  • Mechanism of action (specific — not just 'targeted therapy')\n"
                "  • Phase and trial name\n"
                "  • Primary endpoint and statistical threshold\n"
                "  • PoS estimate with methodology (use historical rates + indication-specific adjustment)\n"
                "  • Key catalyst timing (data readout, filing, PDUFA)\n"
                "  • Peak sales estimate with methodology (prevalence × penetration × pricing)\n"
                "  • rNPV estimate ($B)\n"
                "  • [Confidence tier]\n\n"

                "LEAD ASSET DEEP DIVE:\n"
                "  • Differentiation vs. standard of care: what does it do better?\n"
                "    Be specific: % improvement in primary endpoint vs. comparator\n"
                "  • Competitive trial landscape: name every Phase 2/3 competitor\n"
                "  • First mover vs. fast follower dynamics\n"
                "  • Reimbursement path: is this orphan/rare or broad indication?\n"
                "    Expected WAC (wholesale acquisition cost) range\n\n"

                "REGULATORY PATHWAY:\n"
                "  • FDA designation(s) held: BTD, Fast Track, Orphan, Accelerated Approval\n"
                "  • PDUFA date or expected submission timeline\n"
                "  • Historical FDA precedent in this indication (last 5 approvals)\n"
                "  • Risk of Complete Response Letter (CRL): what data gaps exist?\n\n"

                "CASH AND RUNWAY:\n"
                "  • Cash position and burn rate\n"
                "  • Runway to next major catalyst: sufficient? (Yes / At risk / Critical)\n"
                "  • Likelihood of dilution before approval: X%\n\n"

                "NPV BRIDGE:\n"
                "Build a simple rNPV bridge for the top 3 assets:\n"
                "  Sum of rNPVs - debt + cash + net platform value = intrinsic value\n"
                "  Compare to current market cap: implied discount or premium?\n\n"

                "SO WHAT? — The trade:\n"
                "  What is the most asymmetric catalyst in the next 12 months?\n"
                "  What does the market currently price vs. what a positive readout would imply?",
                max_tokens=4000,
            )

        result = {
            "tam_and_trends": tam_analysis,
            "supply_chain_map": supply_chain_map,
            "biotech_analysis": biotech_analysis,
        }
        self.output = result
        return result
