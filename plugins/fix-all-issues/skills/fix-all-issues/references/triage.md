# Verification and triage

Triage converts reviewer claims into fix authority. Treat it as a hard phase gate.

## Finding record

Normalize each reviewer report to:

- `id`
- `fingerprint`
- `candidate_tree_oid`
- `origin`
- `severity`
- `confidence`
- `category`
- `invariant`
- `responsible_seam`
- `locations`
- `failure_mode`
- `evidence`
- `verification`
- `primary_verdict`
- `second_verdict`
- `disagreement_resolution`
- `disposition`
- `fix_evidence`
- `reopen_evidence`

Allowed origins are `original-pr`, `review-fix`, `pre-existing`, `cleanup-only`, and `reopened`.

## Fingerprints

Fingerprint the root cause, not wording or line number. Build it from the violated invariant, responsible seam, and failure mode. One bug with five callers is one finding unless the callers fail for independent reasons.

Persist accepted, rejected, and deferred fingerprints across outer rounds. Reviewers remain blind to them. After review, the coordinator:

1. normalizes new reports
2. maps them to prior fingerprints
3. merges new evidence
4. reopens a rejected fingerprint only if relevant lines changed or new runtime/code evidence exists

Do not inflate cumulative counts when reviewers rediscover the same root cause.

## Verification

A reviewer may mark a claim `verified` only after opening the cited code on the pinned candidate tree and proving the failure mode. Otherwise mark it `speculative`.

Send every speculative claim to a verifier with only the pinned tree, claim, and requested check. The verifier returns:

- `confirmed`, with cited evidence
- `refuted`, with cited evidence
- `needs-runtime-check`, with the exact check and required access

Verification must ignore later dirty worktree edits. If the candidate tree is no longer available, recreate it from Git objects or rerun review on the current tree.

## Primary triage

Accept when the claim is verified and has a concrete failure mode inside original or approved scope.

Reject when it is refuted, duplicate, cosmetic without a repository rule, based on an unstated product choice, or depends on compromise outside the changed trust surface.

Defer when it is concrete but needs external access, cross-team action, a larger approved refactor, or scope expansion. Use a reason such as `needs-runtime-check`, `scope-expansion`, `cross-team`, or `larger-refactor`.

Backward compatibility does not authorize new behavior, UX, analytics, or side effects. Ask or defer.

## Independent second triage

In exhaustive mode, the second triager receives:

- base OID and candidate tree OID
- normalized findings with evidence
- immutable original intent and approved scope changes
- current diff

It does not receive reviewer identities, reviewer rationales beyond normalized evidence, the primary verdict, desired batch plan, or dirty worktree state.

It independently returns accept/reject/defer and a reason for every finding. The coordinator investigates every disagreement against the pinned tree and records resolution. No fixer starts until all accepted findings have both verdicts and resolved disagreements.

## Late findings

Findings from fixers, validators, cleanup workers, or re-reviewers enter the same ledger. They require verification and both triage gates before a behavior edit. Do not let a late finding bypass review because a worker is already editing nearby files.

## Root-cause escalation

Trigger a bounded design/refactor proposal when the same invariant:

- causes three accepted findings
- survives two rounds
- requires the same defensive rule in multiple callers

The proposal must name the module, current interface, responsible seam, caller complexity that would disappear, smallest compatible migration, and tests through the new interface. Treat it as scope expansion unless original intent already requires it. After approval, add it to `scope.md` and triage it like any other fix.
