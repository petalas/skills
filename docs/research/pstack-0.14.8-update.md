# Pstack 0.14.8 port decisions

Reviewed on 2026-09-05 against immutable upstream commit
[`93b00b89ef425a9c1bac0d0b317dfc49c930ac99`](https://github.com/cursor/plugins/tree/93b00b89ef425a9c1bac0d0b317dfc49c930ac99/pstack).
The previous baseline was pstack 0.14.4 at `799151d91b6e12ee7dbd09f708eec108d7de9b3b`.

## Released guidance

- `typescript-best-practices` 0.2.0 reuses existing runtime schemas and derives types from them. A single guard does not justify a new schema dependency.
- `auditable-run` 0.3.0 records baseline revisions and repeats comparable scenarios. When the baseline lacks a feature, it requires explicit added-behavior checks and absolute performance budgets.
- `engineering-mode` 0.3.0 measures comparable baseline and changed-revision workloads, interleaves runs, and rejects ratios between unlike scenarios.

The verification additions extract concepts in local wording. Existing authoritative source-to-file mappings remain in place. No competing planning or shipping workflow is added.

Automatic invocation remains enabled for TypeScript and unslop. The unslop source classification becomes `adapt` because upstream added `disable-model-invocation: true`; its installed behavior is unchanged. Other plugins retain their versions because only their source notices changed.

Install and update commands are unchanged. No migration is required. Users receive these changes with `bunx skills update` after the release reaches `main`.

## Decisions for every changed path

The rename is listed as an old path and a new path, matching the update report's 28 rows.

| Upstream path                                             | Decision        | Local outcome                                                                                                                                                         |
| --------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.cursor-plugin/plugin.json`                              | Adapt           | Record upstream 0.14.8; retain local packaging, model routing, and release workflow.                                                                                  |
| `README.md`                                               | Adapt           | Record upstream 0.14.8; retain local packaging, model routing, and release workflow.                                                                                  |
| `assets/logo.png`                                         | Exclude         | Upstream branding is not used by the derived plugins.                                                                                                                 |
| `docs/guide/06-verify-and-ship.md`                        | Exclude         | Shipping and autopilot stack instructions remain outside the local guide.                                                                                             |
| `docs/guide/07-overnight.md`                              | Exclude         | Shipping and autopilot stack instructions remain outside the local guide.                                                                                             |
| `skills/architect/SKILL.md`                               | Adapt           | Retain host-neutral model discovery and parent-model fallbacks; do not copy fixed model defaults.                                                                     |
| `skills/arena/SKILL.md`                                   | Adapt           | Retain host-neutral model discovery and parent-model fallbacks; do not copy fixed model defaults.                                                                     |
| `skills/grokbot/make-bot-ui/SKILL.md`                     | Exclude         | Retain the bot-workflow exclusion at its new skills-root path.                                                                                                        |
| `skills/how/SKILL.md`                                     | Adapt           | Manual invocation is already enforced locally. Retain host-neutral model selection.                                                                                   |
| `skills/interrogate/SKILL.md`                             | Adapt           | Retain host-neutral model discovery and parent-model fallbacks; do not copy fixed model defaults.                                                                     |
| `skills/make-bot-ui/SKILL.md`                             | Exclude         | Retain the bot-workflow exclusion at its new skills-root path.                                                                                                        |
| `skills/poteto-mode/SKILL.md`                             | Adapt           | Retain host-neutral model discovery and parent-model fallbacks; do not copy fixed model defaults.                                                                     |
| `skills/poteto-mode/playbooks/autopilot-full.md`          | Extract concept | The baseline regression concept is covered by auditable-run. Exclude ready-PR publication, bot replies, cloud workers, and merge automation.                          |
| `skills/poteto-mode/playbooks/autopilot-stack.md`         | Exclude         | Forge-neutral commands do not remove the excluded remote PR, review-thread, and merge workflow. Do not import partial shipping semantics.                             |
| `skills/poteto-mode/playbooks/babysit.md`                 | Exclude         | Forge-neutral commands do not remove the excluded remote PR, review-thread, and merge workflow. Do not import partial shipping semantics.                             |
| `skills/poteto-mode/playbooks/bug-fix.md`                 | Adapt           | Retain host-neutral model discovery and parent-model fallbacks; do not copy fixed model defaults.                                                                     |
| `skills/poteto-mode/playbooks/hillclimb.md`               | Adapt           | Retain host-neutral model discovery and parent-model fallbacks; do not copy fixed model defaults.                                                                     |
| `skills/poteto-mode/playbooks/multi-phase-plan.md`        | Extract concept | Add comparable baseline scenarios and missing-feature absolute budgets to auditable-run and engineering-mode. Keep the fixed-model planning and PR skeleton excluded. |
| `skills/poteto-mode/playbooks/opening-a-pr.md`            | Exclude         | Forge-neutral commands do not remove the excluded remote PR, review-thread, and merge workflow. Do not import partial shipping semantics.                             |
| `skills/poteto-mode/playbooks/perf-issue.md`              | Adapt           | Retain host-neutral model discovery and parent-model fallbacks; do not copy fixed model defaults.                                                                     |
| `skills/poteto-mode/playbooks/shipping.md`                | Exclude         | Forge-neutral commands do not remove the excluded remote PR, review-thread, and merge workflow. Do not import partial shipping semantics.                             |
| `skills/poteto-mode/references/bugbot-triage.md`          | Exclude         | The review-thread workflow remains excluded; changing its forge lookup does not require a local port.                                                                 |
| `skills/reflect/SKILL.md`                                 | Adapt           | Retain host-neutral model discovery and parent-model fallbacks; do not copy fixed model defaults.                                                                     |
| `skills/setup-pstack/SKILL.md`                            | Adapt           | Retain host-neutral model discovery and parent-model fallbacks; do not copy fixed model defaults.                                                                     |
| `skills/typescript-best-practices/SKILL.md`               | Adapt           | Port existing-schema reuse, inferred types, and boundary validation. Preserve automatic invocation and host-neutral triggering without Cursor paths metadata.         |
| `skills/typescript-best-practices/references/patterns.md` | Adapt           | Port existing-schema reuse, inferred types, and boundary validation. Preserve automatic invocation and host-neutral triggering without Cursor paths metadata.         |
| `skills/unslop/SKILL.md`                                  | Adapt           | Preserve automatic invocation. Change provenance from copy to adapt; the installed prompt is unchanged.                                                               |
| `skills/why/SKILL.md`                                     | Adapt           | Manual invocation is already enforced locally. Retain host-neutral model selection.                                                                                   |

## Provenance and verification

Refresh all mapped source hashes and generated notices against the candidate commit. The upstream MIT license bytes are unchanged. Historical baseline links in the initial component inventory and license research remain historical; changed classifications link to the candidate revision.

Run `bun run check` with the upstream checkout available. The checks cover formatting, the generated catalog, source hashes, copy equality, notices, invocation policy, prompt contract fixtures, and standalone installation. Prompt fixtures check required text; they do not prove future model behavior.
