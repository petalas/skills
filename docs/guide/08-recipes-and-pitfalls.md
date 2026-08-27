# Practical recipes and pitfalls

These prompts work with a skill invocation mechanism or ordinary language. Replace the examples with your paths, invariants, and checks.

## Understand an unfamiliar subsystem

```text
Use how to trace initialization from entry point to ready state. Then use why to find the change that introduced the current retry behavior. Stay read-only.
```

Mechanics first, history second. Expect exact file pointers and evidence sources.

## Get independent design attempts

```text
Use arena for three designs of this file format. Keep candidates isolated. Judge forward compatibility, migration cost, and how hard each format is to misuse.
```

Use `arena` for several answers to one brief. Use `swarm` for several slices of one checklist.

## Check packages in parallel

```text
Use swarm to run each package's documented check. Assign one package per internal worker. Return one result for every package and identify any worker that did not finish.
```

## Review a branch skeptically

```text
Use adversarial-review on the branch diff. Do not edit. Report only evidence-backed bugs, regressions, invariant breaks, and missing verification.
```

## Fix a bug through a cheap failing test

```text
Reproduce the duplicate write first. If the existing harness exposes a narrow seam, use regression-test. Fix the cause, rerun the reproduction, and run the nearby suite.
```

Do not build a large mock harness when the real command is cheaper and stronger.

## Keep a run honest while away

```text
Continue locally until every fixture passes and zero old callers remain. Use isolated writable state and keep a decision trail. Stop for missing authority, a product decision, or any external action. Do not message or notify anyone.
```

## Redirect a drifting task

```text
The current goal is reproduction. Do not implement a fix yet.
```

```text
Apply prove it works. Show the real output, not the build log.
```

```text
Apply unslop to the README. Remove filler, generic claims, and decorative structure.
```

## Ask for plain language

```text
Use bro to restate the last explanation in plain language. Keep the technical facts, but cut jargon and shorten it.
```

[`bro`](../../plugins/bro/README.md) changes the wording, not the underlying result.

## Avoid these failure modes

- **Enumerating a ceremony.** State the goal, constraints, and evidence. Name a skill only when it changes the default route.
- **Using a duration as done.** "Work for four hours" cannot pass or fail. Give the run a predicate.
- **Letting parallel writers share a tree.** Give them disjoint files, worktrees, branches, or temporary directories.
- **Using `arena` for coverage.** `arena` compares candidates for one artifact. `swarm` partitions work and aggregates results.
- **Accepting review findings by vote.** Check every finding against source and the task's specification.
- **Reporting success from a proxy.** A build, typecheck, or unit suite may be necessary. Run the changed behavior too.
- **Treating read access as write authority.** An agent may inspect an issue or log placed in scope. It may not reply, mutate, or contact a person.
- **Using signed-in communication tools.** Availability and authentication do not grant permission. Keep drafts local for the user.
- **Editing a skill during unrelated feature work.** Capture the lesson locally, then change and evaluate the skill as its own task.

Back to the [guide index](./README.md).
