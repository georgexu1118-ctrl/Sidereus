"""Tests for the secret-management layer: masking, validation, frontend-exposure
guard, and the logging filter. No network or real keys required."""

from __future__ import annotations

import logging

from core import config as cfg
from core.secrets import SecretMaskingFilter, SecretStr, mask_secret


def _settings(anthropic: str = "", openai: str = "") -> cfg.Settings:
    return cfg.Settings(
        environment="development",
        is_vercel=False,
        anthropic_api_key=SecretStr(anthropic),
        openai_api_key=SecretStr(openai),
        primary_model="m",
        fast_model="m",
        openai_model="m",
        output_dir=cfg.BASE_DIR / "output",
    )


# ── masking ─────────────────────────────────────────────────────
def test_mask_hides_value_but_keeps_correlation_tail():
    secret = "sk-ant-api03-ABCDEFG1234567890XYZ"  # pragma: allowlist secret (fake)
    masked = mask_secret(secret)
    assert secret not in masked
    assert masked.startswith("sk-")
    assert masked.endswith("0XYZ")


def test_mask_empty_is_not_set():
    assert mask_secret("") == "<not set>"
    assert mask_secret(None) == "<not set>"


def test_mask_short_value_is_fully_hidden():
    assert "abc" not in mask_secret("abcd")


def test_secretstr_repr_and_str_are_masked():
    s = SecretStr("sk-ant-supersecretvalue1234")  # pragma: allowlist secret (fake)
    assert "supersecret" not in repr(s)
    assert "supersecret" not in str(s)
    assert s.reveal() == "sk-ant-supersecretvalue1234"  # pragma: allowlist secret (fake)


# ── validation ──────────────────────────────────────────────────
def test_missing_required_anthropic_is_error():
    result = _settings().validate(require=("anthropic",))
    assert not result.ok
    assert any("ANTHROPIC_API_KEY" in e for e in result.errors)


def test_present_keys_pass():
    result = _settings("sk-ant-test123456", "sk-proj-test123456").validate(require=("anthropic",))
    assert result.ok, result.errors


def test_wrong_prefix_is_warning_not_error():
    result = _settings("not-a-real-prefix-123456").validate(require=("anthropic",))
    assert result.ok  # present, so not fatal
    assert any("does not start with" in w for w in result.warnings)


def test_frontend_exposed_secret_is_blocked(monkeypatch):
    monkeypatch.setenv("NEXT_PUBLIC_ANTHROPIC_API_KEY", "sk-ant-leak-to-browser")
    result = _settings("sk-ant-test123456").validate(require=("anthropic",))
    assert not result.ok
    assert any("browser-exposed" in e for e in result.errors)


def test_require_raises_for_missing_provider():
    import pytest

    with pytest.raises(cfg.ConfigError):
        _settings("sk-ant-test123456").require("openai")


# ── logging filter ──────────────────────────────────────────────
def test_logging_filter_scrubs_secret():
    secret = "sk-ant-supersecret-DEADBEEF12345"  # pragma: allowlist secret (fake)
    flt = SecretMaskingFilter([secret])
    record = logging.LogRecord(
        name="t", level=logging.INFO, pathname=__file__, lineno=1,
        msg="leaking key=%s now", args=(secret,), exc_info=None,
    )
    flt.filter(record)
    assert secret not in record.getMessage()
