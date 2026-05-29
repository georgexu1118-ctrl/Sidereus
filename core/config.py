"""
Central configuration service for the Equity Research OS.

This is the single source of truth for secrets and runtime configuration.
Nothing else in the codebase should read ``os.environ`` for an API key — it
goes through :func:`get_settings`.

Secret precedence (highest wins):
    real process env (Vercel / Docker / shell)  >  .env.local  >  .env

``load_dotenv(override=False)`` guarantees that a value already injected by the
platform is never clobbered by a file that slipped onto disk.
"""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - dotenv is a declared dependency
    def load_dotenv(*_args, **_kwargs):  # type: ignore[misc]
        return False

from .secrets import SecretStr

# Project root = the directory that contains the ``core`` package.
BASE_DIR = Path(__file__).resolve().parent.parent


class ConfigError(RuntimeError):
    """Raised when required configuration is missing or invalid."""


@dataclass(frozen=True)
class ProviderSpec:
    key: str
    label: str
    env_var: str
    expected_prefixes: tuple[str, ...]
    purpose: str
    required: bool


# Provider → which model / which jobs, per the platform's task mapping.
PROVIDERS: dict[str, ProviderSpec] = {
    "anthropic": ProviderSpec(
        key="anthropic",
        label="Anthropic (Claude)",
        env_var="ANTHROPIC_API_KEY",
        expected_prefixes=("sk-ant-",),
        purpose="thesis generation, skeptical analysis, final report synthesis",
        required=True,
    ),
    "openai": ProviderSpec(
        key="openai",
        label="OpenAI (GPT-4o-mini)",
        env_var="OPENAI_API_KEY",
        expected_prefixes=("sk-proj-", "sk-"),
        purpose="SEC filing parsing, earnings extraction, supply-chain extraction, graph building",
        required=False,
    ),
}

# Prefixes that bundlers expose to the browser. A secret must NEVER live under
# one of these — it would ship to every client.
_CLIENT_EXPOSED_PREFIXES = ("NEXT_PUBLIC_", "VITE_", "REACT_APP_", "PUBLIC_", "EXPO_PUBLIC_")
_SECRET_TOKENS = ("KEY", "SECRET", "TOKEN", "PASSWORD", "PRIVATE")


@dataclass
class ValidationResult:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.errors


def _env(name: str, default: str = "") -> str:
    value = os.getenv(name)
    return value if value is not None else default


# Variables this service owns. An empty-string value for one of these (which
# some shells/containers export) is treated as *unset* so a .env file can fill
# it — an empty string is never a meaningful credential.
_MANAGED_ENV_VARS = (
    "ANTHROPIC_API_KEY",
    "OPENAI_API_KEY",
    "ANTHROPIC_PRIMARY_MODEL",
    "ANTHROPIC_FAST_MODEL",
    "OPENAI_MODEL",
    "APP_ENV",
    "OUTPUT_DIR",
)


def _load_env_files() -> None:
    """Populate the environment from local .env files for development.

    No-op in practice on managed platforms (the files do not exist there and,
    even if they did, ``override=False`` keeps the platform's real values)."""
    for name in _MANAGED_ENV_VARS:
        if os.environ.get(name) == "":
            del os.environ[name]
    load_dotenv(BASE_DIR / ".env.local", override=False)
    load_dotenv(BASE_DIR / ".env", override=False)


@dataclass(frozen=True)
class Settings:
    environment: str
    is_vercel: bool
    anthropic_api_key: SecretStr
    openai_api_key: SecretStr
    primary_model: str
    fast_model: str
    openai_model: str
    output_dir: Path

    # ── accessors ───────────────────────────────────────────
    def key_for(self, provider: str) -> SecretStr:
        if provider == "anthropic":
            return self.anthropic_api_key
        if provider == "openai":
            return self.openai_api_key
        raise ConfigError(f"Unknown provider: {provider!r}")

    @property
    def is_production(self) -> bool:
        return self.environment == "production" or self.is_vercel

    def secret_values(self) -> list[str]:
        """Raw key values, for registering with the log-masking filter."""
        return [k.reveal() for k in (self.anthropic_api_key, self.openai_api_key) if k.is_set()]

    def masked_dict(self) -> dict[str, str]:
        """Safe-to-print snapshot of configuration (keys are masked)."""
        return {
            "environment": self.environment,
            "is_vercel": str(self.is_vercel),
            "ANTHROPIC_API_KEY": self.anthropic_api_key.masked(),
            "OPENAI_API_KEY": self.openai_api_key.masked(),
            "primary_model": self.primary_model,
            "fast_model": self.fast_model,
            "openai_model": self.openai_model,
        }

    # ── validation ──────────────────────────────────────────
    def validate(self, require: tuple[str, ...] = ("anthropic",)) -> ValidationResult:
        """Collect every configuration problem in one pass.

        A provider is an *error* if it is missing and either declared
        ``required`` or named in ``require``; otherwise a missing key is a
        *warning*. A present-but-wrong-looking prefix is always a warning."""
        errors: list[str] = []
        warnings: list[str] = []

        for pkey, spec in PROVIDERS.items():
            key = self.key_for(pkey)
            must_have = spec.required or pkey in require
            if not key.is_set():
                msg = f"{spec.label}: {spec.env_var} is not set (needed for {spec.purpose})."
                (errors if must_have else warnings).append(msg)
                continue
            if spec.expected_prefixes and not key.reveal().startswith(spec.expected_prefixes):
                warnings.append(
                    f"{spec.label}: {spec.env_var} does not start with "
                    f"{' or '.join(spec.expected_prefixes)} — double-check the value."
                )

        errors.extend(self.check_frontend_exposure())
        return ValidationResult(errors=errors, warnings=warnings)

    def check_frontend_exposure(self) -> list[str]:
        """Block any secret-looking value placed under a client-exposed prefix."""
        problems: list[str] = []
        for name in os.environ:
            upper = name.upper()
            if upper.startswith(_CLIENT_EXPOSED_PREFIXES) and any(t in upper for t in _SECRET_TOKENS):
                problems.append(
                    f"Env var {name!r} uses a browser-exposed prefix but looks like a secret. "
                    "Frontend-prefixed variables are bundled into the client — remove the public "
                    "prefix and keep the secret server-side only."
                )
        return problems

    def require(self, *providers: str) -> "Settings":
        """Hard-require providers; raise :class:`ConfigError` listing any missing."""
        missing = [PROVIDERS[p].env_var for p in providers if not self.key_for(p).is_set()]
        if missing:
            raise ConfigError(
                "Missing required configuration: "
                + ", ".join(missing)
                + ". Set them in .env (local dev) or your deployment's environment variables."
            )
        return self


def _build_settings() -> Settings:
    _load_env_files()
    is_vercel = bool(os.getenv("VERCEL") or os.getenv("VERCEL_ENV"))
    environment = (_env("APP_ENV") or _env("NODE_ENV") or ("production" if is_vercel else "development")).lower()
    return Settings(
        environment=environment,
        is_vercel=is_vercel,
        anthropic_api_key=SecretStr(_env("ANTHROPIC_API_KEY")),
        openai_api_key=SecretStr(_env("OPENAI_API_KEY")),
        primary_model=_env("ANTHROPIC_PRIMARY_MODEL", "claude-opus-4-8"),
        fast_model=_env("ANTHROPIC_FAST_MODEL", "claude-sonnet-4-6"),
        openai_model=_env("OPENAI_MODEL", "gpt-4o-mini"),
        output_dir=Path(_env("OUTPUT_DIR", str(BASE_DIR / "output"))),
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the process-wide settings singleton (cached)."""
    return _build_settings()


def reload_settings() -> Settings:
    """Clear the cache and rebuild — useful in tests."""
    get_settings.cache_clear()
    return get_settings()


def validate_or_exit(printer=None, require: tuple[str, ...] = ("anthropic",)) -> Settings:
    """Validate configuration at startup.

    Prints warnings, and on a fatal problem prints actionable guidance and
    exits with code 1. ``printer`` may be a ``rich.Console``; otherwise the
    builtin ``print`` is used.
    """
    settings = get_settings()
    result = settings.validate(require=require)

    use_rich = printer is not None
    emit = printer.print if use_rich else print

    for w in result.warnings:
        emit(f"[yellow]⚠ {w}[/yellow]" if use_rich else f"WARNING: {w}")

    if not result.ok:
        emit("[bold red]✗ Configuration error — cannot start:[/bold red]" if use_rich
             else "Configuration error — cannot start:")
        for e in result.errors:
            emit(f"  [red]•[/red] {e}" if use_rich else f"  - {e}")
        emit("")
        emit("Fix: copy .env.example to .env and fill in real keys for local dev, or set the "
             "variables in your deployment environment (e.g. Vercel → Settings → Environment Variables).")
        sys.exit(1)

    return settings
