"""
Logging setup that installs a :class:`SecretMaskingFilter` so that no
registered secret value can appear in log output, regardless of which module
emits it.
"""

from __future__ import annotations

import logging

from .config import get_settings
from .secrets import SecretMaskingFilter

_mask_filter: SecretMaskingFilter | None = None


def configure_logging(level: int = logging.INFO) -> SecretMaskingFilter:
    """Configure root logging with secret masking. Idempotent."""
    global _mask_filter

    settings = get_settings()
    if _mask_filter is None:
        _mask_filter = SecretMaskingFilter(settings.secret_values())
    else:
        for value in settings.secret_values():
            _mask_filter.add(value)

    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s"))
    handler.addFilter(_mask_filter)

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers = [handler]
    root.addFilter(_mask_filter)  # also covers records logged directly at root
    return _mask_filter
