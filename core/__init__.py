"""Core services for the Equity Research OS: central configuration, secret
handling, log masking, and LLM client factories."""

from .config import (
    PROVIDERS,
    BASE_DIR,
    ConfigError,
    Settings,
    ValidationResult,
    get_settings,
    reload_settings,
    validate_or_exit,
)
from .llm import get_anthropic_client, get_openai_client
from .log_config import configure_logging
from .secrets import SecretMaskingFilter, SecretStr, mask_secret

__all__ = [
    "PROVIDERS",
    "BASE_DIR",
    "ConfigError",
    "Settings",
    "ValidationResult",
    "get_settings",
    "reload_settings",
    "validate_or_exit",
    "get_anthropic_client",
    "get_openai_client",
    "configure_logging",
    "SecretMaskingFilter",
    "SecretStr",
    "mask_secret",
]
