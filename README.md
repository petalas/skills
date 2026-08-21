# Petalas Skills

[![Format Check](https://github.com/petalas/skills/actions/workflows/format-check.yml/badge.svg)](https://github.com/petalas/skills/actions/workflows/format-check.yml)

Public agent skills distributed from GitHub and maintained with a small local plugin workflow.

This repo is designed for two jobs:

- installable skill source for the `skills` CLI
- local development home for plugin metadata, prompts, and supporting docs

If you only want to install a skill, use the commands below and ignore the internal layout.

## Available Skills

| Skill               | Category | What it does                                                                                                                                    |
| ------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `commit-guidelines` | Coding   | Creates focused Conventional Commits while preserving unrelated work and never attributing authorship or co-authorship to AI                    |
| `fix-all-issues`    | Coding   | Reviews a PR or branch in parallel, deduplicates findings, delegates fixes, validates the result, and runs a fresh final review before stopping |
| `safe-refactor`     | Coding   | Finds the highest-value behavior-preserving refactor that can be safely bounded, protected with evidence, and validated                         |

See each plugin README for prompts, workflow details, and source paths:

- [commit-guidelines](plugins/commit-guidelines/README.md)
- [fix-all-issues](plugins/fix-all-issues/README.md)
- [safe-refactor](plugins/safe-refactor/README.md)

## Install

List skills in this repo:

```bash
bunx skills@latest add petalas/skills --list
```

Install `commit-guidelines` globally:

```bash
bunx skills@latest add petalas/skills --skill commit-guidelines -g -y
```

Install `fix-all-issues` globally:

```bash
bunx skills@latest add petalas/skills --skill fix-all-issues -g -y
```

Install `safe-refactor` globally:

```bash
bunx skills@latest add petalas/skills --skill safe-refactor -g -y
```

Install `fix-all-issues` for the current project:

```bash
bunx skills@latest add petalas/skills --skill fix-all-issues -y
```

## Update

Once installed from `petalas/skills`, refresh installed skills with:

```bash
bunx skills update
```

### How updates actually work

The upstream `skills` CLI is source-driven, not package-version-driven:

- global installs check the remote GitHub skill-folder hash and update when that folder changes
- project installs refresh from the original source when `bunx skills update` runs
- any file inside the installed skill folder can matter, not just `SKILL.md`

That means publishing a new version of a skill is usually just:

1. change the repo
2. commit and push to `main`
3. users run `bunx skills update`

The plugin version in `.codex-plugin/plugin.json` is still useful release metadata for humans, but it is not the primary update signal used by the CLI.

## Repository Layout

This repo keeps public install support and internal plugin metadata in the same tree:

```text
plugins/
  commit-guidelines/
    .codex-plugin/plugin.json
    README.md
    commands/commit-guidelines.md
    skills/commit-guidelines/SKILL.md
    skills/commit-guidelines/agents/openai.yaml
  fix-all-issues/
    .codex-plugin/plugin.json
    README.md
    commands/fix-all-issues.md
    skills/fix-all-issues/SKILL.md
    skills/fix-all-issues/agents/openai.yaml
  safe-refactor/
    .codex-plugin/plugin.json
    README.md
    commands/safe-refactor.md
    skills/safe-refactor/SKILL.md
    skills/safe-refactor/agents/openai.yaml
.agents/plugins/marketplace.json
```

What each layer is for:

- `SKILL.md` contains the actual skill instructions
- `commands/` provides command entrypoints like `$commit-guidelines` and `$fix-all-issues`
- `.codex-plugin/plugin.json` stores plugin metadata and public-facing display information
- `.agents/plugins/marketplace.json` supports local plugin development
- plugin-level `README.md` files make the repo easier to browse without digging through prompt files

Public installs still work from the GitHub repo root even though the skill lives inside a plugin-oriented structure.

## Development

```bash
bun install
bun run hooks:install
bun run format
bun run format:check
```

Quality checks:

- local pre-commit hook runs `bun run format:check`
- GitHub Actions runs the same check on pull requests and pushes to `main`
- Prettier is the single formatter for this repo, including Markdown, YAML, JSON, and config files

More detail:

- contribution workflow: [CONTRIBUTING.md](CONTRIBUTING.md)
- release and update process: [docs/RELEASING.md](docs/RELEASING.md)
- orchestration design notes: [LEARNINGS.md](LEARNINGS.md)

## Philosophy

- keep public installation simple
- keep skills concrete and high-signal
- prefer repo-documented workflows over agent-specific guesses
- make maintenance boring: formatters, hooks, CI, and release notes should do the repetitive work
