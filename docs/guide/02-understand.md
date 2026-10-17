# Understand the code before changing it

Editing code you do not understand is how subtle regressions ship, and that holds for the agent as much as for you. Agents usually fail in one of two ways. They misread what you want, or they lack the context to do the work right. [Say what goes in a prompt](./01-entry-point.md#say-what-goes-in-a-prompt) handles the first. This page handles the second.

Start with the question you need answered. [`how`](../../plugins/how/README.md) traces current mechanics. [`why`](../../plugins/why/README.md) investigates historical intent. [`explain-code`](../../plugins/explain-code/README.md) combines both. [`recall`](../../plugins/recall/README.md) rebuilds recent workspace context. Each one also makes the agent explain itself in words you can check. That is how you supervise an agent that may know the code better than you do.

## Start with a read-only investigation

When the cause is unclear, ask for findings, not a fix:

```text
Use engineering-mode. Investigate why background jobs time out every few hours. Give me what we know, what data you used, and your best hypotheses. Do not change any code yet.
```

"Do not change any code yet" routes this to the investigation playbook. It traces the code, adds history for questions about motivation, and returns a cited answer. For a choice between options, it returns a recommendation with the trade-offs. Asking "what data you used" makes the agent separate its evidence from its guesses. When the findings point at a fix, start the fix as a new task.

## Trace current behavior with `how`

```text
Use how to trace notification deduplication from the request entry point to the stored record. Check whether subscriber lookup repeats per recipient.
```

For a narrow symbol, one agent can follow callers, types, state changes, and outputs. For a subsystem, `how` can assign independent read-only lanes to internal subagents and then resolve their findings against the code. `how` explains and does not critique. Use [`adversarial-review`](../../plugins/adversarial-review/README.md) when you want a structural judgment of a design.

## Investigate intent with `why`

```text
Use why to find when the retry limit became five, what evidence supported it, and whether that evidence still applies.
```

`why` starts with source history and local documentation. It may inspect other read-only evidence that you placed in scope, such as issue history, observability, error tracking, or analytics. It cites direct evidence, labels inference, and reports missing records.

It never posts to a tracker or contacts an author. It does not search workplace chat, private correspondence, or another person's private space, even when such access exists.

## Combine mechanics and history with `explain-code`

```text
Use explain-code on the retry subsystem. Show the runtime flow, then explain which historical constraints still shape it.
```

Use this when the reason explains the mechanism. The final explanation should distinguish what the code proves from what history suggests.

It works on the agent's own choices too:

```text
Use explain-code on the change you just made. Why did you implement it this way and not with a queue? What did you trade off, and why?
```

Teaching helps the agent as much as you. An agent that has to explain its work must read the code and back each claim with evidence, instead of stating it confidently and moving on.

## Rebuild your own context with `recall`

```text
Use recall to catch me up on the export work in this workspace. Include the current branch state, decisions already made, and the next unresolved step.
```

`recall` stays inside the active workspace and the conversation history the host exposes. It does not scan unrelated projects or other people's conversations. Verify its summary against the current files before continuing old work.

Old sessions hold context that a fresh agent lacks. Start new work on an old topic by loading that context first, then hand over the new input:

```text
Use recall for my work on the virtualized list from yesterday, then read this bug report.
```

## Know when to stop reading

Understanding is sufficient when you can name:

- the input and output;
- the owning module;
- the important state transitions;
- the failure path; and
- the exact behavior the change must preserve.

If one of those remains a guess, keep tracing. If all five are clear, move to design or implementation.

Next: [Design the change](./03-design.md).
