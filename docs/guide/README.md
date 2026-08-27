# Solo developer workflow guide

This guide shows how to use the skills in this repository as one developer. Start with a goal and a checkable result. Use a focused skill when you know the job, or let [`engineering-mode`](../../plugins/engineering-mode/README.md) choose a playbook.

The workflow does not depend on one agent host. Instructions name capabilities such as repository search, internal subagents, isolated worktrees, and local verification. Use whatever equivalent the current environment provides.

Internal agents may coordinate and message each other. They do not message other people or write to external communication channels. They do not post comments, send email or chat, file issues, or reply through an authenticated service. When communication would help, they prepare a local draft for you to send yourself. Read the full [solo agent policy](../SOLO_AGENT_POLICY.md).

## Read the guide

1. [Start from the outcome](./01-entry-point.md). Pick a focused skill or route the task through `engineering-mode`.
2. [Understand the code](./02-understand.md). Trace current behavior, recover history, and rebuild context before editing.
3. [Design the change](./03-design.md). Choose boundaries, compare candidates, and use parallel agents without sharing writes.
4. [Build the change](./04-build.md). Reproduce defects, preserve behavior during refactors, and keep the diff small.
5. [Verify the result](./05-verify.md). Check the real artifact and record evidence before reporting success.
6. [Run long work safely](./06-long-running-work.md). Use a finish predicate, isolated state, and a local decision trail.
7. [Steer with principles](./07-principles.md). Use the principle names as compact corrections during a task.
8. [Copy practical recipes](./08-recipes-and-pitfalls.md). Start from working prompts and avoid common failure modes.

Read the pages in order once. After that, use each page on its own.

## The shortest useful prompt

State the behavior, the constraint, and the proof:

```text
Fix the duplicate export rows. Reproduce the retry case first. Done means the saved output has one row and the existing export fixtures still pass.
```

That is enough for `engineering-mode` to select a bug-fix workflow. It is also enough for a general coding agent to work without the router. The finish condition matters more than naming a ceremony.

## Provenance

This guide adapts the pstack guide at commit `799151d91b6e12ee7dbd09f708eec108d7de9b3b` for host-neutral solo development. The adaptation removes team communication, remote review, shipping, and host-specific instructions. See [the third-party notice](./THIRD_PARTY_NOTICES.md) for source paths and the MIT license.

Next: [Start from the outcome](./01-entry-point.md).
