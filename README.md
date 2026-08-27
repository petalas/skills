# Petalas Skills

[![Repository Check](https://github.com/petalas/skills/actions/workflows/format-check.yml/badge.svg)](https://github.com/petalas/skills/actions/workflows/format-check.yml)

Public agent skills distributed from GitHub and maintained with a small local plugin workflow.

This repo is designed for two jobs:

- installable skill source for the `skills` CLI
- local development home for plugin metadata, prompts, and supporting docs

If you only want to install a skill, use the commands below and ignore the internal layout.

## Available Skills

<!-- BEGIN GENERATED SKILL CATALOG -->

| Skill                                                                                                                        | What it does                                                                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`adversarial-review`](plugins/adversarial-review/README.md)                                                                 | Run independent read-only reviewers and apply lead judgment to their findings.                                                                         |
| [`architect`](plugins/architect/README.md)                                                                                   | Design non-trivial code from usage and module boundaries before implementation.                                                                        |
| [`arena`](plugins/arena/README.md)                                                                                           | Generate, judge, and synthesize independent candidates for one artifact.                                                                               |
| [`auditable-run`](plugins/auditable-run/README.md)                                                                           | Design and execute an evidence-driven local workflow for a large task when no focused playbook fits.                                                   |
| [`automate-me`](plugins/automate-me/README.md)                                                                               | Create or update a personal mode skill from the user's stated preferences and workspace-scoped conversation history.                                   |
| [`blast-radius`](plugins/blast-radius/README.md)                                                                             | Find breakage outside a diff and prove its load-bearing safety facts.                                                                                  |
| [`bro`](plugins/bro/README.md)                                                                                               | Restate the last message in plain human language, with no jargon.                                                                                      |
| [`commit-guidelines`](plugins/commit-guidelines/README.md)                                                                   | Conventional commits without AI co-author attribution                                                                                                  |
| [`configure-agent-models`](plugins/configure-agent-models/README.md)                                                         | Record host-neutral model preferences for internal agent roles using only models available in the current environment.                                 |
| [`create-verification-skill`](plugins/create-verification-skill/README.md)                                                   | Create a project-local skill that drives an app through its real user surface and captures proof.                                                      |
| [`engineering-mode`](plugins/engineering-mode/README.md)                                                                     | Route solo software work through focused, evidence-driven playbooks without assuming a specific agent host.                                            |
| [`explain-code`](plugins/explain-code/README.md)                                                                             | Explain code by combining how it works with evidence for why it has that shape.                                                                        |
| [`fix-all-issues`](plugins/fix-all-issues/README.md)                                                                         | Bounded PR review with exact-tree evidence and durable issue routes                                                                                    |
| [`how`](plugins/how/README.md)                                                                                               | Explain how code works: subsystem architecture, runtime flow, ownership, placement, and layering. Optionally add a read-only architectural critique... |
| [`maintain-verification-skill`](plugins/maintain-verification-skill/README.md)                                               | Audit a project verification skill against source and every mapped user-facing feature, then apply proven local corrections.                           |
| [`principle-boundary-discipline`](plugins/principle-boundary-discipline/README.md)                                           | Apply when wiring validation, error handling, or framework adapters. Concentrate guards at system boundaries (CLI, config, network, external APIs);... |
| [`principle-build-the-lever`](plugins/principle-build-the-lever/README.md)                                                   | Apply to any non-trivial work, not just bulk work: edits, migrations, analyses, checks. Build the tool that does it or proves it (codemod, script, ... |
| [`principle-encode-lessons-in-structure`](plugins/principle-encode-lessons-in-structure/README.md)                           | Apply when you catch yourself writing the same instruction a second time, or notice a recurring correction. Encode the rule as a lint, metadata fla... |
| [`principle-exhaust-the-design-space`](plugins/principle-exhaust-the-design-space/README.md)                                 | Apply when facing a novel UI interaction or architectural decision with no precedent in the codebase. Build 2-3 competing prototypes and compare si... |
| [`principle-experience-first`](plugins/principle-experience-first/README.md)                                                 | Apply when product, UX, or feature-scope tradeoffs come up. Choose user delight over implementation convenience; ship fewer polished features over ... |
| [`principle-fix-root-causes`](plugins/principle-fix-root-causes/README.md)                                                   | Apply when debugging. Trace each symptom to its root cause and fix it there; reproduce first, ask why until you reach it, resist nil-check guards t... |
| [`principle-foundational-thinking`](plugins/principle-foundational-thinking/README.md)                                       | Apply before writing logic: choosing core types and data structures, sequencing scaffold-vs-feature work, asking what concurrent actors share. Get ... |
| [`principle-guard-the-context-window`](plugins/principle-guard-the-context-window/README.md)                                 | Apply when context is filling up: large outputs, long files, repeated reads, fan-out planning. Route bulk to subagents; keep summaries in the main ... |
| [`principle-laziness-protocol`](plugins/principle-laziness-protocol/README.md)                                               | Apply when refactoring, evaluating diff size, or tempted to add abstractions, layers, or signal threading. Bias toward deletion and the smallest ch... |
| [`principle-local-autonomy`](plugins/principle-local-autonomy/README.md)                                                     | Apply when reversible local work can proceed without a permission pause. Keep agents autonomous inside the workspace while reserving external commu... |
| [`principle-make-operations-idempotent`](plugins/principle-make-operations-idempotent/README.md)                             | Apply when designing commands, lifecycle steps, or processing loops that run amid crashes, restarts, and retries. Converge to the same end state re... |
| [`principle-minimize-reader-load`](plugins/principle-minimize-reader-load/README.md)                                         | Apply when reviewing or shaping code that's hard to trace. Count layers between question and answer, and hidden state in the reader's head; collaps... |
| [`principle-model-domain-in-code`](plugins/principle-model-domain-in-code/README.md)                                         | Apply when writing stateful logic, or when code branches a lot or repeats a shape assumption across files. Encode the domain in a structure instead... |
| [`principle-outcome-oriented-execution`](plugins/principle-outcome-oriented-execution/README.md)                             | Apply during planned rewrites and migrations with explicit phase boundaries. Converge on the target architecture; don't preserve smooth intermediat... |
| [`principle-prove-it-works`](plugins/principle-prove-it-works/README.md)                                                     | Apply after completing a task, before declaring done. Verify against the real artifact (run the feature, read the actual value, inspect the diff), ... |
| [`principle-redesign-from-first-principles`](plugins/principle-redesign-from-first-principles/README.md)                     | Apply when integrating a new requirement into an existing design. Redesign as if the requirement had been a foundational assumption from day one, i... |
| [`principle-replace-internal-apis-atomically`](plugins/principle-replace-internal-apis-atomically/README.md)                 | Apply when introducing a new internal API while old callers still exist. Migrate callers and delete the old API in the same wave instead of preserv... |
| [`principle-separate-before-serializing-shared-state`](plugins/principle-separate-before-serializing-shared-state/README.md) | Apply when concurrent actors might write to the same file, branch, key, or state object. Eliminate the sharing first; serialize structurally only w... |
| [`principle-sequence-verifiable-units`](plugins/principle-sequence-verifiable-units/README.md)                               | Apply to multi-step work such as sweeps, migrations, and runs of similar edits. Break work into small units that each end in a verifiable state, ch... |
| [`principle-subtract-before-you-add`](plugins/principle-subtract-before-you-add/README.md)                                   | Apply when sequencing an addition, refactor, or rewrite. Remove dead weight, redundant validators, and stub references first, then build on the sim... |
| [`principle-type-system-discipline`](plugins/principle-type-system-discipline/README.md)                                     | Apply when designing types, reviewing a function signature, or writing code in any statically-typed language. Make illegal states unrepresentable, ... |
| [`recall`](plugins/recall/README.md)                                                                                         | Reconstruct recent solo-development context and return a concise current-state brief.                                                                  |
| [`reflect`](plugins/reflect/README.md)                                                                                       | Review the active session through independent lenses and propose durable skill improvements for user approval.                                         |
| [`regression-test`](plugins/regression-test/README.md)                                                                       | Use when the user asks for a regression test, or when a bug has an obvious cheap local test seam. Do not use for general TDD or test-first feature ... |
| [`review-code-comments`](plugins/review-code-comments/README.md)                                                             | Review source-code comments and apply only authorized local cleanups.                                                                                  |
| [`safe-refactor`](plugins/safe-refactor/README.md)                                                                           | High-value safe refactors with evidence first                                                                                                          |
| [`show-me-your-work`](plugins/show-me-your-work/README.md)                                                                   | Keep a local, reviewable TSV decision trail for long-running, unattended, or multi-phase work.                                                         |
| [`swarm`](plugins/swarm/README.md)                                                                                           | Fan out subagents, drain every required result, and consolidate the report.                                                                            |
| [`technical-writing`](plugins/technical-writing/README.md)                                                                   | Layered technical-writing standard: Diataxis structure, Google developer style sentences, STE instruction rules, Global English syntax. Use for $te... |
| [`typescript-best-practices`](plugins/typescript-best-practices/README.md)                                                   | TypeScript best practices. Use when reading or editing any .ts or .tsx file.                                                                           |
| [`unslop`](plugins/unslop/README.md)                                                                                         | Cut AI tells from any writing. Must always apply.                                                                                                      |
| [`why`](plugins/why/README.md)                                                                                               | Investigate why code has its current shape from read-only evidence.                                                                                    |
| [`worktree-cleanup`](plugins/worktree-cleanup/README.md)                                                                     | Audit git worktrees and local development caches, then remove only targets proven unused and recoverable.                                              |

See the [full catalog](docs/PLUGIN_CATALOG.md) for categories and installation.

Start with the [solo developer workflow guide](docs/guide/README.md) for a
host-neutral path through understanding, design, implementation, verification,
and long-running local work.

<!-- END GENERATED SKILL CATALOG -->

The generated catalog links every plugin README, including its prompts,
workflow details, and source paths.

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

Install the optional solo-development router globally:

```bash
bunx skills@latest add petalas/skills --skill engineering-mode -g -y
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
plugins/<name>/
  .codex-plugin/plugin.json
  README.md
  commands/<name>.md
  skills/<name>/
    SKILL.md
    agents/openai.yaml
    references/*                 # when needed
    THIRD_PARTY_NOTICES.md       # pstack-derived skills
.agents/plugins/marketplace.json
docs/PLUGIN_CATALOG.md
```

What each layer is for:

- `SKILL.md` contains the actual skill instructions
- `commands/` provides command entrypoints like `$commit-guidelines` and `$fix-all-issues`
- `.codex-plugin/plugin.json` stores plugin metadata and public-facing display information
- `.agents/plugins/marketplace.json` supports local plugin development
- plugin-level `README.md` files make the repo easier to browse without digging through prompt files
- `THIRD_PARTY_NOTICES.md` travels with individually installed derived skills

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
- GitHub Actions runs `bun run check` on pull requests and pushes to `main`
- Prettier is the single formatter for this repo, including Markdown, YAML, JSON, and config files

More detail:

- contribution workflow: [CONTRIBUTING.md](CONTRIBUTING.md)
- release and update process: [docs/RELEASING.md](docs/RELEASING.md)
- orchestration design notes: [LEARNINGS.md](LEARNINGS.md)

## Philosophy

- keep public installation simple
- keep skills concrete and high-signal
- prefer repo-documented workflows over agent-specific guesses
- allow internal agent coordination without agent-to-human communication
- make maintenance boring: formatters, hooks, CI, and release notes should do the repetitive work

The pstack-derived collection follows the
[solo agent policy](docs/SOLO_AGENT_POLICY.md). Agents may work together, but
the user handles communication with other people.

## Pstack provenance

The derived collection uses pstack 0.14.4 at commit
`799151d91b6e12ee7dbd09f708eec108d7de9b3b` as its fixed upstream baseline.
Each substantially copied or adapted skill contains Lauren Tan's full MIT
notice and an exact source-path table inside its installed directory. See
[the import manifest](docs/pstack-imports.json) and the
[component inventory](docs/research/pstack-component-inventory.md).
Follow [Update skills from pstack](docs/UPDATING_PSTACK.md) to compare a newer
upstream commit, classify every changed path, update mappings, and verify the
port.
