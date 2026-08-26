# Verification and triage

Triage decides fix or route authority. It cannot make a verified known issue disappear.

## Finding record

Normalize every claim into `findings.json` with:

- stable ID and root-cause fingerprint
- candidate tree and packet ID
- origin, attribution, and responsibility
- severity, confidence, category, invariant, and responsible seam
- locations, concrete failure mode, and evidence
- verification status and independent-check reason
- primary and independent verdicts
- disagreement and resolver result only when needed
- disposition, route, fix evidence, and reopen evidence

Origin describes when the issue entered the run: `original-pr`, `review-fix`, `pre-existing`, `cleanup-only`, or `reopened`. Attribution describes why the current PR does or does not own it. Keep the fields separate.

## Fingerprints and deduplication

Fingerprint invariant, responsible seam, and failure mode. One bug with five callers is one finding unless callers violate independent contracts.

After blind review:

1. normalize reports
2. merge duplicate evidence
3. compare fingerprints with prior rounds
4. reopen a refuted or rejected fingerprint only when relevant code changed or new evidence exists
5. count unique root causes, not reports

The second accepted finding for one invariant sets `consolidation_required=true`. Do not authorize another narrow patch until the coordinator records patch replacement or a responsible-seam design.

## Verification

A reviewer may mark evidence sufficient only after opening cited code on the pinned candidate and proving the failure mode. Send speculative claims to a verifier with the packet slice, claim, and exact requested check.

The verifier returns:

- `confirmed`, with cited code or runtime evidence
- `refuted`, with cited evidence
- `needs-runtime-check`, with the exact check and access needed

P0/P1, low-confidence, disputed, security, data-loss, migration, public-contract, and responsibility-boundary claims receive an independent verification check even if the reviewer marked them confirmed.

Verification ignores later worktree edits. If the pinned candidate cannot be recreated, build a new packet and rerun the claim.

## Responsibility decision

Classify a confirmed claim before triage:

- `in-envelope`: originating spec or diff, candidate-changed, candidate-exposed, direct contract or production caller, or accepted-fix correctness
- `out-of-envelope`: independently reproducible adjacent pre-existing defect or a new product decision

Record evidence for the classification. A file outside the original diff can still be a direct caller. A defect in old code can still be candidate-exposed. Patch size and growth do not make a finding out-of-envelope.

## Batch triage

Wait for the review batch, then send normalized verified findings for one packet to one primary triager. In exhaustive mode, send the same normalized batch to one independent triager without the primary verdict, reviewer identities, fix plan, or desired outcome.

Quick mode may skip independent triage only for confirmed ordinary P2/P3 findings that do not affect security, data integrity, public contracts, migrations, scope, responsibility, or disputed evidence. P0/P1, scope expansion, low confidence, disputed claims, and envelope changes always require both.

Triage verdicts are:

- `accept`: confirmed, concrete, and in-envelope
- `route`: confirmed and out-of-envelope, with a named route
- `reject`: refuted, duplicate, not actionable, or based only on an unsupported product assumption

Do not use `reject` for real but inconvenient work. Do not use `route` for a qualifying issue because metrics grew or a deep fix takes longer.

Run a resolver only when verdicts differ. It receives both verdicts and the exact disputed evidence. Agreement does not need a ceremonial resolution step.

## Routes

A `route` verdict must select:

- `deferred`, with the reason and reconsideration condition
- `routed-follow-up`
- `routed-user-authority`
- `routed-external-owner`

Include title, evidence, acceptance condition, next action, and owner when known. If the run cannot create an external issue, put a ready-to-file record in the ledger and final report. A deferred or routed issue remains known and unfixed.

Scope expansion is not one category. A direct-caller compatibility repair is in-envelope. New UX, analytics, behavior, or side effects are product decisions and require user authority. If the user approves, append the approval to `scope.md`, reclassify the finding, and triage it against the new scope.

## Fix gate

A fixer may start only when:

1. verification is sufficient
2. attribution and responsibility are recorded
3. primary triage accepted the finding
4. independent triage accepted when required
5. any real disagreement is resolved
6. root-cause consolidation is complete when triggered

Route records use the same verification and required triage gates before they close.

Late findings from fixers, validation, cleanup, narrow review, or cold confirmation enter the same batch gate. A worker may report a nearby issue but may not fix it without authorization.

## Growth and correctness

When growth thresholds trip, triage does not rerun to find an excuse to reject claims. The coordinator groups findings by invariant, pauses overlapping fixes, and asks the primary and independent triagers to assess one consolidated repair or patch replacement.

Only a real product, compatibility, external-system, or authority change needs user approval. Work required to make an accepted fix correct remains in-envelope.
