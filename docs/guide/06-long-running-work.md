# Run long work safely

Unattended work needs a contract, not a duration. Define a finish predicate, isolate writable state, bound authority, and keep a local decision trail.

Use [`auditable-run`](../../plugins/auditable-run/README.md) for a large execution task after product and one-way user decisions are settled. Use [`show-me-your-work`](../../plugins/show-me-your-work/README.md) to keep the run reviewable.

## Write the run contract

```text
Migrate every caller to the new parser in an isolated worktree from the documented base.
Done means zero old callers, every parser fixture passes, and the old API is deleted.
Commit only if the current workflow already grants that authority.
Keep a local decision trail. Stop if progress requires a product decision, destructive action, external write, or relaxed finish condition.
```

The contract names:

- the goal;
- a predicate that can pass or fail;
- the writable scope;
- allowed version-control actions; and
- the stop conditions.

Use the host's available recurring wake, heartbeat, or continuation capability when work must resume across turns. The wake mechanism does not widen authority.

## Run one checked unit at a time

Each iteration should:

1. Check the finish predicate.
2. Choose the smallest justified unit.
3. Make the change in isolated state.
4. Verify the real artifact.
5. Keep a proven change or discard a failed experiment.
6. Append one decision row.

Use [`principle-sequence-verifiable-units`](../../plugins/principle-sequence-verifiable-units/README.md) when a migration or sweep starts growing into one uncheckable batch.

## Keep a local audit trail

`show-me-your-work` records timestamp, phase, decision, reason, evidence, and result in a local TSV file. Evidence pointers must resolve to commands, files, diffs, tests, or captured artifacts. Remove invented or aspirational rows before handoff.

Ask an independent internal reviewer to compare the trail with the actual workspace state. The reviewer can flag weak evidence, risky pivots, and skipped checks. It does not contact anyone or post the review.

## Scale with internal agents

Internal subagents may communicate with each other. Partition independent slices with [`swarm`](../../plugins/swarm/README.md), give writers separate worktrees or directories, and keep one parent responsible for the finish predicate and consolidated evidence.

No agent may communicate with another person or external channel. A long-running agent must never post status, send a notification, reply to a review, or contact someone because you are away. It writes status locally for you.

## Stop honestly

Stop and report `blocked` when progress requires missing authority, a one-way user decision, inaccessible evidence, or a destructive step outside the contract. Do not weaken the finish predicate to call the run complete. A timed run without a passing predicate is unfinished, even if it did useful work.

Next: [Steer with principles](./07-principles.md).
