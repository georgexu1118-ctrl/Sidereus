"""
Secret handling primitives: masking + a logging filter that scrubs known
secret values from any log record.

Design goals:
  * A revealed key value never appears in a repr/str/log by accident.
  * Masked form keeps the provider scheme (first 3 chars) and last 4 chars so
    operators can correlate "which key" without exposing it — the industry
    convention used by Stripe/AWS. The masked middle is fixed-width so the
    real length is not leaked.
"""

from __future__ import annotations

import logging
from typing import Iterable

_MASK_CHAR = "•"
_DEFAULT_SHOW_LAST = 4
_NOT_SET = "<not set>"


def mask_secret(value: "str | SecretStr | None", *, show_last: int = _DEFAULT_SHOW_LAST) -> str:
    """Return a safe-to-log representation of a secret.

    >>> mask_secret("sk-ant-EXAMPLE-not-a-real-key-value")
    'sk-…••••••alue'
    >>> mask_secret("")
    '<not set>'
    """
    if isinstance(value, SecretStr):
        value = value.reveal()
    if not value:
        return _NOT_SET
    if len(value) <= show_last + 3:
        # Too short to reveal any part without leaking most of it.
        return _MASK_CHAR * 8
    return f"{value[:3]}…{_MASK_CHAR * 6}{value[-show_last:]}"


class SecretStr:
    """A string wrapper whose repr/str are masked. Call ``.reveal()`` to get the
    raw value (only at the boundary where it is actually needed)."""

    __slots__ = ("_value",)

    def __init__(self, value: "str | SecretStr | None" = "") -> None:
        if isinstance(value, SecretStr):
            value = value.reveal()
        self._value = value or ""

    def reveal(self) -> str:
        """Return the raw secret. Use only when passing to an SDK/HTTP client."""
        return self._value

    def is_set(self) -> bool:
        return bool(self._value)

    def masked(self) -> str:
        return mask_secret(self._value)

    def __bool__(self) -> bool:
        return bool(self._value)

    def __repr__(self) -> str:
        return f"SecretStr({self.masked()!r})"

    def __str__(self) -> str:
        return self.masked()


class SecretMaskingFilter(logging.Filter):
    """Logging filter that replaces any registered secret value with its masked
    form in the rendered message — a last line of defense against accidental
    ``logger.info("key=%s", key)`` style leaks."""

    def __init__(self, secrets: Iterable["str | SecretStr"] = ()) -> None:
        super().__init__()
        self._secrets: list[str] = []
        for s in secrets:
            self.add(s)

    def add(self, value: "str | SecretStr") -> None:
        raw = value.reveal() if isinstance(value, SecretStr) else (value or "")
        # Ignore empties (replacing "" would corrupt every message) and very
        # short values (too noisy / collision-prone to scrub safely).
        if raw and len(raw) >= 8 and raw not in self._secrets:
            self._secrets.append(raw)

    def filter(self, record: logging.LogRecord) -> bool:  # noqa: A003 - logging API
        try:
            message = record.getMessage()
        except Exception:
            return True
        scrubbed = message
        for raw in self._secrets:
            if raw in scrubbed:
                scrubbed = scrubbed.replace(raw, mask_secret(raw))
        if scrubbed != message:
            record.msg = scrubbed
            record.args = ()
        return True
