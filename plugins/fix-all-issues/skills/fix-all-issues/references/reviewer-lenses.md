# Reviewer lenses

Build review coverage from the change contract and risk signals. Diff size controls fanout only after risk decides which lenses are mandatory.

## Change-contract matrix

Before reviewer fanout, map every changed behavior:

| Field     | Question                                                                                     |
| --------- | -------------------------------------------------------------------------------------------- |
| consumer  | Which screen, job, endpoint, hook, or external caller uses it?                               |
| operation | What read, write, display, transition, or side effect occurs?                                |
| authority | Which principal, tenant, clock, currency, locale, flag, or lifecycle state is authoritative? |
| readiness | What must exist before the operation is valid?                                               |
| fallback  | What happens while authority is unavailable or stale?                                        |
| validator | Which runtime and type checks enforce the contract?                                          |
| test      | Which test or live check covers each mode?                                                   |

Treat auth principal, tenant, currency, locale, feature flag, lifecycle state, request generation, optimistic owner, device clock, and server clock as authority candidates. Many multi-round bugs come from choosing different authority at different callers.

## Baseline lenses

Always cover:

- correctness and error paths
- compatibility and public behavior
- tests and missing input classes
- security, auth, validation, secrets, and data integrity
- maintainability, dead code, performance, and repository conformance

Exhaustive mode also includes an adversarial reviewer and a coverage reviewer. The adversarial reviewer must stay inside the changed trust surface. It may not assume leaked credentials, forged signatures, full database access, or an already-broken primary auth gate unless the diff weakens that gate.

## Risk-triggered specialists

Add a specialist when any trigger appears:

| Trigger                                                  | Required lens                             |
| -------------------------------------------------------- | ----------------------------------------- |
| React hook, provider, effect, callback, async state      | concurrency and lifecycle                 |
| date, timezone, UTC, local day, server time, device time | time-authority matrix                     |
| debounce, optimistic state, cancellation, request token  | generation ownership and stale completion |
| reactive query, subscription, Convex early return        | dependency tracking and reactivity        |
| exported hook, helper, prop, default, validator          | caller inventory and propagation          |
| native API, app state, permissions, device event         | overlapping request and native lifecycle  |
| schema, route, event, public function                    | compatibility and missing input classes   |
| new endpoint, callback, webhook, parser before auth      | focused red-team                          |

Risk score should consider subsystems, public interfaces, shared callers, async state, lifecycle, native APIs, trust boundaries, and data migrations. Line count alone cannot lower required coverage.

## Temporal state-machine review

For async UI and native work, enumerate applicable transitions:

1. render
2. abandoned render
3. commit
4. layout effect
5. passive effect
6. background or inactive
7. active
8. authority, scope, or date change
9. debounce start and replacement
10. request resolve or reject
11. unmount

For every stale completion ask:

- can it write state for an older scope?
- can it revert newer optimistic state?
- can it clear loading owned by a newer request?
- can it delete or overwrite a newer token?
- can it show feedback after ownership changed or the module unmounted?

Require the reviewer to state who owns each state transition and how stale work proves ownership before mutating.

## Caller inventory

For every changed exported hook, provider, optional prop, default, validator, route, or helper:

1. search all production callers
2. group them by semantic mode, not just file
3. record which authority and fallback each caller expects
4. verify tests cover each mode
5. flag silent defaults that preserve type compatibility but change behavior

A changed interface is not reviewed until its caller inventory is complete. Test-only callers do not prove production propagation.

## Invariant and root-cause review

Every finding names the invariant it violates. The orchestrator fingerprints root cause from invariant, responsible seam, and failure mode. Do not create separate findings for every caller when one module should enforce the rule.

Escalate to a bounded design/refactor pass when:

- one invariant creates three accepted findings
- the same fingerprint survives two rounds
- multiple callers need the same guard or normalization
- a new optional input relies on every caller remembering a fallback

The goal is the smallest deep fix at the responsible seam. A fix is deep when callers gain the behavior without learning more rules and tests can prove it through one interface.

## Blind review

Fresh reviewers receive:

- base and candidate tree OIDs
- exact diff or checked-out immutable tree
- immutable original intent
- current PR body and its hash
- repository rules and assigned lens
- change-contract rows relevant to the lens

They do not receive prior findings, accepted/rejected verdicts, fix rationales, or the desired answer. The coordinator deduplicates after outputs arrive.
