---
name: auditable-run
version: 0.3.0
disable-model-invocation: true
description: Design and execute an evidence-driven local workflow for a large task when no focused playbook fits.
---

# Auditable run

Design a task-specific execution workflow for a large migration, an ambitious multi-part change, or work the user will review after stepping away. Use a focused skill when one fits. This skill begins only after product, scope, safety, and one-way user decisions are settled. If one remains open, use `wayfinder` when installed. Otherwise write the unresolved question, known facts, options, consequences, and recommendation, then stop for the user.

Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. No agent may post, send, reply, or comment through external services. Internal delegation and local tool use are allowed within the user's scope.

## A. Frame the run

State these before implementation:

- A falsifiable definition of done.
- The rough number of units and expected effort.
- Known blockers and confirmation that no one-way user decision remains open.
- A rigor level expressed as checks and artifacts.

Proceed with reversible local exploration. Pause once before a multi-hour run so the user can correct the framing. Do not treat this pause as authority for external actions.

## B. Design the workflow

Split the work into atomic units that can be checked independently. Order the largest unknowns first. Build the verification harness and capture the baseline before changing behavior. Record the baseline revision and the scenario to repeat on the changed revision. If the baseline lacks the feature, record that absence and define checks for the added behavior and the final state the user expects. Do not invent a baseline result.

For a reversible technical choice inside the settled constraints, run parallel isolated design candidates and use an independent judge when the comparison is worth its cost. Internal agent votes never settle a one-way user decision. Skip the panel for mechanical work with a settled shape.

Parallelize only across genuine seams. Give concurrent writers separate files, worktrees, or branches when repository instructions permit them. Shared writes stay serial. The parent reviews every diff and owns the result.

Write the phase list before starting. Add each concrete unit to the active plan.

## C. Run the experiment loop

For each unit:

1. State the hypothesis.
2. Make the smallest local change that tests it.
3. Measure against the predicate on the real artifact. Repeat the baseline scenario on the changed revision. For performance claims, require both revisions to produce the same metric under comparable conditions. If the scenarios differ, set absolute budgets for the added work and user-visible completion instead of reporting a ratio.
4. Keep the change only if it advances the predicate.
5. Revert or supersede changes that do not help, using a safe method that preserves unrelated user work.

Use `VERIFIED`, `NOT VERIFIED`, or `INCONCLUSIVE`. Never convert an inconclusive result into a pass. Inspect artifacts directly instead of trusting a subagent summary.

## D. Keep the trail

Use the `show-me-your-work` skill for one local TSV log when installed. Otherwise create an append-only `decisions.tsv` with `ts`, `phase`, `decision`, `why`, `evidence`, and `result` columns. Add a row for each execution decision and completed unit. Prefer repeatable commands and durable artifacts as evidence.

Do not commit the trail or any implementation as part of this skill. If the user separately authorizes a commit, use the repository's commit skill when installed. Otherwise inspect the exact diff, preserve unrelated work, run repository checks, and follow the repository's documented message format without agent attribution.

## E. Verify and hand back

Check the entire result against the original predicate on the real product. Turn recurring corrections into a local test, lint rule, check, or script when that fits the task.

Report the workflow, rigor level, decision-trail path, verified predicate state, files changed, and open items. External communication, remote mutations, review requests, publication, and deployment remain outside this skill.
