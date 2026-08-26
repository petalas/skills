# Reviewer lenses

Build finite review assignments from the evidence packet. Risk decides mandatory coverage. Diff size only changes how many rows one reviewer receives.

## Change-contract and caller rows

Map each changed behavior before review:

| Field       | Required question                                                                  |
| ----------- | ---------------------------------------------------------------------------------- |
| behavior    | What observable result or invariant changes?                                       |
| attribution | Which responsibility-envelope category caused this row?                            |
| consumer    | Which screen, job, endpoint, hook, or external caller uses it?                     |
| operation   | What read, write, display, transition, or side effect occurs?                      |
| authority   | Which principal, tenant, clock, currency, locale, flag, or state is authoritative? |
| readiness   | What must exist before the operation is valid?                                     |
| fallback    | What happens while authority is unavailable or stale?                              |
| validator   | Which runtime and type checks enforce the contract?                                |
| test        | Which test or live check covers each semantic mode?                                |
| caller      | Which production caller and semantic mode depend on the row?                       |
| direct      | Does that caller directly consume or implement the changed contract?               |

The evidence packet stores these rows once. Reviewers receive relevant row IDs and read the listed repository or domain rules. They do not rebuild the entire matrix unless they find a missing direct caller.

## Baseline coverage rows

Every outer round assigns all of these:

- correctness, error paths, and state transitions
- compatibility, public behavior, and direct callers
- tests and missing input classes
- security, authorization, validation, secrets, and data integrity
- maintainability, dead code, performance, and repository conformance
- spec and proposed PR-body accuracy

Exhaustive mode also assigns adversarial and coverage rows. Adversarial work stays inside the changed trust boundary. Do not assume compromised credentials, forged signatures, full database access, or a broken primary auth gate unless the candidate weakens that gate.

## Risk-triggered rows

| Trigger                                                  | Required coverage                                        |
| -------------------------------------------------------- | -------------------------------------------------------- |
| React hook, provider, effect, callback, async state      | concurrency and lifecycle                                |
| date, timezone, UTC, local day, server time, device time | time-authority matrix                                    |
| debounce, optimistic state, cancellation, request token  | generation ownership and stale completion                |
| reactive query, subscription, Convex early return        | dependency tracking and reactivity                       |
| exported hook, helper, prop, default, validator          | production caller inventory and propagation              |
| native API, app state, permissions, device event         | overlapping request and native lifecycle                 |
| schema, route, event, public function                    | compatibility, migration, and missing input classes      |
| endpoint, callback, webhook, parser before auth          | focused red-team                                         |
| accepted fix changes a second caller                     | accepted-fix correctness and responsible-seam review     |
| second finding names the same invariant                  | mandatory root-cause consolidation and patch replacement |

## Temporal coverage

For async UI and native work, assign applicable transitions as explicit rows:

1. render and abandoned render
2. commit, layout effect, and passive effect
3. background, inactive, and active
4. authority, scope, date, or tenant change
5. debounce start and replacement
6. request resolve or reject
7. unmount

For stale completion, identify whether it can write older state, revert optimistic state, clear loading owned by a newer request, overwrite a newer token, or show feedback after ownership changed. Name the owner check that prevents the mutation.

## Interface and caller coverage

For every changed exported hook, provider, prop, default, validator, route, event, or helper:

1. search all production callers once while building the packet
2. group callers by semantic mode
3. record authority, readiness, and fallback per mode
4. verify tests cover each mode
5. flag silent defaults that preserve type compatibility but change behavior

Test-only callers do not prove production propagation. A direct caller issue is in the responsibility envelope even when its file was not in the original diff.

## Finding attribution

Every finding names:

- violated invariant
- responsible seam
- exact failure mode
- attribution category
- `in-envelope` or `out-of-envelope` responsibility with evidence
- whether a fix changes product behavior, compatibility, or authority

Do not use file distance or patch size to label something out of scope. An adjacent pre-existing issue must be independently reproducible without the candidate. A candidate-exposed issue is in-envelope even if the defective code predates the branch.

## Root-cause review

Fingerprint invariant, seam, and failure mode. The second accepted finding for the same invariant ends narrow caller patching. Review the existing patch set as one design and recommend consolidation or replacement at the responsible seam.

A deep fix removes rules from callers and can be proved through one stable interface. It does not need to be large. Growth thresholds cannot justify rejecting a qualifying finding.

## Finite assignments

Each reviewer receives:

- packet ID, base OID, candidate tree OID, and body hashes
- exact assigned coverage row IDs
- relevant contract and caller row IDs
- applicable repository and domain rule paths
- timebox and early-claim milestone
- no-edit and blind-context rules

At the early milestone, report a first claim or `no-claim-yet` with completed row IDs. Stop when every assigned row is checked or the timebox expires. Return unchecked row IDs and why they remain uncovered. Do not continue searching after the assigned lens is exhausted.

Fresh reviewers do not receive prior findings, verdicts, fix rationales, or desired outcomes. The coordinator deduplicates only after output arrives.
