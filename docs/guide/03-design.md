# Design before expensive code

Most small changes do not need a design panel. Use extra design work when the change moves ownership, introduces a durable format, crosses module boundaries, or would be costly to reverse.

[`architect`](../../plugins/architect/README.md) settles usage and boundaries. [`arena`](../../plugins/arena/README.md) compares independent candidates for one artifact. [`swarm`](../../plugins/swarm/README.md) covers separate slices. [`adversarial-review`](../../plugins/adversarial-review/README.md) tries to break a proposed design or patch without editing it.

The two most common design mistakes are taking the agent's first design and polishing a plan that no code has tested. Plan through code instead: prototypes answer the open questions, a README or tutorial sets the target, and the written plan comes last.

## Settle the caller experience with `architect`

```text
Use architect to design the import pipeline before implementation. Start with caller examples, then define types, ownership, failure behavior, and the module map. Stop before coding.
```

The checkpoint matters when the design contains a product, scope, safety, or one-way decision that only you can make. Internal agents may compare evidence and options. They do not decide for you by vote.

The design is not sacred once code starts. If implementation shows the same workaround in unrelated places, or types that only compile with forced casts, `architect` treats that as proof the design is wrong. It returns to the sketch instead of patching around it.

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

## Prototype instead of debating

Do not take the first design. Ask for a few, and pick from evidence you can see:

```text
Use engineering-mode. Prototype a few options for the new dropdown menu. Capture screenshots or recordings for me to compare.
```

The prototype playbook builds throwaway sketches in a scratch directory, puts the variants behind one switcher, drives each one, and captures screenshots or timings. It works for behavior and algorithms too, not only UI. A prototype lets the agent answer its own open question by running something instead of asking you, and it leaves room for an option you would not have thought of.

The same idea scales up to a real design. Pair `architect` with prototypes and keep a review gate:

```text
Use engineering-mode. We need rate limiting for external webhooks. Use architect first, and answer open questions with prototypes. Let me review before proceeding.
```

Do not spend reviewers on an abstract plan. Point `adversarial-review` at a plan with no code behind it and the reviewers invent risks and edge cases that will never happen. Let prototypes settle the questions, then review what got built.

## Write the README first for shared code

For a package or API that other code will use, start with the doc a user would read:

```text
Use engineering-mode. First write a tutorial for how I would use the new config package. Then use explain-code to show me why it beats the current one.
```

Writing the tutorial first forces the caller's view. You describe the API to a hypothetical user and work back to the implementation. The doc also becomes a concrete target the agent checks its own work against. Use [`technical-writing`](../../plugins/technical-writing/README.md) when the doc itself matters, so a tutorial stays a tutorial instead of drifting into reference and explanation at once.

## Plan after the design settles

When you want a written plan, ask for it once the design is settled:

```text
Turn this design into a plan in a local document. Each step is a small change that ends in its own check.
```

Settle any remaining open questions by prototype first. A passing test suite alone does not count as a step's check. Name the proof the step produces, such as a command output, a replayed fixture, or a captured screen. For a migration, state the bar in the prompt:

```text
Plan the migration of our UI library to the new styling system. Each step ends in a visual comparison against the current output. The result must match the original exactly, bugs included.
```

"Bugs included" keeps the migration from quietly fixing things on the way, which would make the old and new output impossible to compare. Use [`principle-sequence-verifiable-units`](../../plugins/principle-sequence-verifiable-units/README.md) to keep each step checkable. To run a settled plan as a large unattended task, hand it to [`auditable-run`](../../plugins/auditable-run/README.md). The plan is a local working document. Delete it when the work lands, unless you decide to keep it.

## Isolate parallel writes

Give concurrent writers separate files, worktrees, branches, or temporary directories. Prefer removing shared state over adding locks. Use [`principle-separate-before-serializing-shared-state`](../../plugins/principle-separate-before-serializing-shared-state/README.md) when agents start competing for the same tree.

Subagents may exchange findings and coordinate dependencies. They may not send messages to people or external channels. The parent owns the final local artifact and the report to you.

Next: [Build the change](./04-build.md).
