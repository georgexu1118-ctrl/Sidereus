"""
Agent 9: Skeptical Analyst (Devil's Advocate)
Attacks every bullish thesis. Finds what consensus is missing.
The most important agent in the system — prevents groupthink.

Methodology: Applies all three Serenity thesis killers:
1. Multi-sourcing risk (will the customer diversify away?)
2. Technology bypass (is there a parallel path that makes this irrelevant?)
3. Cyclicality disguised as secular (is this just the up-leg of a cycle?)

Plus: OSINT-based bear case construction and variant perception identification.
"""

from __future__ import annotations
from .base_agent import BaseAgent


class SkepticalAnalystAgent(BaseAgent):
    ROLE = "Skeptical Analyst — Thesis Destroyer / Variant Perception Generator"

    def __init__(self, ticker, company_name, domain, bull_thesis: str = "", use_fast_model=False):
        super().__init__(ticker, company_name, domain, use_fast_model)
        self.bull_thesis = bull_thesis

    def run(self) -> dict:

        # ── 1. Thesis attack ──────────────────────────────────────
        thesis_attack = self._research_call(
            f"You must destroy the bull case for {self.company_name} ({self.ticker}).\n\n"
            "THE BULL THESIS TO DEMOLISH:\n"
            f"{self.bull_thesis if self.bull_thesis else '[Construct and attack the most commonly cited bull case for this company]'}\n\n"

            "Apply the three Serenity Thesis Killers first, then expand:\n\n"

            "THESIS KILLER 1 — MULTI-SOURCING / COMPETITIVE QUALIFICATION:\n"
            "   The hyperscaler/customer doesn't want a single supplier. They WILL qualify alternatives.\n"
            "   • Who are the 2-3 alternative suppliers being evaluated right now?\n"
            "   • What is the qualification timeline for alternatives? (12-24 months is typical)\n"
            "   • Has the customer publicly signaled a dual-source strategy? Evidence?\n"
            "   • When multi-sourcing completes, what happens to this company's pricing power?\n"
            "   • Historical examples of hyperscalers successfully dual-sourcing a key component\n\n"

            "THESIS KILLER 2 — TECHNOLOGY BYPASS:\n"
            "   Is there a parallel technology path being funded that makes this product unnecessary?\n"
            "   • Name the specific technology (not 'future technology')\n"
            "   • Who is funding it? (VC, hyperscaler strategic investment, DARPA)\n"
            "   • What is the realistic commercialization timeline?\n"
            "   • At what point does it become a credible threat vs. just a narrative?\n"
            "   • The bull says 'we have a 3-year lead.' Is that lead durable? Why / why not?\n\n"

            "THESIS KILLER 3 — CYCLICALITY DISGUISED AS SECULAR:\n"
            "   What if this is just an inventory/capex cycle, not a structural transition?\n"
            "   • What does the historical demand pattern look like for this category?\n"
            "   • Are there early signs of customer inventory digestion?\n"
            "   • What would 'demand deceleration' look like in the numbers, and when would we see it?\n"
            "   • What are the leading indicators that the cycle is turning?\n"
            "   • The bull says 'this time is different.' Why might that be wrong?\n\n"

            "WRONG ASSUMPTIONS DEEP DIVE:\n"
            "   For each major assumption in the bull case:\n"
            "   • State the assumption explicitly\n"
            "   • What evidence contradicts it?\n"
            "   • What is the base rate for this assumption being correct in similar situations?\n"
            "   • What is the downside if the assumption is wrong?\n\n"

            "CONSENSUS BLIND SPOTS:\n"
            "   What specific risk is consensus not pricing?\n"
            "   • Not a generic risk — give a specific scenario with a probability estimate\n"
            "   • Why is the market ignoring this?\n"
            "   • What would need to happen for the market to pay attention?\n\n"

            "MANAGEMENT CREDIBILITY FORENSICS:\n"
            "   • Has management made claims on earnings calls that proved false? Specific examples.\n"
            "   • Are there signs of sandbagging (consistently beating guidance)? How much?\n"
            "   • Has management issued equity at high multiples? (Suggests they think stock is expensive)\n"
            "   • Insider selling patterns over the last 12 months — what do they signal?\n\n"

            "VALUATION FORENSICS:\n"
            "   • What does the current price imply for revenue/earnings in 5 years?\n"
            "   • Is that implied scenario plausible? What probability do you assign?\n"
            "   • What is the 'priced for perfection' level — and how close are we?\n"
            "   • Identify the most dangerous valuation air pocket\n\n"

            "BE AGGRESSIVE. BE SPECIFIC. If you cannot name the competitor, customer, or technology\n"
            "you are concerned about, your analysis is not yet sharp enough.",
            max_tokens=4000,
        )

        # ── 2. Bear case construction ─────────────────────────────
        bear_case_construction = self._research_call(
            f"Construct the strongest internally consistent bear case for {self.company_name} ({self.ticker}).\n\n"

            "A strong bear case is NOT a list of risks.\n"
            "It is a NARRATIVE — a sequence of events with causality, timing, and financial outcomes.\n\n"

            "STRUCTURE:\n"
            "  INITIAL CATALYST: What specific event starts the bear thesis unfolding?\n"
            "  (Not 'macro headwinds' — a specific event: customer announces insourcing,\n"
            "   competitor qualifies with hyperscaler, earnings miss reveals demand deceleration,\n"
            "   FDA CRL, export control expansion, etc.)\n\n"

            "  FUNDAMENTAL DETERIORATION: How does the initial catalyst cascade?\n"
            "  • Revenue impact: which segment, which quarter, by how much?\n"
            "  • Margin impact: does pricing compress? By how many basis points?\n"
            "  • Multiple compression: what does the stock trade at when the narrative breaks?\n"
            "  • Management response: do they cut guidance? Does that trigger further selling?\n\n"

            "  MARKET REACTION: How does the stock respond?\n"
            "  • What price does the stock trade to?\n"
            "  • What is the % drawdown from current levels?\n"
            "  • Timeline: how long does it take to play out?\n\n"

            "  BEAR CASE PRICE TARGET:\n"
            "  • Methodology: what multiple on what earnings/revenue in what year?\n"
            "  • Comparable: what company traded at a similar multiple during a similar narrative break?\n\n"

            "  PROBABILITY: What probability do you assign to this bear case in 12 months? X%\n"
            "  (Be honest. If the bull case is strong, the bear probability might be 20-30%)\n\n"

            "  THE BEAR CASE IN ONE SENTENCE: If you had to summarize why this stock could fall 40%,\n"
            "  what would you say?",
            max_tokens=2500,
        )

        # ── 3. Variant perception ─────────────────────────────────
        variant_perception = self._research_call(
            f"Identify the variant perception on {self.company_name} ({self.ticker}).\n\n"

            "A variant perception is a VIEW that:\n"
            "  • Differs MATERIALLY from consensus (not a minor nuance)\n"
            "  • Is supported by evidence that consensus is ignoring or dismissing\n"
            "  • If correct, produces 50%+ alpha (this is the hurdle)\n"
            "  • Has a defined resolution catalyst (when will the market recognize it?)\n\n"

            "FORMAT — ANSWER EACH PRECISELY:\n\n"

            "THE CONSENSUS VIEW:\n"
            "What does the street believe about this company's key value driver?\n"
            "(Not a straw man — state the actual bull case as bulls would state it)\n\n"

            "WHY CONSENSUS MIGHT BE WRONG:\n"
            "What specific evidence are bulls ignoring or discounting?\n"
            "Use: supply chain signals, OSINT data points, technical analysis of product specs,\n"
            "historical analogues, forensic accounting signals, or structural market dynamics.\n\n"

            "THE VARIANT PERCEPTION — TWO OPTIONS:\n\n"
            "Option A: THE BULL VARIANT (consensus is too bearish):\n"
            "  What does consensus underestimate? What is the unpriced positive?\n"
            "  Specific: 'Consensus models X% market share; we believe Y% is achievable because Z'\n"
            "  Not just higher: why is the company worth MORE than consensus thinks?\n\n"

            "Option B: THE BEAR VARIANT (consensus is too bullish):\n"
            "  What does consensus overestimate? What structural risk is not priced?\n"
            "  Specific: 'Consensus assumes X customer relationship persists; OSINT signals suggest\n"
            "  qualification of alternative supplier is underway at [evidence]'\n\n"

            "STATE WHICH VARIANT YOU HOLD AND WHY IT IS ACTIONABLE NOW:\n"
            "  • Why is the market wrong RIGHT NOW (not in 5 years)?\n"
            "  • What is the near-term catalyst (6-18 months) that forces realization?\n"
            "  • How do you size the position given the variant conviction?\n"
            "  • What data point would CONFIRM the variant is correct?\n"
            "  • What data point would DENY it?\n\n"

            "THE VARIANT IN ONE SENTENCE:\n"
            "'The market believes X. We believe Y. The gap closes when Z happens.'",
            max_tokens=2500,
        )

        result = {
            "thesis_attack": thesis_attack,
            "bear_case": bear_case_construction,
            "variant_perception": variant_perception,
        }
        self.output = result
        return result
