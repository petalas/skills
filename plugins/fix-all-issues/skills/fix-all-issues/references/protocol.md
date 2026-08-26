# Orchestration protocol

This reference defines responsibility, outer-round freshness, worker lifecycle, state ownership, phase gates, and terminal states.

## Roles and freshness

### Main orchestrator

With `orchestrator_only=true`, the main orchestrator may create run artifacts, manage capacity, start fresh outer coordinators, enforce gates, report progress, and request authority. It may not inspect the target diff to make code claims, adjudicate findings, edit target files, validate, commit, push, or edit the PR body.

If the platform cannot delegate a required action, record the limitation. Do not quietly move target work back to the main agent.

### Outer coordinator

One coordinator owns one outer round. A new coordinator marks the freshness boundary. It:

1. refreshes target metadata and exact Git objects
2. builds one evidence packet
3. starts a small worker pool with reserved independent slots
4. assigns blind review coverage
5. batches verification and triage
6. assigns disjoint repair ownership
7. controls cold review, validation, cleanup, and delivery
8. writes durable artifacts before releasing the pool

The coordinator may read prior ledgers only after blind reviewers return. It must not leak old findings, verdicts, fix rationales, or desired outcomes into fresh review.

### Worker pool

Create a small fixed pool for the round. Reuse workers with follow-up tasks when their context is compatible. Do not spawn a new worker merely to cross a small procedural gate.

Track every worker as `reserved`, `starting`, `active`, `idle`, `closing`, `closed`, `timed-out`, or `failed`. Track assigned role, independence restrictions, owned files, start time, deadline, and last milestone.

Reserve at least:

- one slot for independent triage or verification
- one slot for cold confirmation

The same worker may not serve both sides of an independent gate. A reviewer that saw prior findings or fixes cannot cold-confirm that outer round. Close or release the pool at the outer boundary.

If a worker misses its deadline, stop blocking once its assigned coverage is duplicated or noncritical. Respawn once only when the uncovered lens remains on the critical path.

## Responsibility envelope

Classify before disposition. The current PR owns:

| Attribution                | Default responsibility | Rule                                                                      |
| -------------------------- | ---------------------- | ------------------------------------------------------------------------- |
| `originating-spec-diff`    | `in-envelope`          | Required by original intent or broken directly in the original diff       |
| `candidate-changed`        | `in-envelope`          | Candidate changed the behavior                                            |
| `candidate-exposed`        | `in-envelope`          | Candidate made a latent failure reachable or observable                   |
| `direct-contract-caller`   | `in-envelope`          | Direct contract or production caller must change for compatible behavior  |
| `accepted-fix-correctness` | `in-envelope`          | Repair is required to make an already accepted fix correct                |
| `adjacent-pre-existing`    | `out-of-envelope`      | Verified issue exists independently beside the changed responsibility     |
| `product-decision`         | `out-of-envelope`      | Fix requires new behavior or product authority not promised by the change |

Evidence may override the default, but record the reason. File adjacency, backward compatibility, implementation size, and growth metrics do not decide responsibility.

Every verified out-of-envelope item needs a durable route:

- `deferred`: evidence, reason, and the condition that should reopen the finding
- `routed-follow-up`: concrete follow-up artifact or final-report entry with owner and next action when known
- `routed-user-authority`: exact product or scope decision requested from the user
- `routed-external-owner`: named system, team, or external dependency and required handoff

If repository tools support issue creation and the invocation authorizes it, create the follow-up. Otherwise record a ready-to-file title, evidence, and acceptance condition. Never silently drop a route because the tool is unavailable.

## Exact-tree evidence packet

Create `evidence.json` once for each pinned candidate. Include:

- base, head, and candidate tree OIDs
- `remote_body_hash`, `proposed_body_hash`, and body artifact paths
- immutable scope artifact and digest
- diff artifact path and digest
- applicable repository and domain rule paths and digests
- responsibility envelope
- change-contract and caller rows
- affected surfaces and validation map
- packet creation time and producer

Workers receive the packet or a lossless assigned slice. They must still read the listed repository and domain rules that apply to their files. They do not need to reread the orchestration references, refetch PR metadata, or independently reconstruct the entire diff.

If code, scope, rules, or a body under review changes, create a new packet ID. Do not mutate an old packet and retain its approvals.

## Durable state

Create `.git/fix-all-issues/<run-id>/` or a reported private temporary directory. Keep artifacts untracked.

`scope.md` has immutable original intent and append-only approved changes. The current PR body may evolve, but it cannot rewrite history.

`findings.json` keeps one root-cause fingerprint per issue. It records attribution, responsibility, evidence tree, verification, required triage gates, final disposition, fix evidence, and route. Persist refuted and duplicate fingerprints so rediscovery does not inflate counts.

`validation.json` is append-only and tree-keyed. A later pass does not overwrite a failure or invalidation.

`run.json` owns phase, capacity, outer rounds, growth events, routes, status alarms, and terminal state. Update it at each phase transition and changed milestone.

## Tree and body identity

Before review, repair integration, cold confirmation, validation, and delivery, record:

```bash
git rev-parse <base-ref>
git rev-parse HEAD
git rev-parse HEAD^{tree}
git status --short
```

Use a committed or safely materialized temporary tree. Never review a worktree that changes beneath a worker.

Hash body phases separately:

- `remote_body_hash`: last body fetched from the remote PR
- `proposed_body_hash`: local proposed body given to cold review
- `delivered_body_hash`: body fetched after the remote edit succeeds

For a branch without a PR, keep body hashes and artifacts null. Cold spec review binds to the immutable scope artifact and digest.

A remote body changing does not silently update the proposed body. Fetch, merge the new remote content into the proposal, hash it again, and invalidate the old body review.

Code edits invalidate code evidence whose inputs or affected surfaces intersect the edit. Body edits invalidate body review for the old proposed hash. Metadata-only commits with unchanged `HEAD^{tree}` preserve code evidence, but record the new head OID.

## Phase gates

Enforce gates as state:

```text
claim
  -> verification sufficient
  -> attribution and responsibility recorded
  -> primary triage
  -> independent triage when required
  -> resolver only on disagreement
  -> fix or durable route allowed
  -> affected validation and cleanup zero-edit
  -> cold code/body zero for qualifying findings
  -> canonical root validation
  -> post-cleanup narrow review and affected checks
  -> delivery allowed
```

In exhaustive mode, all verified findings use primary and independent batch triage. In quick mode, both remain mandatory for P0/P1, low-confidence evidence, disputed claims, scope or envelope changes, and security, data-loss, public-contract, or migration risk. Ordinary verified P2/P3 findings may use primary triage only in quick mode.

The resolver receives both verdicts and the exact disputed evidence. Do not run it when verdicts agree.

Late claims from fixers, validators, cleanup, or cold review enter at verification. Nearby ownership does not grant fix authority.

## Outer and inner loops

An outer round is a fresh blind review and confirmation boundary. An inner cycle repairs one candidate without replacing workers for every gate.

```text
outer round
  fresh coordinator and bounded pool
  exact-tree packet
  blind review
  batch verify -> attribute -> primary triage -> independent triage if required
  inner cycle
    disjoint fix batches
    affected checks
    cleanup to zero edits
    narrow re-review
    if qualifying findings, return to batch gates
  cold code and proposed-body review
  if qualifying claim, return to batch gates
  canonical root validation once for the zero-claim candidate
  post-cleanup narrow review and affected checks
  deliver
  close pool
```

`max_fix_rounds` caps inner cycles. `max_outer_rounds` caps fresh rounds. With `reserve-confirmation`, preserve the final outer slot for an independent zero claim.

A round that discovers and repairs a qualifying finding is not a zero round. Deferred or routed out-of-envelope findings do not fail in-envelope zero, but they require terminal state `scope-routed` if the run otherwise passes.

## Root-cause and growth response

Fingerprint from invariant, responsible seam, and failure mode. The second accepted finding for one invariant triggers consolidation. Stop stacking caller patches and do one of:

1. move enforcement to the responsible module
2. replace the patch set with one compatible interface fix
3. remove the flawed approach and implement a smaller correct design

Re-triage only genuine product, compatibility, external, or authority expansion. Work required for accepted-fix correctness stays in the envelope.

Record growth after every repair batch. The following trigger consolidation and a scope audit:

- files or changed lines double
- a repair adds a subsystem
- review-fix lines exceed the original diff
- accepted review-fix findings outnumber closed findings in two consecutive batches

Growth does not refute a finding and cannot route an in-envelope issue. If the current design cannot converge, replace it. Ask the user only when the correct design truly changes promised behavior or requires unauthorized action.

## Review budgets and critical path

Each reviewer gets a timebox and explicit coverage rows. At `early_claim_minutes`, it reports an actionable claim or `no-claim-yet` plus completed rows. It stops when rows are exhausted or the timebox ends. There is no arbitrary finding-count cap.

The coordinator reassigns uncovered P0/P1 or mandatory rows once. It records lower-risk uncovered rows as residual risk if the budget ends.

At every phase transition record:

- phase start and elapsed time
- critical-path worker or external dependency
- active, reserved, idle, and failed worker counts
- repeated command or review fingerprints
- serialization caused by overlapping file ownership or unavailable slots

Raise an alarm when the same unchanged-tree root command runs twice, a worker waits on avoidable file overlap, or all slots are occupied while an independent gate is ready.

## Terminal states

Use exactly one:

- `clean`: required fresh zeros and final validation pass with no known routed issue
- `scope-routed`: in-envelope proof passes and every known out-of-envelope issue is durably deferred or routed
- `stabilized`: selected policy permits a green inner stop without fresh-zero proof
- `blocked`: authority, credentials, capacity, or external state prevents required in-envelope work or delivery
- `capped-in-envelope-green`: cap ends the run after green repairs but before required fresh zero
- `capped-with-residuals`: qualifying work or required evidence remains at cap

An operational block takes precedence over a quality label. State the last supported quality evidence separately. Never call `scope-routed`, `blocked`, or capped work clean.
