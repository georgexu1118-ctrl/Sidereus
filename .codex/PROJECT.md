# Sidereus — Codex Project

Workspace for continuing work on:

- **Repository:** https://github.com/georgexu1118-ctrl/Sidereus
- **Live app:** https://sidereus-nuncius.vercel.app/

## First Context File

Load `.codex/memory/sidereus-project-summary.md` when resuming this project.

## Agent Docs

The canonical reference for this codebase is **`AGENTS.md`** at the repository root.
It covers architecture, tech stack, development workflow, deployment, conventions, and constraints.

Claude Code-specific configuration lives in **`CLAUDE.md`** (root) and **`.claude/`**.

## Codex-Specific Notes

- The project is a Python + Next.js monorepo. Python deps are in `requirements.txt`; frontend deps in `frontend/package.json` (managed via root `package.json` with `--prefix frontend`).
- The Python CLI (`main.py`) requires `ANTHROPIC_API_KEY` and optionally `OPENAI_API_KEY`. Set these in `.env` (never commit).
- The frontend auto-deploys to Vercel on push to `main`. Environment variables are managed in the Vercel dashboard.
- Two product modes exist and must remain distinct — see `AGENTS.md` §1 for the full explanation.
- Run `python scripts/check_secrets.py` before every commit.
