# Migration Report — Sidereus Multi-Agent Setup

**Date:** 2026-05-31  
**Scope:** Migrate from informal `.codex/` working notes to a clean, production-grade multi-agent configuration.

---

## 1. What Was Found

### Existing Files

| File | Status | Notes |
|------|--------|-------|
| `.codex/PROJECT.md` | Existed | Brief Codex working notes — 15 lines |
| `.codex/memory/sidereus-project-summary.md` | Existed | Codex project summary — 89 lines, good content |
| `.codex/outputs/` | Existed | Codex working artifacts |
| `.codex/work/` | Existed | Codex working artifacts |
| `AGENTS.md` | Missing | Not present anywhere in the repo |
| `CLAUDE.md` | Missing | Not present anywhere in the repo |
| `.claude/` | Missing | No Claude Code configuration |
| `.claude/settings.json` | Missing | No permission configuration |
| `.claude/commands/` | Missing | No custom commands |

### Observations

1. **No canonical agent documentation existed.** Neither `AGENTS.md` nor `CLAUDE.md` were present. All agent knowledge was scattered across `README.md`, `SECURITY.md`, and Codex working memory files.

2. **Claude Code and Codex instructions were intermixed in `.codex/`.** The `.codex/PROJECT.md` and `.codex/memory/` were being used as a general project context store for both agents.

3. **The `.codex/memory/sidereus-project-summary.md` was the best single source of truth** — it captured the two-product-mode distinction and all key features accurately.

4. **No custom Claude Code commands existed.** Common workflows (running a research report, auditing secrets) had no shortcuts.

5. **No Claude Code permission configuration.** Every `pytest`, `npm run dev`, or `git status` call would trigger a user approval prompt.

6. **No git repository in the Codex sandbox.** The sandbox at `C:\Users\georg\Documents\Codex\2026-05-31\...` is a Codex-managed copy, not a git worktree.

---

## 2. What Was Created

### New Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | Canonical multi-agent reference — 9 sections, full architecture |
| `CLAUDE.md` | Claude Code operational guide — concise, actionable |
| `.claude/commands/research.md` | `/research` custom command |
| `.claude/commands/check-secrets.md` | `/check-secrets` custom command |
| `.claude/settings.template.json` | Permission allow-list template (see §4) |

### Updated Files

| File | Change |
|------|--------|
| `.codex/PROJECT.md` | Replaced 15-line working notes with structured Codex config pointing to `AGENTS.md` |
| `.codex/memory/sidereus-project-summary.md` | Expanded with two-product-mode table, Serenity Framework section, security summary |

---

## 3. File Roles After Migration

```
Sidereus/
├── AGENTS.md                    ← Canonical reference for ALL agents (Codex, Claude Code, others)
├── CLAUDE.md                    ← Claude Code operational guide (commands, quick-ref, rules)
├── .claude/
│   ├── settings.template.json   ← Rename to settings.json to activate (see §4)
│   └── commands/
│       ├── research.md          ← /research TICKER [--fast] [--domain ...]
│       └── check-secrets.md     ← /check-secrets
└── .codex/
    ├── PROJECT.md               ← Codex session config — points to AGENTS.md
    └── memory/
        └── sidereus-project-summary.md   ← Codex project memory (enriched)
```

### Responsibility Split

| Concern | File |
|---------|------|
| Full architecture, workflows, conventions | `AGENTS.md` |
| Claude Code commands & quick-reference | `CLAUDE.md` |
| Claude Code permissions | `.claude/settings.json` (after rename) |
| Claude Code custom slash commands | `.claude/commands/*.md` |
| Codex session startup | `.codex/PROJECT.md` |
| Codex project memory | `.codex/memory/sidereus-project-summary.md` |

---

## 4. Action Required — `.claude/settings.json`

The auto-mode classifier blocked writing `.claude/settings.json` with Bash permission allow-lists because it treats this as an agent self-modifying its own permissions. Since this is a project-level settings file (not global), you need to create it manually.

**Steps:**
```bash
# In the Sidereus project root
cp .claude/settings.template.json .claude/settings.json
```

Or create `.claude/settings.json` with the contents of `.claude/settings.template.json`.

This enables Claude Code to run `pytest`, `npm run dev`, `git status`, and other common operations without a permission prompt every time.

---

## 5. What Was Not Changed

- No application logic was modified
- No Python agents were changed
- No frontend code was changed
- No database schema was changed
- No deployment configuration was changed
- `.codex/outputs/` and `.codex/work/` were left as-is (Codex working artifacts)

---

## 6. Recommendations

### Immediate

1. **Rename `.claude/settings.template.json` to `.claude/settings.json`** — eliminates constant permission prompts.
2. **Commit `AGENTS.md` and `CLAUDE.md` to the GitHub repo** — they currently exist only in the Codex sandbox.
3. **Add `.claude/` to the repo** — commit `settings.json` and `commands/` so they are available in any fresh clone.

### Short-Term

4. **Add `AGENTS.md` and `CLAUDE.md` to `.gitignore` exclusion note** — these are safe to commit (they contain no secrets).
5. **Update `README.md`** to mention `AGENTS.md` as the agent/developer reference.
6. **Add `conftest.py`** to `tests/` if not already present (seen in Codex sandbox but not in GitHub scan).
7. **Consider moving Python agents into `src/sidereus/`** — the flat-root layout works now but will become harder to navigate as the codebase grows.

### Long-Term

8. **Unify the two product modes** (optional) — the frontend generates academic-framed reports while the CLI generates institutional reports with price targets. If a unified product is desired, the frontend `generate/route.ts` would need to call the Python CLI pipeline via subprocess or an internal API.
9. **Add `pyproject.toml`** — replace bare `requirements.txt` with a proper Python project config to enable editable installs, linting config (ruff/black), and type-checking (mypy/pyright) configuration.
10. **Activate Supabase Row-Level Security** — the schema references RLS policies but they should be verified as active in production.

---

## 7. Verification Checklist

After committing these files to GitHub, verify:

- [ ] `AGENTS.md` renders correctly on GitHub (tables, code blocks)
- [ ] `CLAUDE.md` is picked up by Claude Code (open project in Claude Code and check `/help`)
- [ ] `.claude/commands/research.md` registers as `/research` in Claude Code
- [ ] `.claude/commands/check-secrets.md` registers as `/check-secrets`
- [ ] `.claude/settings.json` is in place and permissions work (`pytest` runs without prompt)
- [ ] Codex picks up `AGENTS.md` as the primary agent reference
- [ ] `.codex/PROJECT.md` points to `AGENTS.md` correctly
