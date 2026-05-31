Audit the codebase for accidentally committed API keys or secrets.

Executes: python scripts/check_secrets.py

Run this before every commit. Required by the security policy in SECURITY.md.

What it checks:
- API key patterns (sk-ant-*, sk-proj-*, etc.)
- Common secret variable names with values
- .env files accidentally staged

If it passes cleanly, it is safe to commit.
