"""
LLM client factories — the only place SDK clients are constructed, so the API
key has exactly one path out of the configuration service and into a client.

Provider mapping for the platform:
  * Anthropic (Claude) → thesis generation, skeptical analysis, final report
  * OpenAI (GPT-4o-mini) → SEC filings, earnings/supply-chain extraction, graph
"""

from __future__ import annotations

from .config import ConfigError, get_settings


def get_anthropic_client():
    """Return an Anthropic client built from central config."""
    settings = get_settings().require("anthropic")
    try:
        import anthropic
    except ImportError as exc:  # pragma: no cover
        raise ConfigError(
            "The 'anthropic' package is not installed. Run: pip install -r requirements.txt"
        ) from exc
    return anthropic.Anthropic(api_key=settings.anthropic_api_key.reveal())


def get_openai_client():
    """Return an OpenAI client built from central config (used by extraction agents)."""
    settings = get_settings().require("openai")
    try:
        from openai import OpenAI
    except ImportError as exc:  # pragma: no cover
        raise ConfigError(
            "The 'openai' package is not installed. Run: pip install -r requirements.txt"
        ) from exc
    return OpenAI(api_key=settings.openai_api_key.reveal())
