# Contributing

## Setup

```bash
bun install
bun run hooks:install
```

## Daily Workflow

```bash
bun run format
bun run format:check
bun run check
```

Formatting is the main repository quality gate right now:

- Prettier formats the whole supported repository surface
- the local pre-commit hook runs `bun run format:check`
- CI runs the same command on pull requests and pushes to `main`

## Adding Or Updating A Skill

1. Update the skill instructions in the relevant `SKILL.md`.
2. Update command entrypoints or supporting prompts if needed.
3. Keep public metadata in sync:
   - `.codex-plugin/plugin.json`
   - plugin-level `README.md`
   - root `README.md` if install or discovery guidance changed
4. Run `bun run catalog:sync` after adding, removing, renaming, or changing the
   public metadata of a plugin.
5. Run `bun run format`.
6. Run `bun run check`.

For a new pstack-derived plugin, start with:

```bash
bun scripts/scaffold-pstack-plugin.mjs <name> <pstack-source-directory>
```

Then adapt the generated skill to the solo agent policy. Update
`docs/pstack-imports.json`, keep the nested `THIRD_PARTY_NOTICES.md` path table
exact, and run `bun run validate:pstack-imports`.

To review or port a newer pstack revision, follow
[`docs/UPDATING_PSTACK.md`](docs/UPDATING_PSTACK.md). Run the update report
before editing so every changed upstream path receives an explicit decision.

## Repository Conventions

- Use ASCII unless a file already needs something else.
- Prefer small, reviewable skill changes over broad rewrites.
- Keep prompt instructions concrete and operational.
- If repository docs and prompt text drift apart, fix both in the same change.
- Do not hand-format files when the formatters can do it for you.

## Release Expectations

This repo does not require a separate package publish step for skill content.

- Pushes to `main` are the real distribution event for `bunx skills update`.
- Bump plugin versions when a skill meaningfully changes so humans can track releases.
- Update release-facing docs when installation, update behavior, or workflow assumptions change.

See [docs/RELEASING.md](docs/RELEASING.md) for the full release checklist.
