"""
Base agent class. All research agents inherit from this.
Each agent maintains its own conversation context and reasoning chain.
"""

from __future__ import annotations
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from config import PRIMARY_MODEL, FAST_MODEL
from core.llm import get_anthropic_client
from typing import Any


class BaseAgent:
    """
    Foundation for every specialized research agent.
    Provides Claude API access, evidence accumulation, and structured output.
    """

    ROLE: str = "Research Analyst"
    PERSONA: str = (
        "You are a senior analyst at a top-tier institutional investment research firm. "
        "You think rigorously, cite evidence, and never speculate beyond what data supports."
    )

    def __init__(self, ticker: str, company_name: str, domain: str, use_fast_model: bool = False):
        self.ticker = ticker.upper()
        self.company_name = company_name
        self.domain = domain
        self.model = FAST_MODEL if use_fast_model else PRIMARY_MODEL
        self.client = get_anthropic_client()
        self.evidence: list[dict] = []
        self.output: dict[str, Any] = {}

    def _call(self, system: str, messages: list[dict], max_tokens: int = 4096) -> str:
        """Single Claude API call with system prompt."""
        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system,
            messages=messages,
        )
        return response.content[0].text

    def _research_call(self, task_description: str, context: str = "", max_tokens: int = 4096) -> str:
        """
        Standard research call that prepends agent persona and task framing.
        Uses prompt caching on the system prompt for repeated calls.
        """
        system = (
            f"{self.PERSONA}\n\n"
            f"Your role: {self.ROLE}\n"
            f"Company under analysis: {self.company_name} ({self.ticker})\n"
            f"Sector: {self.domain}\n\n"
            "Produce institutional-quality analysis. "
            "Every claim must be grounded in evidence or clearly labeled as judgment. "
            "Think like Goldman Sachs or Morgan Stanley sector specialists."
        )

        user_content = task_description
        if context:
            user_content = f"Context:\n{context}\n\n{task_description}"

        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user_content}],
        )
        result = response.content[0].text
        self.evidence.append({"agent": self.__class__.__name__, "task": task_description[:120], "result": result})
        return result

    def add_evidence(self, source: str, content: str):
        self.evidence.append({"source": source, "content": content})

    def run(self) -> dict[str, Any]:
        raise NotImplementedError("Each agent must implement run()")

    def summary(self) -> str:
        return f"[{self.__class__.__name__}] {len(self.evidence)} evidence items collected for {self.ticker}"
