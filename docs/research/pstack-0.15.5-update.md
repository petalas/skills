# Pstack 0.15.5 port decisions

Reviewed on 2026-10-02 against immutable upstream commit
[`c47b12849e43f18d5c374c7069c744cc55b0ea00`](https://github.com/cursor/plugins/tree/c47b12849e43f18d5c374c7069c744cc55b0ea00/pstack).
The previous baseline was pstack 0.15.0 at `71ed0d1076fec562c1b74ee353121a8d00f75382`.

## Port policy

Apply portable upstream additions and removals. Do not retain an instruction just because it seems useful for a particular model. Adapt model identifiers, reasoning settings, configuration locations, delegation tools, and transcript discovery to the active host. Preserve the repository's solo-agent communication and Git-authority boundaries, independent package layout, and unrelated local changes.

Existing exclusions for remote PR automation remain. Portable worker tracking and change-only status reporting from those workflows are expressed in the autonomous local playbook. This release does not add a shipping workflow or treat agent approval as user authority.

## Changed versions

- `adversarial-review: 0.1.1` to `0.2.0`
- `architect: 0.1.1` to `0.2.0`
- `arena: 0.1.0` to `0.2.0`
- `auditable-run: 0.3.1` to `0.4.0`
- `blast-radius: 0.1.0` to `0.2.0`
- `configure-agent-models: 0.1.0` to `0.2.0`
- `engineering-mode: 0.4.1` to `0.5.0`
- `how: 0.1.1` to `0.2.0`
- `principle-guard-the-context-window: 0.2.1` to `0.3.0`
- `principle-local-autonomy: 0.1.1` to `0.2.0`
- `principle-outcome-oriented-execution: 0.1.0` to `0.2.0`
- `principle-prove-it-works: 0.2.1` to `0.3.0`
- `principle-sequence-verifiable-units: 0.1.1` to `0.2.0`
- `reflect: 0.2.1` to `0.3.0`
- `regression-test: 0.1.2` to `0.2.0`
- `show-me-your-work: 0.2.1` to `0.3.0`
- `swarm: 0.1.0` to `0.2.0`
- `technical-writing: 0.1.1` to `0.2.0`
- `unslop: 0.1.1` to `0.2.0`
- `why: 0.1.1` to `0.2.0`

Other derived packages receive refreshed source notices without a behavior-version bump. Existing model preference files remain valid. The new global `reasoning profile` is optional, and missing settings inherit host defaults. Users receive the release with `bunx skills update` after it reaches `main`.

## Decisions for every changed path

| Upstream path                                          | Decision        | Local outcome                                                                                                                                                           |
| ------------------------------------------------------ | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.cursor-plugin/plugin.json`                           | Adapt           | Advance provenance to 0.15.5; keep independent local plugin packages.                                                                                                   |
| `README.md`                                            | Adapt           | Document reasoning preferences using detected host capabilities; omit fixed models and Cursor configuration paths.                                                      |
| `docs/guide/01-setup.md`                               | Adapt           | Document reasoning preferences using detected host capabilities; omit fixed models and Cursor configuration paths.                                                      |
| `docs/guide/07-overnight.md`                           | Exclude         | Remote autopilot publication and merging remain outside the local guide.                                                                                                |
| `skills/architect/SKILL.md`                            | Adapt           | Use explicit local role mappings, inherited aliases, confirmed reasoning profiles, and a bounded fallback. Keep provider identifiers out of prompts.                    |
| `skills/arena/SKILL.md`                                | Adapt           | Use explicit local role mappings, inherited aliases, confirmed reasoning profiles, and a bounded fallback. Keep provider identifiers out of prompts.                    |
| `skills/blast-radius/SKILL.md`                         | Adapt           | Apply upstream instruction removals to the corresponding local text; retain unrelated local guidance and the solo boundary.                                             |
| `skills/figure-it-out/SKILL.md`                        | Adapt           | Apply upstream instruction removals to the corresponding local text; retain unrelated local guidance and the solo boundary.                                             |
| `skills/how/SKILL.md`                                  | Adapt           | Use explicit local role mappings, inherited aliases, confirmed reasoning profiles, and a bounded fallback. Keep provider identifiers out of prompts.                    |
| `skills/how/references/explorer-prompt.md`             | Adapt           | Copy the prose clarification.                                                                                                                                           |
| `skills/interrogate/SKILL.md`                          | Adapt           | Use explicit local role mappings, inherited aliases, confirmed reasoning profiles, and a bounded fallback. Keep provider identifiers out of prompts.                    |
| `skills/interrogate/references/code-quality-review.md` | Adapt           | Apply upstream review-filter removals and require a traced input path for security findings.                                                                            |
| `skills/interrogate/references/reviewer-prompt.md`     | Adapt           | Apply upstream review-filter removals and require a traced input path for security findings.                                                                            |
| `skills/interrogate/references/rubric.md`              | Adapt           | Apply upstream review-filter removals and require a traced input path for security findings.                                                                            |
| `skills/poteto-mode/SKILL.md`                          | Adapt           | Add evidence labels, explicit role consumption, and defaults under a full-autonomy grant. Preserve solo authority and irreversible-decision gates.                      |
| `skills/poteto-mode/playbooks/autopilot-full.md`       | Extract concept | Use local worker tracking, stuck-work accounting, and change-only scheduled reports in engineering-mode. Keep remote PR/merge workflows and fixed cloud lanes excluded. |
| `skills/poteto-mode/playbooks/autopilot-stack.md`      | Extract concept | Use local worker tracking, stuck-work accounting, and change-only scheduled reports in engineering-mode. Keep remote PR/merge workflows and fixed cloud lanes excluded. |
| `skills/poteto-mode/playbooks/babysit.md`              | Exclude         | Changes concern excluded remote PR, review-thread, merge, or publication workflows; no new shipping workflow is installed.                                              |
| `skills/poteto-mode/playbooks/bug-fix.md`              | Adapt           | Remove repeated parent diff-review instructions. Model preference changes are handled by engineering-mode.                                                              |
| `skills/poteto-mode/playbooks/feature.md`              | Adapt           | Remove repeated parent diff-review instructions. Model preference changes are handled by engineering-mode.                                                              |
| `skills/poteto-mode/playbooks/hillclimb.md`            | Adapt           | Do not copy fixed model defaults; engineering-mode now explicitly resolves each playbook role.                                                                          |
| `skills/poteto-mode/playbooks/multi-phase-plan.md`     | Extract concept | Use local worker tracking, stuck-work accounting, and change-only scheduled reports in engineering-mode. Keep remote PR/merge workflows and fixed cloud lanes excluded. |
| `skills/poteto-mode/playbooks/opening-a-pr.md`         | Exclude         | Changes concern excluded remote PR, review-thread, merge, or publication workflows; no new shipping workflow is installed.                                              |
| `skills/poteto-mode/playbooks/pause-safely.md`         | Adapt           | Removed upstream instructions have no separate local counterpart. Keep the existing local workflow and authority boundary.                                              |
| `skills/poteto-mode/playbooks/perf-issue.md`           | Adapt           | Do not copy fixed model defaults; engineering-mode now explicitly resolves each playbook role.                                                                          |
| `skills/poteto-mode/playbooks/refactoring.md`          | Adapt           | Removed upstream instructions have no separate local counterpart. Keep the existing local workflow and authority boundary.                                              |
| `skills/poteto-mode/playbooks/shipping.md`             | Exclude         | Changes concern excluded remote PR, review-thread, merge, or publication workflows; no new shipping workflow is installed.                                              |
| `skills/poteto-mode/scripts/check-plan.mjs`            | Exclude         | The checker enforces an excluded cloud/PR plan skeleton; no local consumer exists.                                                                                      |
| `skills/principle-guard-the-context-window/SKILL.md`   | Adapt           | Apply upstream instruction removals to the corresponding local text; retain unrelated local guidance and the solo boundary.                                             |
| `skills/principle-never-block-on-the-human/SKILL.md`   | Adapt           | Apply upstream instruction removals to the corresponding local text; retain unrelated local guidance and the solo boundary.                                             |
| `skills/principle-outcome-oriented-execution/SKILL.md` | Adapt           | Apply upstream instruction removals to the corresponding local text; retain unrelated local guidance and the solo boundary.                                             |
| `skills/principle-prove-it-works/SKILL.md`             | Adapt           | Apply upstream instruction removals to the corresponding local text; retain unrelated local guidance and the solo boundary.                                             |
| `skills/principle-sequence-verifiable-units/SKILL.md`  | Adapt           | Apply upstream instruction removals to the corresponding local text; retain unrelated local guidance and the solo boundary.                                             |
| `skills/reflect/SKILL.md`                              | Adapt           | Use explicit local role mappings, inherited aliases, confirmed reasoning profiles, and a bounded fallback. Keep provider identifiers out of prompts.                    |
| `skills/reflect/references/divergent-reviewer.md`      | Adapt           | Remove the finding-count quota in all three reviewer prompts.                                                                                                           |
| `skills/reflect/references/judgment-reviewer.md`       | Adapt           | Remove the finding-count quota in all three reviewer prompts.                                                                                                           |
| `skills/reflect/references/tooling-reviewer.md`        | Adapt           | Remove the finding-count quota in all three reviewer prompts.                                                                                                           |
| `skills/setup-pstack/SKILL.md`                         | Adapt           | Add host-supported reasoning selection, preserved model choices, confirmed retired-role handling, panel/pool rules, and consuming skills.                               |
| `skills/show-me-your-work/SKILL.md`                    | Adapt           | Track run ownership and append corrections during audits. Remove the repeated one-row instruction.                                                                      |
| `skills/show-me-your-work/scripts/log.sh`              | Copy change     | Initialize missing or empty logs with append redirection. Retain local spreadsheet-cell sanitization.                                                                   |
| `skills/swarm/SKILL.md`                                | Adapt           | Require exact revisions and measurement methods, report all proven issues, and rerun incomplete evidence once before recording a gap.                                   |
| `skills/tdd/SKILL.md`                                  | Adapt           | Apply upstream instruction removals to the corresponding local text; retain unrelated local guidance and the solo boundary.                                             |
| `skills/technical-writing/SKILL.md`                    | Adapt           | Apply upstream instruction removals to the corresponding local text; retain unrelated local guidance and the solo boundary.                                             |
| `skills/unslop/SKILL.md`                               | Adapt           | Apply upstream instruction removals to the corresponding local text; retain unrelated local guidance and the solo boundary.                                             |
| `skills/why/SKILL.md`                                  | Adapt           | Use explicit local role mappings, inherited aliases, confirmed reasoning profiles, and a bounded fallback. Keep provider identifiers out of prompts.                    |

## Verification

The decision-log regression runs the real helper with a missing file, an existing empty file, an existing populated file, a failed file check, formula-like cells, invalid arguments, and an unwritable target. It failed on the previous helper because the empty file received no header. The port restores the header and preserves earlier rows and cell sanitization. A fixed test-only shell override makes the complete negated file predicate report absence, proving that the helper appends rather than truncates existing rows.

`bun run check` includes this regression alongside repository formatting, generated metadata, source-provenance validation, prompt contracts, installation checks, and the image-plugin tests. Prompt text checks do not establish future model behavior. All mapped source hashes and notices use the candidate commit. The MIT license bytes are unchanged.

## Bounded code review

The code change to `log.sh` is the upstream two-line initialization fix and its explanatory comment. The new regression calls the actual CLI, bounds each child process to five seconds and 64 KiB of captured output, and removes its temporary directory on every exit. Functions are below 60 lines. Argument errors and write failures remain visible to callers. No recursion, dynamic evaluation, or new production loop is introduced.

Power-of-Ten rule 3 has an interpreted-runtime deviation in the shell helper and JavaScript regression. Runtime and command-substitution allocations cannot be preallocated. These are finite CLI invocations, the helper accepts exactly six arguments bounded by the operating system's process argument limit, and the test uses fixed small fixtures and bounded child output. Follow up with explicit input-size limits if the helper becomes a long-lived service or accepts streamed input. Rules 8 and 9 introduce no production metaprogramming or indirect dispatch. The test sources a fixed shell fixture to inject a file-check failure; it accepts no generated or external code.

Power-of-Ten rules 7 and 10 retain an inherited deviation in `log.sh`: five sanitizer command substitutions can mask a normalization-command failure. Default ShellCheck and `bash -n` pass. Opt-in `shellcheck --enable=all` reports the same diagnostics before and after the port: five SC2312 return-value notes, twelve SC2250 style notes, and five SC2292 style notes. This upstream-sync change does not alter the sanitizer or add diagnostics. The sanitizer success path and caller-visible argument/write failures have executable coverage. Follow up by storing and checking each sanitized cell before `printf` if normalization error handling changes; keep any style normalization in that separate patch.
