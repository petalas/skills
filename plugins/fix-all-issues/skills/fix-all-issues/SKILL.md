---
name: fix-all-issues
version: 0.8.0
disable-model-invocation: true
description: Coordinate a bounded, stateful PR review and remediation workflow through fresh outer-round worker pools. Attribute every verified finding, keep qualifying work inside an explicit responsibility envelope, route adjacent issues without dropping them, bind review and validation to exact Git trees and body hashes, consolidate repeated root causes, and stop only with an exact clean, scope-routed, blocked, stabilized, or capped terminal state. Use for requests to review a PR or branch, fix every qualifying issue, publish the result, and keep the main agent available as an orchestrator.
---

# Fix all issues

Run PR review as a bounded state machine. The main agent owns orchestration, durable state, capacity, progress, and the final report. A fresh coordinator and blind reviewer pool own each outer round. Reuse a small fixed worker pool inside the round unless a gate requires independence.

The workflow must not choose between infinite scope growth and silently ignoring known issues. Attribute every verified finding, classify its responsibility, then either fix it in the current PR or record an explicit route.

## Inputs

- `pr`: PR URL or number. If omitted, use the current branch against the repository's documented integration or default branch.
- `review_mode`: `exhaustive` by default, or `quick`. Treat legacy `normal` as `quick`.
- `num_agents`: Concurrent background-agent ceiling, including the coordinator. Default `6` in exhaustive mode and `4` in quick mode.
- `orchestrator_only`: Default `true`. The main agent may manage state, agents, progress, and summaries, but may not review, triage, edit, validate, commit, push, or edit the PR.
- `fresh_round_context`: Default `true`. Freshness applies at the outer-round boundary. Start a new coordinator and blind reviewer pool for each outer round; do not create a new agent for every small gate. `false` cannot satisfy `stop_policy=fresh-zero`.
- `stop_policy`: `fresh-zero` by default in exhaustive mode, `stabilized` by default in quick mode.
- `required_clean_outer_rounds`: Consecutive fresh outer rounds with zero qualifying in-envelope findings required by `fresh-zero`. Default `1`.
- `max_outer_rounds`: Maximum fresh review rounds. Default `6` in exhaustive mode and `4` in quick mode.
- `max_fix_rounds`: Maximum repair cycles inside one outer round. Default `6` in exhaustive mode and `4` in quick mode.
- `max_rounds`: Legacy alias for `max_outer_rounds` when the new input is absent.
- `cap_strategy`: `reserve-confirmation` by default, or `hard`, or `ask`.
- `reviewer_timebox_minutes`: Per-reviewer elapsed-time budget. Default `12` in exhaustive mode and `8` in quick mode.
- `early_claim_minutes`: Time to the first actionable claim or explicit no-claim checkpoint. Default `4` in exhaustive mode and `3` in quick mode.
- `progress`: `milestones` by default, or `heartbeat` for a short update every 3-5 minutes while work is active.

Explicit user values override mode defaults.

## Authority and responsibility

Invocation authorizes background agents, local edits, validation, focused commits, normal pushes to the target branch, and PR description updates. It does not authorize deployment, production mutation, history rewrite, force-push, destructive cleanup, external communication, or product expansion.

The responsibility envelope includes:

1. the originating spec and diff
2. behavior changed or exposed by the candidate
3. direct contracts and production callers of that behavior
4. repairs necessary to make an accepted fix correct

Attribute each finding as `originating-spec-diff`, `candidate-changed`, `candidate-exposed`, `direct-contract-caller`, `accepted-fix-correctness`, `adjacent-pre-existing`, or `product-decision`. The first five normally qualify as `in-envelope`. Adjacent pre-existing and new product behavior are `out-of-envelope` unless the user approves expansion.

A verified in-envelope finding may not be rejected or deferred merely because the patch grew. Fix it, consolidate the responsible seam, replace the shallow patch, or report a real authority or operational blocker. A verified out-of-envelope finding must end as `deferred`, `routed-follow-up`, `routed-user-authority`, or `routed-external-owner`. `deferred` requires evidence, a reason, and a reconsideration condition. Never omit the finding from the ledger or call it fixed.

Repository and user instructions override this skill. Preserve unrelated work. If the target worktree is dirty, record it and isolate worker edits safely.

## Required protocol

Before target work, read [references/protocol.md](references/protocol.md) completely. Read each phase reference before starting that phase:

- review: [references/reviewer-lenses.md](references/reviewer-lenses.md)
- verification and triage: [references/triage.md](references/triage.md)
- validation and live checks: [references/validation.md](references/validation.md)
- commit, push, metadata, and PR body: [references/pr-delivery.md](references/pr-delivery.md)

Use the canonical prompts for the [round coordinator](templates/round-coordinator.md), [reviewer](templates/reviewer.md), [verifier](templates/verifier.md), [triager](templates/triager.md), [fixer](templates/fixer.md), and [cold reviewer](templates/cold-reviewer.md). Preserve required fields when adding repository-specific instructions.

## Structured run state

Create `.git/fix-all-issues/<run-id>/` before the first outer round. If the Git directory is unavailable, use a private temporary directory and report its path. Keep artifacts untracked:

- `run.json`: phase, terminal state, outer rounds, capacity, growth, routes, and status alarms
- `scope.md`: immutable original intent plus append-only user-approved changes
- `evidence.json`: one exact-tree evidence packet with diff digest, repository rule paths, responsibility envelope, change contracts, and caller rows
- `findings.json`: root-cause findings, attribution, responsibility, gate verdicts, disposition, and route
- `validation.json`: tree-keyed command and review evidence with affected-surface invalidation and reuse links
- `pr-body.md`: latest fetched remote body
- `proposed-pr-body.md`: proposed body reviewed before delivery

Conform artifacts to [schemas/run-state.schema.json](schemas/run-state.schema.json), [schemas/evidence-packet.schema.json](schemas/evidence-packet.schema.json), [schemas/findings.schema.json](schemas/findings.schema.json), and [schemas/validation-ledger.schema.json](schemas/validation-ledger.schema.json). Use [schemas/protocol-cases.json](schemas/protocol-cases.json) as gate and terminal-state examples.

Do not use one body hash for two phases. `remote_body_hash` names the last fetched remote body. `proposed_body_hash` names the local body proposed for review and delivery. Set `delivered_body_hash` only after fetching the edited remote body and confirming it. For a branch without a PR, body hashes and artifacts are null; cold spec review binds to immutable `scope.md` instead.

## State machine

### 0. Preflight and packet

Resolve target, authority, inputs, run directory, and dirty state. Start a fresh outer coordinator. It reads applicable repository and domain rules, fetches PR metadata, captures immutable intent, pins `base_oid`, `head_oid`, `candidate_tree_oid`, and `remote_body_hash`, and creates one `evidence.json` packet. Workers read their packet slice and the listed repository or domain rules. They do not reread the full skill reference set or reconstruct the entire diff independently.

Build change-contract and caller rows for every changed behavior or exported interface. Include consumer, operation, authority, readiness, fallback, validator, test, caller mode, and whether the caller is direct.

### 1. Budget and review the pinned tree

Use a small fixed pool with explicit lifecycle states. Reserve one slot for independent triage and one for cold confirmation. Reviewers receive the packet, exact immutable tree, proposed body when present, assigned lens, coverage checklist, timebox, and early-claim milestone. They stop when the lens checklist is exhausted or the timebox expires. They report uncovered checklist rows instead of continuing open-ended review.

Always cover correctness, tests, compatibility, security, maintainability, and repository conformance. Add risk-triggered specialists. Reviewers do not edit and do not receive prior findings or verdicts.

### 2. Verify, attribute, and triage in batches

Normalize and deduplicate claims by root cause. Persist every verified, refuted, duplicate, and routed fingerprint. Attribute responsibility before deciding disposition.

Batch findings tied to one tree through one primary triager and one independent triager in exhaustive mode. In quick mode, independent triage remains mandatory for P0/P1, scope expansion, low-confidence verification, disputed claims, and any finding that changes the responsibility envelope. Start a resolver only when the two verdicts genuinely disagree.

No fixer starts on a finding until its required gates are complete. Late findings enter the same batch gate.

### 3. Fix at the responsible seam

Partition accepted findings by disjoint file ownership. One worker owns any shared seam; other workers report dependencies instead of editing overlapping files. Reuse workers for compatible tasks inside the outer round, but never reuse a primary triager as the independent triager or an informed reviewer as the cold confirmer.

Every bug fix needs failing evidence before the fix and green evidence after it. If a conventional test is impractical, require mutation or runtime evidence that fails when the fix is removed.

The second accepted finding for the same invariant triggers root-cause consolidation. Stop adding narrow patches. Replace the patch set with the smallest deep fix at the responsible seam, update caller rows, and re-triage any real product or compatibility expansion.

### 4. Stabilize narrowly

Run autofix and affected checks, cleanup to a zero-edit pass, and a narrow re-review. Use the validation ledger to invalidate only entries whose declared inputs or affected surfaces changed. Reuse evidence only by creating a final-tree ledger row that links to the prior entry and proves its dependencies did not intersect the change. Unknown impact invalidates conservatively.

If a qualifying issue appears, repeat attribution, triage, root-cause repair, and narrow stabilization up to `max_fix_rounds`.

### 5. Cold confirmation before root validation

On the post-cleanup candidate, run a cold code and proposed-body review before expensive root validation. The confirmer sees the exact packet, candidate tree, `remote_body_hash`, `proposed_body_hash`, responsibility envelope, and assigned full-coverage checklist, but no prior findings or fixes.

Only a zero-claim result for qualifying in-envelope findings unlocks canonical root validation. A deferred or routed out-of-envelope issue does not inflate the PR, but it remains in the ledger and changes the eventual terminal state to `scope-routed`.

### 6. Validate once, then check the cleanup delta

Run canonical root lint, test, typecheck, build, generation, and live checks once per zero-claim candidate, as repository rules and risk require. Do not repeatedly run the full repository suite during speculative review or on an unchanged tree.

After root validation, run one narrow post-cleanup review and the affected checks recorded by the ledger. If they expose a qualifying issue or require an edit, return to triage. The next root run requires a new zero-claim candidate. Reuse unaffected validation entries; rerun any command whose inputs or dependency mapping changed.

### 7. Growth response

Measure files, changed lines, subsystems, public interfaces, and finding origins after each repair batch. Thresholds are escalation triggers, not rejection rules. When the diff doubles, a fix adds a subsystem, review-fix lines exceed the original diff, or the second finding hits one invariant:

1. stop adding narrow patches at that seam
2. consolidate root cause or replace the patch set
3. re-check responsibility and caller rows
4. ask only for genuine product, authority, or compatibility expansion

Record the trigger and response. Do not route a qualifying issue merely to make metrics smaller.

### 8. Deliver and cross the freshness boundary

Create focused commits, push normally, fetch the latest remote body, rebase the proposed body on it, and preserve separate hashes. After editing, fetch again and record `delivered_body_hash`. Compare local and remote tree identity.

Close or release the outer pool after its artifacts are durable. A fresh-zero policy starts a new coordinator and blind pool at the next outer boundary. The prior pool may not provide the fresh zero.

## Stop semantics

Fresh-zero remains strict for qualifying in-envelope findings. A round that finds and fixes one does not count as zero. Stop only after the required consecutive fresh rounds find zero, final validation is valid for the delivered tree, and no accepted in-envelope finding remains unresolved.

Use one terminal state:

- `clean`: fresh-zero and validation gates pass, and no verified known issue remains routed
- `scope-routed`: in-envelope gates pass, but one or more verified out-of-envelope issues are durably deferred or have follow-up, user-authority, or external-owner routes
- `stabilized`: quick policy ended after a green inner cycle without a required fresh zero
- `blocked`: missing authority, credentials, platform capacity, or external state prevents required in-envelope work or delivery
- `capped-in-envelope-green`: repairs and validation are green, but the cap prevents required fresh-zero confirmation
- `capped-with-residuals`: a qualifying finding, required cleanup, or required validation remains at the cap

Never describe `scope-routed`, `blocked`, or either capped state as cleanly fixed.

## Progress and alarms

Report changed counters only. Include the critical path, elapsed phase time, worker capacity, and alarms for repeated work or avoidable serialization. With `progress=heartbeat`, report every 3-5 minutes while work is active.

```text
outer 2/6 | inner 1/6 | phase cold-review 6m | critical path cold confirmer
pool 4 active/6 max, 2 reserved | findings fixed 9, routed 2, rejected 4
tree <short oid> | body remote <hash> proposed <hash> | alarms root-validation-repeat=0 overlap-waits=1
```

## Final report

Lead with target, terminal state, final tree, body hashes, validation, push, and PR body status. Include:

- cumulative findings by attribution, responsibility, disposition, and route
- evidence and validation ledger summary bound or explicitly reused onto the final tree
- outer and inner counts, cold-zero result, cleanup convergence, and growth responses
- critical-path time and repeated-work or serialization alarms
- generated artifacts, deployments, and authority sources
- routed follow-ups and user decisions needed
- residual risks and anything not checked
