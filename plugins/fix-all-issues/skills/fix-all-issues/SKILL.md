---
name: fix-all-issues
version: 0.7.0
disable-model-invocation: true
description: Coordinate a stateful, multi-round PR review and remediation workflow through fresh background agents. Bind findings and validation to exact Git trees, enforce independent verification and triage gates, fix accepted issues with red-green evidence, update the PR branch and description, and repeat until a fresh clean review or a named capped outcome. Use for requests to review a PR or branch, fix every accepted issue, publish the result, and keep the main agent available as an orchestrator.
---

# Fix all issues

Run PR review as a state machine. The main agent owns orchestration, durable run state, progress, and the final summary. Fresh round coordinators own target work. In exhaustive mode, optimize for the lowest residual issue rate, not elapsed time.

## Inputs

- `pr`: PR URL or number. If omitted, use the current branch against the repository's documented integration branch or default branch.
- `review_mode`: `exhaustive` by default, or `quick`. Treat legacy `normal` as `quick`.
- `num_agents`: Concurrent background-agent ceiling, including the round coordinator. Default `8` in exhaustive mode and `5` in quick mode.
- `orchestrator_only`: Default `true`. The main agent may manage state, agents, progress, and summaries, but may not review, triage, edit, validate, commit, push, or edit the PR.
- `fresh_round_context`: Default `true`. Spawn a new round coordinator for every outer round and new reviewers inside it. Never reuse prior-round agents for a clean confirmation.
- `stop_policy`: `fresh-zero` by default in exhaustive mode, `stabilized` by default in quick mode.
- `required_clean_outer_rounds`: Consecutive fresh outer rounds with zero accepted findings required by `fresh-zero`. Default `1`.
- `max_outer_rounds`: Maximum fresh review rounds. Default `8` in exhaustive mode and `5` in quick mode.
- `max_fix_rounds`: Maximum fix/validate/cleanup cycles inside one outer round. Default `8` in exhaustive mode and `5` in quick mode.
- `max_rounds`: Legacy alias for `max_outer_rounds` when the new input is absent.
- `cap_strategy`: `reserve-confirmation` by default, or `hard`, or `ask`.
- `progress`: `milestones` by default, or `heartbeat` for a short update every 3-5 minutes while work is active.

Explicit user values override mode defaults.

## Modes

`exhaustive` requires independent verification, a second triager, risk-triggered specialist lenses, red-green fix evidence, cleanup convergence, affected-path live validation when practical, a fresh cold confirmation, and a residual-risk inventory.

`quick` may merge lenses, use one triager, fold cleanup into re-review, and stop at stabilization. It still binds evidence to a Git tree, preserves scope, records residuals, and validates before push.

## Authority and safety

- Invocation authorizes background agents, local edits, validation, commits, normal pushes to the target branch, and PR description updates.
- Invocation does not authorize deployment, production mutation, history rewrite, force-push, destructive cleanup, new external scope, or contacting people. Obtain explicit authority for those actions.
- Repository and user instructions override this skill. Discover validation and Git workflow from repository sources. Never invent commands.
- Preserve unrelated work. If the target worktree is dirty, record the state and isolate work safely before a worker edits.
- Use normal commits and pushes by default. Rewrite only when separately authorized and safe. After a rewrite, invalidate all prior validation and rerun it on the rewritten tree.

## Required protocol

Before target work, read [references/protocol.md](references/protocol.md) completely. Read each phase reference before starting that phase:

- review: [references/reviewer-lenses.md](references/reviewer-lenses.md)
- verification and triage: [references/triage.md](references/triage.md)
- validation and live checks: [references/validation.md](references/validation.md)
- commit, push, metadata, and PR body: [references/pr-delivery.md](references/pr-delivery.md)

Use the canonical prompts in `templates/`. Preserve every required field when adding repository-specific instructions.

## Run state

Create `.git/fix-all-issues/<run-id>/` before the first outer round. If the Git directory is unavailable, use a private temporary directory and report its path. Keep artifacts untracked:

- `run.json`: target, inputs, phase, tree identities, round summaries, growth metrics, outcomes, deployments, and residual risks
- `scope.md`: immutable original intent plus separately recorded user-approved scope changes
- `findings.json`: one record per root-cause fingerprint, including rejected and deferred findings
- `validation.json`: commands, environment, cache status, live checks, and results bound to a tree
- `pr-body.md`: fetched working copy of the current PR body

Conform `run.json` to [schemas/run-state.schema.json](schemas/run-state.schema.json). Use [schemas/protocol-cases.json](schemas/protocol-cases.json) as the gate and outcome examples.

## State machine

### 0. Preflight

Resolve the target identifier, user inputs, authority limits, and run directory. With `orchestrator_only=true`, stop there and delegate target inspection to the round coordinator. Otherwise, fetch current PR metadata and read applicable repository instructions.

### 1. Start a fresh outer round

Spawn one new coordinator from [templates/round-coordinator.md](templates/round-coordinator.md). The coordinator fetches current PR metadata, description, comments, review threads, checks, labels, draft state, mergeability, head OID, and base OID. It reads applicable repository instructions and domain docs, discovers validation/generation/autofix commands, snapshots original intent before any PR-body edit, and records `base_oid`, `candidate_tree_oid`, `head_oid`, `pr_body_hash`, and diff metrics.

Before review, the coordinator builds a change-contract matrix. For each changed behavior it records consumer, operation, authority, read/write/display path, readiness, fallback, validator, and test. It records all changed exported interfaces and production callers. When `orchestrator_only=true`, the main agent delegates all remaining work in the round to the coordinator.

The coordinator counts against `num_agents`. Keep enough capacity for verification, both triagers, fixers, cleanup, and a cold reviewer. Safe recipes:

- 4 background slots: coordinator, 2 reviewers, 1 rotating verifier/triager/fixer
- 6 background slots: coordinator, 3 reviewers, 2 rotating gate/fix slots
- 8 background slots: coordinator, 5 reviewers, 2 rotating gate/fix slots

### 2. Review the pinned tree

Choose reviewer lenses by risk, not line count alone. Always cover correctness, tests, compatibility, security, maintainability, and repository conformance. Add concurrency/lifecycle, time semantics, reactive dependencies, shared-interface callers, native lifecycle, red-team, or coverage specialists when the change contract triggers them.

Reviewers receive the base, exact candidate tree, original intent, current PR body, rules, and assigned lens. They do not receive prior findings or verdicts. They may not edit. Every finding must name a concrete failure mode and the invariant it violates.

### 3. Verify and triage

Deduplicate reviewer output by root cause after reviewers finish. Persist every fingerprint. Reopen a rejected fingerprint only when relevant lines changed or new evidence exists.

No fixer may start until all accepted findings pass these gates in order:

1. verification against the pinned candidate tree
2. primary triage
3. independent second triage in exhaustive mode
4. disagreement resolution

The second triager sees the pinned diff and normalized findings, not the first verdict or reviewer rationales. It ignores the dirty worktree. Apply the same gates to findings discovered during fixes, validation, cleanup, or re-review.

### 4. Fix accepted findings

Partition work by disjoint file ownership. Each bug fix needs failing evidence before the fix and green evidence after it. When a conventional test cannot be written, require an equivalent mutation check that fails when the fix is reverted. Update caller inventory for any interface change.

Prefer the smallest deep fix at the responsible seam. If one invariant creates three findings, survives two rounds, or spreads patches across callers, pause local patching and run a bounded design/refactor pass. Make the invalid state harder to express, then re-triage the proposed scope.

### 5. Validate the resulting tree

Run autofix, targeted checks, canonical lint/test/typecheck/build gates, generation when inputs changed, and the appropriate live-check level. Record exact command, environment, result, and resulting tree.

Any code edit invalidates validation and review for the old tree. A behavior-relevant PR body edit invalidates cold spec review. A commit with an unchanged `HEAD^{tree}` preserves tree-bound code evidence, but record the new commit OID.

### 6. Cleanup to convergence

Cleanup may edit behavior-preserving code, tests, comments, and docs. Revalidate after edits. A cleanup pass with edits does not satisfy cleanup. Run the next pass; the first zero-edit pass satisfies cleanup. Route any behavior change back through verification and both triage gates.

### 7. Inner stabilization

Run a narrow re-review of the current candidate tree, with temporal and caller checks for touched invariants. If it finds accepted issues, repeat phases 3-7 up to `max_fix_rounds`. The inner cycle is stabilized when fixes, validation, cleanup, and narrow re-review are green on one exact tree.

### 8. Deliver the round

The round coordinator creates focused commits, pushes normally, fetches the latest PR body before editing, folds final behavior and stable validation commands into existing sections, and updates `run.json`. Do not put volatile commit SHAs, intermediate diff counts, or intermediate test totals in the PR body.

After every outer round, the main agent gives the user a cumulative summary: unique findings fixed, newly deferred/rejected findings, validation status, pushed commits, PR body status, current tree, growth guard status, and next stop condition.

### 9. Confirm or stop

- `stop_policy=stabilized`: stop after an inner cycle stabilizes.
- `stop_policy=fresh-zero`: spawn a new coordinator in fresh context. Stop only after `required_clean_outer_rounds` consecutive outer rounds produce zero accepted findings inside approved scope, no earlier accepted finding remains unresolved, and required validation remains valid on the delivered tree.

Classify the outcome exactly:

- `clean`: required fresh zero rounds completed and final validation is green
- `stabilized`: inner cycle is green and the selected policy does not require another fresh zero
- `capped-stabilized`: cap reached after fixes are green, but no required fresh zero remains available
- `capped-with-residuals`: cap reached with actionable findings or failed required validation

If external state or missing authority blocks delivery, report `blocked` separately from these quality outcomes.

## Growth and convergence guard

At each delivered round compare initial and current files, changed lines, subsystems, and finding origins. Pause for a split/design decision when any condition holds:

- diff size doubles
- a fix adds a new subsystem
- review-fix changes exceed the original diff size
- two consecutive rounds introduce more accepted review-fix findings than they close

Classify each finding origin as `original-pr`, `review-fix`, `pre-existing`, `cleanup-only`, or `reopened`. Count unique root causes, not repeated reports.

## Progress

Report milestones and changed counters only. Do not narrate unchanged waits. With `progress=heartbeat`, send a compact update every 3-5 minutes while work is active. Format:

```text
outer 2/8 | inner 1/8 | review 5/5 | verify 3/3 | triage 2/2 | fixes 1/2 | validation running
unique fixed 12 | deferred 2 | rejected 7 | candidate tree <short oid>
```

## Final report

Lead with target, outcome, outer/inner counts, final tree, validation, push status, and PR body status. Then include:

- cumulative unique findings ledger with origin and verification evidence
- validation summary bound to the final tree
- cleanup convergence result
- diff growth and convergence result
- generated artifacts and deployment ledger
- deferred follow-ups and rejected fingerprints
- residual-risk inventory of anything not checked
- history rewrite and post-rewrite validation, if any
