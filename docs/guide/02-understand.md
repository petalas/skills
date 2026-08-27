# Understand the code before changing it

Start with the question you need answered. [`how`](../../plugins/how/README.md) traces current mechanics. [`why`](../../plugins/why/README.md) investigates historical intent. [`explain-code`](../../plugins/explain-code/README.md) combines both. [`recall`](../../plugins/recall/README.md) rebuilds recent workspace context.

## Trace current behavior with `how`

```text
Use how to trace notification deduplication from the request entry point to the stored record. Check whether subscriber lookup repeats per recipient.
```

For a narrow symbol, one agent can follow callers, types, state changes, and outputs. For a subsystem, `how` can assign independent read-only lanes to internal subagents and then resolve their findings against the code.

Ask for critique only when you want structural judgment:

```text
Explain the sync service first, then critique its ownership boundaries. Do not edit anything.
```

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

## Rebuild your own context with `recall`

```text
Use recall to catch me up on the export work in this workspace. Include the current branch state, decisions already made, and the next unresolved step.
```

`recall` stays inside the active workspace and the conversation history the host exposes. It does not scan unrelated projects or other people's conversations. Verify its summary against the current files before continuing old work.

## Know when to stop reading

Understanding is sufficient when you can name:

- the input and output;
- the owning module;
- the important state transitions;
- the failure path; and
- the exact behavior the change must preserve.

If one of those remains a guess, keep tracing. If all five are clear, move to design or implementation.

Next: [Design the change](./03-design.md).
