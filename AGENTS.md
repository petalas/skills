# Agent Guide — petalas/skills

> Read before editing. Concise on purpose. Follow the routing table for deeper detail.

## Repo Snapshot

Monorepo of public Claude Code / Codex agent skills distributed as plugins.

- Runtime: `bun@>=1.3.11`
- One plugin per directory under `plugins/`. Current: `plugins/fix-all-issues`.
- Each plugin holds:
  - `.codex-plugin/plugin.json` — plugin manifest (name, version, marketing copy)
  - `commands/<name>.md` — slash-command entrypoint
  - `skills/<name>/SKILL.md` — skill prompt with `name` + `version` frontmatter
  - `README.md` — user-facing install + usage docs
- Distribution: pushes to `main`. No separate publish step. `bunx skills update` picks up new commits.

## Hard Rules

- **Always run `bun run format` after editing any tracked file.** Then verify `bun run format:check` exits 0. Do not open a PR, push, or hand work back with unformatted files. CI runs `format:check`; a pre-commit hook runs it locally. Prettier formats Markdown too, including nested code blocks in numbered lists — this is the most common source of format drift in SKILL.md.
- **Bump the version in BOTH locations when a skill meaningfully changes:**
  - `plugins/<plugin>/skills/<skill>/SKILL.md` frontmatter `version:`
  - `plugins/<plugin>/.codex-plugin/plugin.json` `"version":`
  - Keep them identical. Use minor bump (x.Y.0) for added guidance; patch (x.y.Z) for typo/clarifying-only edits.
- **ASCII only** unless a file already requires otherwise.
- **Do not hand-format.** Let prettier do it.
- **Keep prompt instructions concrete and operational.** No aspirational language.

## Quick Commands

```bash
bun install              # one-time
bun run hooks:install    # one-time, installs pre-commit hook
bun run format           # apply prettier --write to all supported files
bun run format:check     # verify prettier clean (CI gate)
bun run check            # alias for format:check
```

First time in a fresh clone: prettier lives in `node_modules/.bin` only after `bun install`. If `bun run format` errors with `prettier: command not found`, run `bun install`.

## Daily Workflow

1. Edit the relevant `SKILL.md` / `commands/<name>.md` / `README.md` / `plugin.json`.
2. If a skill's behavior or guidance changed, bump both version locations (see Hard Rules).
3. Run `bun run format`.
4. Run `bun run format:check`. Must be clean.
5. Commit + push. (Pre-commit hook also runs `format:check` — the hook is a safety net, not a replacement for step 3.)

## Routing Table

| Editing this                                                                 | Read first                                                        |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `plugins/<name>/skills/<name>/SKILL.md`                                      | [CONTRIBUTING.md](CONTRIBUTING.md) — "Adding Or Updating A Skill" |
| `plugins/<name>/.codex-plugin/plugin.json`                                   | [CONTRIBUTING.md](CONTRIBUTING.md) — keep public metadata in sync |
| `plugins/<name>/commands/*.md`                                               | [CONTRIBUTING.md](CONTRIBUTING.md)                                |
| `plugins/<name>/README.md` or root `README.md`                               | [CONTRIBUTING.md](CONTRIBUTING.md) — install/discovery guidance   |
| Release-related changes (version bumps, distribution behavior, install flow) | [docs/RELEASING.md](docs/RELEASING.md)                            |
| Something broke and it wasn't obvious                                        | [LEARNINGS.md](LEARNINGS.md)                                      |

## When You Struggle

If a fix takes more than one attempt, before moving on:

1. Check if the issue is already in [LEARNINGS.md](LEARNINGS.md) or [CONTRIBUTING.md](CONTRIBUTING.md).
2. If documented, improve the entry so it would have prevented the confusion.
3. If new, add it to the authoritative location (LEARNINGS.md for quirks, CONTRIBUTING.md for workflow).
4. Prefer a code/lint rule over a doc entry when the check can be mechanical.

## Commit Messages

Conventional commits preferred:

```
type(scope): description
```

Valid types: `feat`, `fix`, `refactor`, `chore`, `perf`, `docs`, `style`, `test`, `build`, `ci`, `revert`, `release`.
Scopes are usually plugin names: `fix-all-issues`, or `docs`, `ci`, etc.

Do not add `Co-Authored-By` footers.
