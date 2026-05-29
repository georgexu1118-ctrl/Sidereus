"""
Non-sensitive configuration constants for the Equity Research OS.

Secrets and model selection are owned by the central configuration service in
``core/config.py``. API keys are intentionally NOT exposed from this module —
obtain them only through the service or the client factories:

    from core import get_settings
    settings = get_settings()
    settings.anthropic_api_key.reveal()      # raw value, at the SDK boundary

    from core.llm import get_anthropic_client, get_openai_client
"""

from __future__ import annotations

from core.config import get_settings

_settings = get_settings()

# ── Model selection (configurable via env; see .env.example) ────
PRIMARY_MODEL = _settings.primary_model      # Claude — deep reasoning agents
FAST_MODEL = _settings.fast_model            # Claude Sonnet — fast mode
OPENAI_MODEL = _settings.openai_model        # GPT-4o-mini — extraction agents

# ── Research domains ────────────────────────────────────────────
DOMAINS = [
    "AI Supply Chain",
    "Biotechnology",
    "Semiconductor Infrastructure",
    "Data Center Ecosystem",
    "Frontier Technology",
]

# ── Semiconductor sub-sectors for supply chain mapping ──────────
SEMICONDUCTOR_SUBSECTORS = [
    "Foundry",
    "Memory",
    "Networking",
    "Optical Interconnects",
    "Packaging",
    "Power Electronics",
    "Analog",
    "FPGA",
    "ASIC",
    "GPU Ecosystem",
]

# ── Report sections (in order) ──────────────────────────────────
REPORT_SECTIONS = [
    "executive_summary",
    "investment_thesis",
    "industry_overview",
    "company_overview",
    "competitive_positioning",
    "management_analysis",
    "financial_analysis",
    "valuation",
    "bull_case",
    "base_case",
    "bear_case",
    "catalysts",
    "risks",
    "variant_perception",
    "key_monitoring_indicators",
    "investment_conclusion",
    "appendix",
]

# ── Output directory ────────────────────────────────────────────
OUTPUT_DIR = str(_settings.output_dir)
