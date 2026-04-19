# Releasing Skills

This repo ships skill updates through GitHub source changes, not a separate package publish flow.

## Release Checklist

1. Update the skill and any related docs.
2. Bump the plugin version in the relevant `.codex-plugin/plugin.json`.
3. Run:

```bash
bun run format
bun run format:check
```

4. Commit and push to `main`.
5. If the change affects installation or update behavior, update the root `README.md`.

## How Users Receive Updates

For users who installed from `petalas/skills`:

```bash
bunx skills update
```

Important details:

- global installs compare the remote GitHub skill-folder hash and update changed skills
- project installs refresh from the original source when `bunx skills update` runs
- any file in the installed skill folder can affect the resulting update, not just `SKILL.md`

## Versioning

Plugin versions in `.codex-plugin/plugin.json` are human-facing release metadata:

- useful for changelogs, release notes, and debugging
- not the primary update signal used by the `skills` CLI

## Suggested Release Notes Format

Keep release notes short and user-facing:

- what changed
- whether prompts or defaults changed
- whether install or update instructions changed
- whether any migration or manual follow-up is needed
