"""
Agent 7: Competitive Intelligence
Maps competitive dynamics using supply chain archaeology, displacement signal
analysis, moat forensics, and confidence-tiered customer/competitor mapping.

Methodology: Serenity Framework — read what is NOT said, find the displacement,
identify where the moat is real vs. narrative, rate disruption timelines honestly.
"""

from __future__ import annotations
from .base_agent import BaseAgent


class CompetitiveIntelligenceAgent(BaseAgent):
    ROLE = "Competitive Intelligence & Supply Chain Displacement Analyst"

    def run(self) -> dict:

        # ── 1. Competitive landscape with displacement signals ────
        competitive_map = self._research_call(
            f"Produce a surgical competitive intelligence assessment for "
            f"{self.company_name} ({self.ticker}) in {self.domain}.\n\n"

            "COMPETITIVE LANDSCAPE:\n"
            "List every relevant competitor with:\n"
            "  • Company name + ticker\n"
            "  • Market share estimate (% of relevant market) with source and confidence tier\n"
            "  • Key product/technology advantage vs. disadvantage vs. {self.ticker}\n"
            "  • Revenue trajectory: gaining / holding / losing share? Evidence?\n"
            "  • Most dangerous competitive action in last 12 months\n\n"

            "DISPLACEMENT SIGNAL ANALYSIS — READ WHAT ISN'T SAID:\n"
            "This is the most valuable section. Apply the Serenity OSINT methodology:\n\n"
            "  WEBSITE ARCHAEOLOGY:\n"
            "  Has any competitor been REMOVED from ecosystem partner pages, customer lists,\n"
            "  or industry standard body membership pages? (Use Wayback Machine patterns)\n"
            "  A removed competitor = a displacement opportunity. Who is filling the gap?\n\n"
            "  EARNINGS CALL LANGUAGE FORENSICS:\n"
            "  Have any competitors mentioned 'supply constraints,' 'capacity allocation issues,'\n"
            "  'customer qualification delays,' or 'product transition headwinds'?\n"
            "  These are signals of competitive weakness. Who benefits?\n\n"
            "  VC FUNDING DISPLACEMENT:\n"
            "  Have competitors' major customers raised large funding rounds for\n"
            "  a competing technology? (e.g., hyperscaler backing of a startup\n"
            "  developing the same product in-house = future demand reduction)\n\n"
            "  HIRING PATTERN SIGNALS:\n"
            "  Are competitors hiring for capabilities they don't have?\n"
            "  (hiring = admission of current gap = 12-24 months to close)\n\n"

            "MARKET SHARE FORENSICS:\n"
            "  • Is there a measurable share shift happening? Evidence?\n"
            "  • What is the win rate vs. key competitors in RFQs/procurement?\n"
            "  • Which customer segments is each competitor strongest/weakest?\n"
            "  • Customer 'stickiness' — average customer tenure and renewal rate evidence\n\n"

            "NEW ENTRANT MAPPING:\n"
            "  • Who has entered this market in the last 24 months?\n"
            "  • Are they funded by potential customers of the incumbents?\n"
            "    (hyperscaler VC investment in a competing startup = strategic insourcing signal)\n"
            "  • Timeline for new entrant to reach qualification and production scale\n\n"

            "PRICING DYNAMICS:\n"
            "  • Is pricing power expanding or contracting? Evidence from price/volume mix?\n"
            "  • Has any competitor cut price aggressively? What does that signal about their\n"
            "    competitive position vs. product cycle?\n"
            "  • ASP trend for the industry: secular pressure or pricing power?\n\n"

            "COMPETITIVE VERDICT:\n"
            "  Who is winning and who is losing in this competitive landscape?\n"
            "  Rate {self.ticker}: GAINING SHARE / HOLDING / LOSING SHARE / STRUCTURAL DECLINE\n"
            "  What is the single biggest competitive threat in the next 18 months?\n"
            "  What would it take for a competitor to displace {self.ticker} in its primary market?",
            max_tokens=3500,
        )

        # ── 2. Moat forensics ─────────────────────────────────────
        moat_analysis = self._research_call(
            f"Perform a forensic moat assessment for {self.company_name} ({self.ticker}).\n\n"

            "Rate each moat source on: WIDE (10yr+) / NARROW (3-7yr) / THIN (1-3yr) / NONE\n"
            "Do NOT use generic descriptions. Use specific evidence.\n\n"

            "1. NETWORK EFFECTS:\n"
            "   Does each additional user/customer make the product more valuable for others?\n"
            "   Be specific: is this a genuine network effect or just scale?\n"
            "   Examples of real network effects: software ecosystems (CUDA has it),\n"
            "   marketplaces, platform businesses.\n"
            "   Examples of fake 'network effects': 'more customers = better relationships'\n\n"

            "2. SWITCHING COSTS — THE MOST UNDERRATED MOAT:\n"
            "   What are the SPECIFIC costs of switching away from this company's product?\n"
            "   Types: technical (re-qualification = 12-24 months at fabs),\n"
            "          financial (stranded investment in compatible tooling),\n"
            "          operational (staff retraining, workflow disruption),\n"
            "          contractual (multi-year supply agreements with penalties).\n"
            "   Evidence of switching costs: churn rate, contract length, customer tenure.\n"
            "   What would a customer have to spend to switch? Dollar estimate.\n\n"

            "3. COST ADVANTAGES:\n"
            "   Structural cost advantages: process know-how, proprietary manufacturing,\n"
            "   geographic location, raw material access, learning curve.\n"
            "   Can competitors replicate these with capital? Timeline?\n\n"

            "4. INTANGIBLE ASSETS:\n"
            "   Patents: how broad? When do key patents expire?\n"
            "   Regulatory approvals and certifications: is qualification itself a moat?\n"
            "     (FAA/FDA approvals, MIL-SPEC, hyperscaler qualification = 12-24 months)\n"
            "   Proprietary data or know-how accumulated over time\n\n"

            "5. EFFICIENT SCALE:\n"
            "   Is the addressable market so small that only 1-2 competitors can be profitable?\n"
            "   (This creates a structural barrier — rational new entrants avoid it)\n\n"

            "MOAT STRESS TEST:\n"
            "   What is the single event that would most rapidly erode the moat?\n"
            "   Probability of that event in 3 years: X%\n"
            "   What would the moat look like 5 years from now assuming current trajectory?\n\n"

            "OVERALL MOAT VERDICT:\n"
            "   WIDE / NARROW / NONE — with one-sentence justification\n"
            "   Is the stock priced as if the moat is wider or narrower than reality?",
            max_tokens=2500,
        )

        # ── 3. Disruption risk with timelines ────────────────────
        disruption_analysis = self._research_call(
            f"Assess disruption risk for {self.company_name} ({self.ticker}) with honest timelines.\n\n"

            "Do NOT produce a generic risk list. Produce a probability-weighted scenario tree.\n\n"

            "TECHNOLOGY DISRUPTION:\n"
            "  • Name the specific technology that could displace this company's product\n"
            "    (not 'new technology' — name it: CPO replaces pluggables, RISC-V challenges\n"
            "     Arm, GLP-1 disrupts the obesity surgery market, etc.)\n"
            "  • Current TRL (Technology Readiness Level): 1-9 scale\n"
            "  • Timeline to commercialization: near-term (0-2yr) / medium (3-5yr) / long (5yr+)\n"
            "  • Does management acknowledge this risk? (Yes/No/Partially)\n"
            "  • Is management's response credible? What evidence?\n"
            "  • Probability of material impact in 3 years: X%\n\n"

            "INSOURCING / VERTICAL INTEGRATION RISK:\n"
            "  Are major customers building the capability to produce this in-house?\n"
            "  (Google TPU, Amazon Trainium, Apple silicon, Tesla Dojo are examples of this)\n"
            "  Evidence of insourcing: VC investments, hiring patterns, patent filings by customer\n"
            "  Timeline: when does insourcing reach meaningful scale to reduce external spend?\n"
            "  How much of the addressable market is genuinely at risk vs. just threatening?\n\n"

            "CYCLICALITY VS. SECULAR — THE MOST DANGEROUS DISGUISE:\n"
            "  Is the current growth story genuinely secular or is it the up-leg of a cycle?\n"
            "  Evidence for secular: structural technology transition, capacity constraint,\n"
            "    multi-year committed capex, no historical precedent of this level of demand\n"
            "  Evidence for cyclical: inventory overhang possible, customer digestion risk,\n"
            "    capex decisions that are deferrable, historical pattern of boom/bust\n"
            "  Verdict: 70% secular / 30% cyclical or give your own split with evidence\n\n"

            "GEOPOLITICAL / REGULATORY DISRUPTION:\n"
            "  Specific regulation (not 'regulation risk'):\n"
            "  • Export control exposure: what % of revenue goes to restricted entities?\n"
            "  • Next 12-month regulatory event: what is it and when?\n"
            "  • China revenue dependency: is it declining or growing? What is management's plan?\n\n"

            "DISRUPTION PROBABILITY TABLE:\n"
            "  | Scenario | Probability (3yr) | Revenue Impact | Timeline |\n"
            "  List top 3 disruption scenarios with these columns filled in.",
            max_tokens=2500,
        )

        result = {
            "competitive_landscape": competitive_map,
            "moat_analysis": moat_analysis,
            "disruption_risks": disruption_analysis,
        }
        self.output = result
        return result
