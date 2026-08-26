# PR delivery

Delivery aligns the validated tree, remote branch, body phases, routes, and run ledger.

## Metadata preflight

At outer-round start and final delivery, inspect:

- target and base branches
- draft state and mergeability
- current checks, review threads, labels, and requested reviewers
- unresolved comments
- current title and body
- stale scope, validation, generated-file, or deployment claims

Do not change labels, reviewers, or thread state without user or repository authority. Report missing metadata.

## Body phases

Keep original intent immutable in `scope.md`. Keep the remote and proposed bodies separate:

1. fetch remote body into `pr-body.md`; record `remote_body_hash`
2. create `proposed-pr-body.md`; record `proposed_body_hash`
3. cold-review the proposal with the exact candidate tree
4. immediately before editing, fetch remote body again
5. if `remote_body_hash` changed, merge the new remote content into the proposal, rehash, and repeat body review
6. edit with the reviewed proposal
7. fetch the delivered remote body and record `delivered_body_hash`

Adapt commands to repository instructions. A typical flow is:

```bash
gh pr view <pr> --json body --jq .body > <run-dir>/pr-body.md
gh pr edit <pr> --body-file <run-dir>/proposed-pr-body.md
gh pr view <pr> --json body --jq .body > <run-dir>/delivered-pr-body.md
```

Never overwrite the current remote body from a stale local copy. Never label a proposed hash as remote evidence.

## Stable PR body facts

Fold fixes into existing sections so the body describes one coherent final change. Include final behavior, compatibility notes, stable validation commands, live paths checked, and true residual risks or follow-ups.

Keep volatile details in run artifacts and the final report. Do not put commit OIDs, tree OIDs, intermediate diff counts, round finding counts, or transient check status in the PR body.

For routed findings, include only user-relevant follow-up when repository convention supports it. Keep full evidence in `findings.json`.

## Commit and push

Follow repository commit guidance. Inspect the exact diff, stage intended files only, run required validation, and create focused Conventional Commits without AI attribution.

Push normally. Compare local and remote tree identity. A successful push must contain the candidate supported by the validation ledger.

History rewrite requires separate authority. Use `--force-with-lease`, never plain `--force`. A changed rewritten tree invalidates evidence and requires a new packet, cold zero, and validation. An unchanged tree preserves tree evidence while head OIDs change.

## Route delivery

Before terminal state, confirm every verified out-of-envelope finding has:

- route kind, including `deferred` when no external route is ready
- title and evidence
- acceptance condition
- owner or explicit `unknown`
- next action
- external artifact URL or `not-created` reason

Do not create an issue, message a person, or mutate another tracker unless invocation or repository workflow authorizes it. A ready-to-file route is still durable. It is not a completed fix.

## Round delivery report

Return to the main orchestrator:

- round number, coordinator, pool lifecycle, and elapsed phases
- start and delivered tree OIDs
- `remote_body_hash`, `proposed_body_hash`, and `delivered_body_hash`
- findings by attribution, responsibility, disposition, and route
- root-cause consolidations and patch replacements
- red-green or mutation evidence
- executed, reused, invalidated, failed, and blocked validation rows
- cold-zero and post-cleanup narrow-review results
- commits, remote push state, and PR body result
- growth triggers and responses
- capacity, repeated-work, and serialization alarms
- residual risks and recommended next state

## Final delivery state

Use `clean` only when fresh-zero, final-tree validation, delivery, and no-route requirements pass. Use `scope-routed` when in-envelope proof passes but verified adjacent or product issues remain routed. Use `blocked` or a capped state when their conditions apply. Do not present routed or capped work as cleanly fixed.
