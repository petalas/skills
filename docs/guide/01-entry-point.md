# Start from the outcome

The optional [`engineering-mode`](../../plugins/engineering-mode/README.md) router is the front door for multi-step software work. Give it the result you want and how to prove that result. It chooses one playbook and keeps skipped steps visible.

You can also invoke any focused skill directly. Use the router when the job spans investigation, implementation, and verification. Use a focused skill when the request is already narrow.

## Give the router a real finish condition

```text
Use engineering-mode. Add JSON output to this command. Text output must stay byte-identical. Run both forms against the sample project and show the output.
```

The router matches the task to a workflow such as investigation, bug fix, performance work, feature development, refactoring, prototype, skill authoring, or a local autonomous run. It reads repository instructions first and checks the result against the real artifact.

You do not need special invocation syntax. If the host exposes skills through a menu, command, mention, or natural-language trigger, use that mechanism. The skill behavior stays the same.

## Invoke a focused skill when the route is obvious

Examples:

- Ask [`how`](../../plugins/how/README.md) to trace runtime behavior.
- Ask [`architect`](../../plugins/architect/README.md) to settle types and module boundaries.
- Ask [`regression-test`](../../plugins/regression-test/README.md) for a cheap failing test around a known defect.
- Ask [`blast-radius`](../../plugins/blast-radius/README.md) to prove what a diff could break outside its edited files.
- Ask [`worktree-cleanup`](../../plugins/worktree-cleanup/README.md) to audit local worktrees before removing any.

Do not list a chain of skills unless you intend to override the router. Hand-written sequences often skip a required check or put design after implementation.

## Use capabilities, not host names

Describe the capability the work needs:

- "Use two independent read-only agents" rather than naming a task API.
- "Give concurrent writers separate worktrees" rather than assuming a worktree command.
- "Drive the running app through the available browser capability" rather than naming one browser product.
- "Keep a local decision log" rather than relying on a remote tracker.

If the host cannot provide a capability, collapse that step into the main agent and report the lost independence or coverage.

## Keep communication inside the run

Subagents may communicate with each other, but no agent may communicate with a person. Agents may report to you in the active task. They must not send, post, reply, comment, or publish through an external service. An installed and authenticated communication tool does not change this rule.

Read-only evidence is allowed when you place it in scope. Agents may inspect source control, local docs, issue history, logs, traces, error tracking, and product data. Reading does not authorize a reply or mutation.

Next: [Understand the code](./02-understand.md).
