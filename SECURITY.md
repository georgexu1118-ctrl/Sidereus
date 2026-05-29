# Security & Secret Management

This document describes how **Sidereus / Equity Research OS** handles API keys
and other secrets. The guiding rule: **a secret value lives in exactly one
place at runtime — the environment — and reaches a client through exactly one
path — the central configuration service.**

## Where secrets live

| Context              | Source of secrets                                            |
| -------------------- | ------------------------------------------------------------ |
| Local development    | `.env` (and optional `.env.local`) — **gitignored**          |
| Vercel / production  | Project → Settings → **Environment Variables**               |
| CI                   | The CI provider's encrypted secrets store                    |

Precedence (highest wins): **real process env → `.env.local` → `.env`**.
`.env` files are loaded with `override=False`, so a value injected by the
platform is never overwritten by a file that slipped onto disk.

## Rules enforced by the code

1. **Stored in environment variables.** Nothing reads a hard-coded key.
   `core/config.py` is the only module that reads `os.environ` for keys.
2. **Never committed.** `.gitignore` excludes `.env` and `.env.*` (allowing
   only `.env.example`). `scripts/check_secrets.py` is a belt-and-suspenders
   guard that fails if an `.env` file is tracked or a raw key appears in any
   tracked file.
3. **Never exposed to the frontend.** `Settings.check_frontend_exposure()`
   raises a startup error if any secret-looking variable is defined under a
   browser-exposed prefix (`NEXT_PUBLIC_`, `VITE_`, `REACT_APP_`, `PUBLIC_`,
   `EXPO_PUBLIC_`). This Python backend is server-side only and must never be
   bundled into client code.
4. **Validated at startup.** `validate_or_exit()` checks that required keys are
   present and well-formed *before* any agent runs, and prints actionable
   errors instead of failing deep in an API call.
5. **Masked in logs.** Keys are wrapped in `SecretStr` (masked `repr`/`str`),
   and `configure_logging()` installs a `SecretMaskingFilter` that scrubs any
   registered key value from every log record. Masked form keeps the scheme
   (`sk-…`) and last 4 chars for correlation only.

## How to use a key in code

```python
from core import get_settings
key = get_settings().anthropic_api_key.reveal()   # only at the SDK boundary

# Preferred — let the factory build the client:
from core.llm import get_anthropic_client, get_openai_client
client = get_anthropic_client()
```

## Provider mapping

| Provider              | Env var             | Used for                                                        |
| --------------------- | ------------------- | --------------------------------------------------------------- |
| Anthropic (Claude)    | `ANTHROPIC_API_KEY` | thesis generation, skeptical analysis, final report             |
| OpenAI (GPT-4o-mini)  | `OPENAI_API_KEY`    | SEC filings, earnings & supply-chain extraction, graph building |

## If a key is exposed

Rotate it immediately:

- **Anthropic:** console.anthropic.com → API Keys → revoke + create new.
- **OpenAI:** platform.openai.com/api-keys → revoke + create new.

Then update `.env` locally and the Environment Variables in your deployment.
Committing a key — even to a private repo, even if later removed — counts as
exposure, because git history retains it.
