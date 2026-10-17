# Start from the outcome

The optional [`engineering-mode`](../../plugins/engineering-mode/README.md) router is the front door for multi-step software work. Give it the result you want and how to prove that result. It chooses one playbook and keeps skipped steps visible.

You can also invoke any focused skill directly. Use the router when the job spans investigation, implementation, and verification. Use a focused skill when the request is already narrow.

## Give the router a real finish condition

```text
Use engineering-mode. Add JSON output to this command. Text output must stay byte-identical. Run both forms against the sample project and show the output.
```

The router matches the task to a workflow such as investigation, bug fix, performance work, feature development, refactoring, prototype, skill authoring, or a local autonomous run. It reads repository instructions first and checks the result against the real artifact.

You do not need special invocation syntax. If the host exposes skills through a menu, command, mention, or natural-language trigger, use that mechanism. The skill behavior stays the same.

## Say what goes in a prompt

A useful prompt carries up to five things, and each one fits in a sentence:

- **The goal.** Say what is wrong, or what you want.
- **The done check.** It must be able to pass or fail. "Make it better" and "work on it for an hour" are not checks.
- **The proof you want to see.** Ask for the real command output, a recording of the flow, the stored value, or a before-and-after number.
- **What you already know.** A symptom, a repro step, a log line, or a file path saves the agent a search.
- **The real constraints.** "Reproduce first", "do not change any code yet", "zero behavior change", and "let me review before proceeding" each change what the agent does.

Here is one prompt with all five:

```text
Use engineering-mode. The CSV export drops its last row since yesterday's change. The failing job ID is 4812. Reproduce first, then fix. Done means the 60k-row fixture exports every row. Show me the row counts before and after.
```

Leave two things out:

- **The how.** Say what to achieve, and leave the agent room to find a better path than the one you would pick. The same goes for a list of skills, covered below.
- **Your theory of the cause, at first.** A stated guess narrows the search to wherever you pointed. Let the agent restate the problem before you share your hunch.

## Restate a noisy report first

For a long thread, a vague bug, or a pasted report, make the restatement the first step:

```text
Read this report. Restate the underlying issue in your own words, in plain language. Do not change any code yet.
```

A misreading shows up in the restatement, before any code exists. Correct it there, and it costs you one message instead of one wrong fix.

Two optional skills do this on request. [`in-your-own-words`](../../plugins/in-your-own-words/README.md) plays back your goal and the problem you are solving. [`sharpen`](../../plugins/sharpen/README.md) asks how an expert would approach the task, what you are really after, and whether the task is over- or underspecified, then starts the work. Without them, the plain prompt above does the same job.

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

A read-only delegate may still have a shell. When the host cannot enforce read-only access, the brief says "do not edit files", and the parent checks `git status` afterward.

Worktrees cost disk space and machine resources, so one machine runs only a handful at once. Use [`worktree-cleanup`](../../plugins/worktree-cleanup/README.md) to audit them before removing any.

## Keep the cost in check

Subagents and review panels spend extra tokens. That is the price of the rigor. To spend fewer:

- Use [`configure-agent-models`](../../plugins/configure-agent-models/README.md) to record a smaller reasoning profile or cheaper models for internal roles, using only choices the current host offers. A strong model in the main session with faster models in the code roles is a good split.
- Set a role to `inherit-parent` or `auto` so it runs on the session's own model.
- Shorten a panel list. Panel skills normally run one subagent per entry.
- Save `engineering-mode` for work that needs rigor. A small, obvious edit does not.

## Keep communication inside the run

Subagents may communicate with each other, but no agent may communicate with a person. Agents may report to you in the active task. They must not send, post, reply, comment, or publish through an external service. An installed and authenticated communication tool does not change this rule.

Read-only evidence is allowed when you place it in scope. Agents may inspect source control, local docs, issue history, logs, traces, error tracking, and product data. Reading does not authorize a reply or mutation.

Next: [Understand the code](./02-understand.md).
