# Design before expensive code

Most small changes do not need a design panel. Use extra design work when the change moves ownership, introduces a durable format, crosses module boundaries, or would be costly to reverse.

[`architect`](../../plugins/architect/README.md) settles usage and boundaries. [`arena`](../../plugins/arena/README.md) compares independent candidates for one artifact. [`swarm`](../../plugins/swarm/README.md) covers separate slices. [`adversarial-review`](../../plugins/adversarial-review/README.md) tries to break a proposed design or patch without editing it.

## Settle the caller experience with `architect`

```text
Use architect to design the import pipeline before implementation. Start with caller examples, then define types, ownership, failure behavior, and the module map. Stop before coding.
```

The checkpoint matters when the design contains a product, scope, safety, or one-way decision that only you can make. Internal agents may compare evidence and options. They do not decide for you by vote.

## Compare candidates with `arena`

```text
Use arena to produce three cache-key designs from this exact brief. Keep each candidate isolated. Judge compatibility, readability, migration cost, and collision risk.
```

Every candidate receives the same brief. A separate read-only judge scores the results. The coordinator picks a base, incorporates useful parts from the others, and verifies the synthesis.

Use `arena` for alternate answers to one question. Do not use it to divide a checklist.

## Cover independent slices with `swarm`

```text
Use swarm to check every package against its local validation command. Assign one package per worker and return one report with PASS, ISSUES, or BLOCKED for every package.
```

Use `swarm` when each worker owns a distinct slice or race arm. The parent must wait for every required result, identify dropouts, and consolidate the evidence.

## Pressure-test with `adversarial-review`

```text
Use adversarial-review on this design. Stay read-only. Look for invariant violations, migration gaps, and behavior regressions. Ignore style preferences unless they create a concrete cost.
```

Independent criticism is useful before a costly commitment and after a risky implementation. A finding matters because source evidence supports it, not because several agents repeated it.

## Isolate parallel writes

Give concurrent writers separate files, worktrees, branches, or temporary directories. Prefer removing shared state over adding locks. Use [`principle-separate-before-serializing-shared-state`](../../plugins/principle-separate-before-serializing-shared-state/README.md) when agents start competing for the same tree.

Subagents may exchange findings and coordinate dependencies. They may not send messages to people or external channels. The parent owns the final local artifact and the report to you.

Next: [Build the change](./04-build.md).
