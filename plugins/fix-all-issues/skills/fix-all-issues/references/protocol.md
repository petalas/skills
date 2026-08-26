# Orchestration protocol

This reference defines the outer review loop, inner stabilization loop, state ownership, invalidation rules, and stop outcomes.

## Roles

### Main orchestrator

The main orchestrator owns the run, not the code. With `orchestrator_only=true`, it may:

- create and update untracked run artifacts
- spawn a fresh round coordinator
- enforce capacity, timeouts, phase gates, and caps
- aggregate round reports without re-reviewing their code claims
- give the user cumulative summaries and request authority when needed

It may not inspect the diff to produce findings, adjudicate findings, edit target files, run target validation as a substitute for a worker, commit, push, or edit the PR body. If the platform cannot delegate a required action, report that limitation. Do not silently take the work back.

When `orchestrator_only=false`, the main agent may perform target work, but it must obey the same tree binding and gates. Direct work never counts as an independent second triage or fresh confirmation.

### Outer round coordinator

Every outer round starts with a new coordinator and separate context. It owns the full round:

1. snapshot the target
2. spawn blind reviewers
3. normalize and deduplicate findings
4. arrange verification and two-stage triage
5. arrange disjoint fix batches
6. validate and clean up
7. run narrow re-review
8. commit, push, and update the PR body
9. update run artifacts and return a round summary

The coordinator may read durable run state. It must not leak prior verdicts or finding history into fresh reviewers. It deduplicates new outputs against history only after review completes.

### Workers

Reviewers, verifiers, triagers, fixers, cleanup workers, validators, and cold reviewers own one bounded phase. Close or release them when their output is recorded. A worker from an earlier outer round cannot serve as a fresh reviewer or cold confirmer.

## Durable state

Create a private run directory under `.git/fix-all-issues/<run-id>/`. Use a stable run ID such as `<pr-number>-<utc-timestamp>` or `<branch>-<utc-timestamp>`.

`scope.md` has two append-only sections:

1. original intent, captured from the user request, original PR body, linked issue/spec, and relevant commit intent before any review-driven PR body edit
2. approved scope changes, each with source and timestamp

Do not rewrite original intent to match the final implementation. The current PR body may evolve, but it cannot retroactively make accidental work intentional.

`findings.json` is a root-cause ledger. Each record includes:

- stable ID and fingerprint
- invariant
- origin
- first-seen and last-seen round
- candidate tree where evidence was gathered
- files and lines
- severity and confidence
- verification status and evidence
- primary and second triage verdicts
- final disposition
- fix commits and red-green evidence
- reopen evidence

`validation.json` is append-only. Do not overwrite a failed run with a later pass.

## Tree identity and invalidation

Use Git object identity, not branch names or working-tree descriptions, to bind evidence.

Record before every review and validation phase:

```bash
git rev-parse <base-ref>
git rev-parse HEAD
git rev-parse HEAD^{tree}
git status --short
```

For an uncommitted candidate, create a temporary tree safely with repository-approved tooling or commit the integrated batch before review. Do not ask reviewers to reason over a worktree that changes beneath them.

Rules:

- code or generated-file edit invalidates all code review and validation tied to the previous tree
- behavior-relevant test edit invalidates test results tied to the previous tree
- PR body edit that changes promised behavior, scope, or test claims invalidates cold spec review tied to the old body hash
- metadata-only commit with unchanged `HEAD^{tree}` preserves tree-bound code evidence, but record the new head OID
- a reviewer approval is valid only when it names the exact candidate tree and PR body hash it reviewed

Never merge outputs produced against different candidate trees into one approval claim. Findings can move forward as historical evidence, but the final green state must refer to one tree.

## Outer and inner loops

An outer round is a fresh-context full-PR review followed by repair and delivery. An inner cycle repairs findings on that round's candidate until it stabilizes.

```text
outer round
  snapshot
  fresh review
  verify -> primary triage -> second triage -> resolve disagreements
  inner cycle
    fix
    validate
    cleanup until zero edits
    narrow re-review
    if accepted findings, return to verify/triage
  commit + push + PR body
  round summary
```

`max_fix_rounds` caps inner cycles. `max_outer_rounds` caps fresh rounds.

### Cap strategies

- `hard`: stop as soon as a cap is reached and classify current evidence.
- `ask`: ask the user whether to extend the cap when useful work remains.
- `reserve-confirmation`: keep the last outer slot for a fresh confirmation. If that slot finds and fixes issues, the result can be `capped-stabilized`, not `clean`.

Do not spend a reserved confirmation slot on another wide speculative pass when required validation is already failing. Repair the known failure first or report `capped-with-residuals`.

## Phase gates

The coordinator must enforce these gates as data, not prose:

```text
reviewed
  -> verified or explicitly deferred
  -> primary triaged
  -> second triaged in exhaustive mode
  -> disagreements resolved
  -> fix allowed
  -> validation green
  -> cleanup zero-edit pass
  -> narrow re-review green
  -> delivery allowed
```

Late findings from a fixer, validator, cleanup worker, or cold reviewer enter at `verified or explicitly deferred`. They never skip triage because the run is near completion.

## Cleanup convergence

A cleanup worker may edit dead code, naming, comments, docs, tests, and conformance violations only when behavior stays the same. After edits:

1. snapshot the new tree
2. invalidate old evidence
3. rerun affected validation
4. start another cleanup pass

The first zero-edit cleanup pass proves convergence. If cleanup exposes a behavior issue, record a finding and route it through the full gates.

## Growth guard

Capture initial metrics at preflight and current metrics after each delivered round:

- files changed
- additions plus deletions
- subsystems touched
- changed public interfaces
- findings by origin
- fixes that introduced later findings

Pause and surface a split or design choice when the diff doubles, crosses into a new subsystem, review fixes exceed original work, or review fixes create more accepted issues for two consecutive rounds. The user may approve continued growth. Record that approval under scope changes.

## Outcomes

Use one quality outcome:

- `clean`: required fresh zero rounds complete and final validation is green on the named tree
- `stabilized`: inner cycle green under a policy that does not require another fresh review
- `capped-stabilized`: repairs and validation green, but cap prevents required clean confirmation
- `capped-with-residuals`: accepted finding, cleanup edit, or required validation remains at cap

Use `blocked` as an operational status when authority, credentials, platform capacity, or external state prevents delivery. Also state which quality outcome was last supported, if any.
