# PR delivery

Delivery aligns Git history, remote branch state, PR metadata, and the durable run ledger with the validated tree.

## Metadata preflight

At the start and before final delivery, inspect:

- target and base branches
- draft state and mergeability
- required labels and reviewers from repository policy
- current checks and review threads
- unresolved comments
- current title and body
- stale claims about scope, generated files, tests, file counts, or deployment

Do not change labels, reviewers, or thread state unless the user or repository workflow authorizes it. Report required metadata that remains missing.

## Original intent and current body

Capture original intent before review-driven edits in `scope.md`. Keep approved scope changes separate. The PR body is a current delivery document, not the historical source of intent.

Always fetch the latest body immediately before editing:

```bash
gh pr view <pr> --json body --jq .body > <run-dir>/pr-body.md
gh pr edit <pr> --body-file <run-dir>/pr-body.md
```

Adapt commands to repository instructions. Never compose a replacement body without reading the current one.

Fold review fixes into existing sections so the body describes the final result as one coherent change. Remove claims that became false. Do not append a running "additional fixes" diary.

## Stable PR body facts

Include:

- final behavior and scope
- important compatibility notes
- stable validation commands
- live paths checked
- true residual risks and follow-ups

Keep volatile evidence in the run ledger and final report. Do not put these in the body:

- commit SHA or tree OID
- intermediate file or line counts
- intermediate exact test totals
- round-by-round findings counts
- transient check status

Exact totals may be included only when they are a durable repository contract, not a snapshot likely to change before merge.

## Commit and push

Use repository commit guidance. Inspect the exact diff, stage only intended work, run required validation, and create focused conventional commits. Never add AI authorship or co-authorship.

Push normally. A successful push must contain the validated tree. Compare local and remote tree identity after push when practical.

History rewrite requires separate authority and safety checks. Use `--force-with-lease`, never plain `--force`. After rewrite:

1. compare `HEAD^{tree}` with the previously validated tree
2. invalidate evidence if it changed
3. rerun the full required validation
4. push and record the remote OID

## Round delivery report

Return to the main orchestrator:

- round number and coordinator identity
- start and delivered tree OIDs
- unique accepted/fixed/deferred/rejected fingerprints
- origin of every accepted finding
- red-green or mutation evidence
- validation and cleanup results bound to delivered tree
- commits and remote push state
- PR body fetch/edit result and new body hash
- metadata gaps
- growth thresholds
- residual risks
- recommended next state: confirm, continue inner repair, ask, or stop with named outcome
