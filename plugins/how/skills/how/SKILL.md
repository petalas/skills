---
name: how
version: 0.1.0
disable-model-invocation: true
description: "Explain how code works: subsystem architecture, runtime flow, ownership, placement, and layering. Optionally add a read-only architectural critique. Use why for historical motivation."
---

# How

Explore the repository and explain how a target works. Build the mental model a developer needs to change the code safely, not an annotated inventory of source files.

This skill is read-only. It may inspect repository files, history, tests, generated artifacts, and user-provided evidence. It never edits code or publishes findings outside the current conversation.

When subagents are available, use them for independent repository exploration. Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. Child agents must keep findings local and must not send, post, comment, review, or otherwise communicate through any external service.

Model preferences are optional. Read repository-documented model configuration or `.agents/agent-models.md` when present, and map roles only to models the current host confirms are available. Otherwise omit model selection and inherit the parent or host defaults. Never require the file or hard-code unconfirmed model identifiers.

If the host cannot create subagents, perform the same exploration locally and say which parallel checks were collapsed into the main pass.

## Choose a mode

- **Explain** is the default. Trace the target and produce a coherent explanation.
- **Critique** applies only when the user asks about architectural problems or improvements. Explain first, then add a read-only critique.

## Explain

### 1. Frame the question

Infer the narrowest useful scope from the request and current repository context. State a best-guess interpretation when the target is ambiguous, then continue so the user can redirect.

Treat a single module or narrow symbol as simple. Treat a cross-cutting feature, subsystem, or multi-service flow as complex.

### 2. Explore the code

For a simple target, trace it directly. For a complex target, split the investigation into two to four independent angles, such as:

- entry points and request flow;
- state, persistence, and data transformations;
- boundaries, integrations, and failure paths;
- configuration, metrics, and lifecycle behavior.

When subagents are available, launch those angles concurrently with [`references/explorer-prompt.md`](references/explorer-prompt.md). Use host-supported general repository workers and read-only permissions where the host exposes them. Do not request a particular model or rely on host-specific task schemas.

Every pass must read the implementation, follow callers and callees, inspect the relevant types, and stop only when it can trace input to output or trigger to effect without guessing. Acknowledge untraced edges.

### 3. Synthesize

For a simple target, write the explanation directly with [`references/explainer-prompt.md`](references/explainer-prompt.md) as a style guide. For a complex target, have one available subagent synthesize the explorer reports, or synthesize locally when delegation is unavailable.

Resolve contradictions against the code. Do not let a confident explorer report outrank direct evidence.

### 4. Present

Use only the sections the question needs:

- **Overview:** what the target is, what it does, and why it exists at a functional level.
- **Key concepts:** the few types, services, or abstractions needed for the rest.
- **How it works:** the runtime or data flow, with specific file and symbol references.
- **Where things live:** a compact map of the starting points.
- **Gotchas:** non-obvious behavior, sharp edges, and explicitly sourced historical facts.

## Critique

Run the full explanation first. Then ask two or more independent read-only critics, when available, to inspect the same code with [`references/critic-prompt.md`](references/critic-prompt.md) and [`references/critique-rubric.md`](references/critique-rubric.md). If delegation is unavailable, apply the rubric once and disclose that the critique did not receive independent passes.

When installed, use `codebase-design` as the authority for deep-module vocabulary and design tests. Without it, apply the bundled rubric directly: test whether interfaces hide meaningful complexity, boundaries align with ownership, representations do not leak, and call chains remain traceable. This critique does not replace `code-review`, which remains authoritative when installed for standards and specification review, or `fix-all-issues`, which remains authoritative when installed for exhaustive review and remediation. Their absence does not block this read-only architecture critique.

Judge the findings rather than counting votes:

- **Act on:** structural problems worth fixing now.
- **Consider:** real concerns with uncertain cost-benefit.
- **Noted:** valid, low-priority tradeoffs.
- **Dismissed:** incorrect, missing context, or preferences without a demonstrated cost.

Return the explanation first and the critique second. Do not apply fixes.
