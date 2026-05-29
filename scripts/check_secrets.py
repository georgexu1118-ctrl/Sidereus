"""
Pre-commit / CI guard: fail (exit 1) if secrets are about to be committed.

  * refuses to let any .env file (except .env.example) be git-tracked
  * scans tracked files for obvious API-key patterns

Usage:
    python scripts/check_secrets.py
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

KEY_PATTERNS = [
    re.compile(r"sk-ant-[A-Za-z0-9_\-]{20,}"),
    re.compile(r"sk-proj-[A-Za-z0-9_\-]{20,}"),
    re.compile(r"\bsk-[A-Za-z0-9]{32,}\b"),
]
# A match on a line containing any of these is treated as a known-safe
# placeholder or test fixture, not a live secret. "pragma: allowlist secret"
# is the detect-secrets convention for explicitly marking a safe line.
SAFE_MARKERS = ("xxxx", "your-key", "your_key", "<", "example", "pragma: allowlist secret")
SKIP_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif", ".pdf", ".ico", ".woff", ".woff2"}


def _git(*args: str) -> str:
    return subprocess.run(
        ["git", *args], cwd=ROOT, capture_output=True, text=True
    ).stdout


def _line_of(text: str, index: int) -> str:
    start = text.rfind("\n", 0, index) + 1
    end = text.find("\n", index)
    return text[start: end if end != -1 else len(text)]


def main() -> int:
    problems: list[str] = []
    tracked = [f for f in _git("ls-files").splitlines() if f]

    # 1) No .env files committed (except the template).
    for f in tracked:
        base = f.rsplit("/", 1)[-1]
        if base.startswith(".env") and base != ".env.example":
            problems.append(f"{f} is tracked by git but must never be committed.")

    # 2) No raw keys in tracked file contents.
    for f in tracked:
        path = ROOT / f
        if path.suffix.lower() in SKIP_SUFFIXES or not path.is_file():
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        flagged: str | None = None
        for pat in KEY_PATTERNS:
            for match in pat.finditer(text):
                if any(mk in _line_of(text, match.start()).lower() for mk in SAFE_MARKERS):
                    continue
                flagged = match.group(0)
                break
            if flagged:
                break
        if flagged:
            problems.append(f"Possible live API key in {f}: {flagged[:8]}… (masked)")

    if problems:
        print("SECRET CHECK FAILED:")
        for p in problems:
            print(f"  - {p}")
        return 1

    print("Secret check passed: no tracked secrets found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
