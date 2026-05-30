"""
Base agent class. All research agents inherit from this.
Each agent maintains its own conversation context and reasoning chain.

The persona and methodology are grounded in the Serenity Research Framework:
- Supply chain chokepoint identification
- OSINT triangulation for undisclosed relationships
- Explicit confidence tiering
- Second/third-order effect mapping
- "The trade" orientation in every output
"""

from __future__ import annotations
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from config import PRIMARY_MODEL, FAST_MODEL
from core.llm import get_anthropic_client
from core.research_methodology import (
    SERENITY_METHODOLOGY,
    CITRINI_WRITING_VOICE,
    get_domain_deep_context,
)
from typing import Any


class BaseAgent:
    """
    Foundation for every specialized research agent.
    Provides Claude API access, evidence accumulation, and structured output.
    """

    ROLE: str = "Research Analyst"

    def __init__(self, ticker: str, company_name: str, domain: str, use_fast_model: bool = False):
        self.ticker = ticker.upper()
        self.company_name = company_name
        self.domain = domain
        self.model = FAST_MODEL if use_fast_model else PRIMARY_MODEL
        self.client = get_anthropic_client()
        self.evidence: list[dict] = []
        self.output: dict[str, Any] = {}

    def _build_system_prompt(self) -> str:
        """
        Full Serenity Framework system prompt — methodology + domain context + voice.
        Every call to Claude gets this. It encodes the Citrini/Aleabitoreddit/SemiconSam
        analytical DNA so outputs are differentiated, not generic summaries.
        """
        return (
            "You are a senior research analyst at Sidereus Research — an AI-native equity\n"
            "research firm modelled on the analytical style of Citrini Research (cross-asset\n"
            "asymmetry, atoms vs bits, mechanical repricing), Aleabitoreddit (OSINT supply\n"
            "chain detective work, chokepoint identification), and SemiconSam (semiconductor\n"
            "supply chain technical precision, Korea tech depth).\n\n"
            f"Your role: {self.ROLE}\n"
            f"Company under analysis: {self.company_name} ({self.ticker})\n"
            f"Sector: {self.domain}\n\n"
            f"{SERENITY_METHODOLOGY}\n\n"
            f"{get_domain_deep_context(self.domain)}\n\n"
            f"{CITRINI_WRITING_VOICE}\n\n"
            "HARD RULES — violating these makes the output worthless:\n"
            "1. Specific numbers always. 'Significant' without a number = rewrite.\n"
            "2. Name every company, product, and executive. No 'a major hyperscaler.'\n"
            "3. Confidence tier on every claim. [CONFIRMED] [HIGH] [MEDIUM] [INFERRED] [SPECULATIVE]\n"
            "4. Every section answers 'so what?' — not just presents information.\n"
            "5. Always end with 'The Trade' — what is the position and why now?\n"
            "6. Flag when a thesis is unpopular or contrarian. That's a feature, not a bug.\n"
        )

    def _call(self, system: str, messages: list[dict], max_tokens: int = 4096) -> str:
        """Single Claude API call with explicit system prompt."""
        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system,
            messages=messages,
        )
        return response.content[0].text

    def _research_call(self, task_description: str, context: str = "", max_tokens: int = 4096) -> str:
        """
        Core research call using the full Serenity methodology system prompt.
        """
        system = self._build_system_prompt()
        user_content = task_description
        if context:
            user_content = f"Context from prior agents:\n{context}\n\n{task_description}"

        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user_content}],
        )
        result = response.content[0].text
        self.evidence.append({
            "agent": self.__class__.__name__,
            "task": task_description[:120],
            "result": result,
        })
        return result

    def add_evidence(self, source: str, content: str):
        self.evidence.append({"source": source, "content": content})

    def run(self) -> dict[str, Any]:
        raise NotImplementedError("Each agent must implement run()")

    def summary(self) -> str:
        return f"[{self.__class__.__name__}] {len(self.evidence)} evidence items collected for {self.ticker}"
