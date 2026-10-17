# Practical recipes and pitfalls

These prompts work with a skill invocation mechanism or ordinary language. Replace the examples with your paths, invariants, and checks.

## Understand an unfamiliar subsystem

```text
Use how to trace initialization from entry point to ready state. Then use why to find the change that introduced the current retry behavior. Stay read-only.
```

Mechanics first, history second. Expect exact file pointers and evidence sources.

## Restate a noisy report before touching code

```text
Read this report. Restate the underlying issue in your own words, in plain language. Do not change any code yet.
```

A misreading shows up in the restatement, where it costs one message to correct. Keep your own theory to yourself until the agent has stated its own. [`in-your-own-words`](../../plugins/in-your-own-words/README.md) does the same on request when it is installed.

## Sharpen a task before it starts

```text
Use sharpen, then migrate the settings page to the new form library.
```

[`sharpen`](../../plugins/sharpen/README.md) asks how an expert would approach the task, what you are really after, and whether the task is over- or underspecified. It keeps one outside check that the result is right, then does the work. It does not hand back a rewritten prompt.

## Investigate before fixing

```text
Use engineering-mode. Investigate why background jobs time out every few hours. Give me what we know, what data you used, and your best hypotheses. Do not change any code yet.
```

You get a cited answer that separates evidence from guesses. Start the fix as a new task once the cause is clear.

## Prototype before you pick

```text
Use engineering-mode. Prototype a few options for the settings layout. Put them behind a switcher and capture screenshots of each.
```

You pick from things that run, not from descriptions. The agent answers its own layout and timing questions along the way.

## Turn a settled design into a plan

```text
Turn this design into a plan in a local document. Each step is a small change that ends in its own check.
```

Ask only after the design settles. Each step names the proof it produces, so the plan can be executed and checked one unit at a time.

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

## Reproduce and fix a report with proof

```text
Use engineering-mode. Reproduce this with the project's verify skill. If it reproduces on the current main branch, fix it and show me a recording as proof.
```

"If it reproduces" lets the run stop early when the bug is already gone. The recording lets you check the fix before you read the diff.

## Vet a number before you rely on it

```text
Use benchmark-checklist to vet this 40% speedup before I put it in the change description.
```

You get faster, slower, no measurable difference, or inconclusive, with the run count, the range, and what limits the number. See [`benchmark-checklist`](../../plugins/benchmark-checklist/README.md).

## Stop correcting the same mistake

```text
Use correct. Agents keep adding new config flags without registering them in the schema.
```

[`correct`](../../plugins/correct/README.md) fixes the repository at the highest level that works: architecture, then types or a lint, then a test, with docs last. It proves each new check fails on a real past mistake. It commits only when you authorize commits. Otherwise it leaves the changes for you to review.

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
- **Leading with your theory of the cause.** The agent searches wherever you pointed. Ask it to restate the problem first, then share your hunch.
- **Taking the first design.** One attempt locks in the first shape the model thought of. Ask for prototypes or `architect`, and pick from evidence.
- **Polishing an abstract plan.** Adversarial review of a plan with no code behind it invents risks that will never happen. Settle the open questions with prototypes, then review what got built.
- **Looping before you trust the loop.** A loop that cannot verify its own work only makes unchecked work faster. Get the verification skill working first.
- **Trusting an unvetted number.** A warm cache or a skipped code path can fake a speedup. Run `benchmark-checklist` before the number goes anywhere.
- **Correcting the same mistake by hand.** A correction in chat helps one run. `correct` fixes the repository so no later run repeats it.
- **Letting parallel writers share a tree.** Give them disjoint files, worktrees, branches, or temporary directories.
- **Using `arena` for coverage.** `arena` compares candidates for one artifact. `swarm` partitions work and aggregates results.
- **Accepting review findings by vote.** Check every finding against source and the task's specification.
- **Reporting success from a proxy.** A build, typecheck, or unit suite may be necessary. Run the changed behavior too.
- **Treating read access as write authority.** An agent may inspect an issue or log placed in scope. It may not reply, mutate, or contact a person.
- **Using signed-in communication tools.** Availability and authentication do not grant permission. Keep drafts local for the user.
- **Editing a skill during unrelated feature work.** Capture the lesson locally, then change and evaluate the skill as its own task.

Back to the [guide index](./README.md).
