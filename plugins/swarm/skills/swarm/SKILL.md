---
name: swarm
version: 0.1.0
disable-model-invocation: true
description: "Fan out independent subagents across parallel slices or races, drain every required result, and return one consolidated local report."
---

# Swarm

Fan out independent workers across separate slices, identical race briefs, or a declared mix of both. Drain the workers and return one consolidated report.

Swarm inherits the caller's authority. It never turns a read-only request into edits or a local request into external actions. Workers must never push, publish, post, comment, review, open or mutate issues, or message anyone. Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. Keep findings and drafts local.

Model preferences are optional. Read repository-documented model configuration or `.agents/agent-models.md` when present, and map roles only to models the current host confirms are available. Otherwise omit model selection and inherit the parent or host defaults. Never require the file or hard-code unconfirmed model identifiers.

If the host cannot spawn subagents, execute the slices sequentially and report that the run was not parallel. If the available concurrency is lower than the requested worker count, run bounded waves until every required slice is drained.

## 1. Frame

1. State the done predicate and final artifact or report.
2. Choose coverage slices, a race, or a mixed shape.
3. For a race, declare the selection rule before launch: first passing result, rank all, or best overall.
4. Set the worker count from the work, not from a host-specific default.
5. Use host-available workers without fixed model names. Name different models only when the user explicitly asks for a model race and the host exposes those choices.
6. Give each writing worker an isolated task-specific temporary directory or artifact path by default. Use a worktree only when the user or repository workflow calls for one. Never rely on conventions to serialize shared mutable state.

## 2. Fan out

Launch as many workers concurrently as the host allows. Every brief must stand alone and include:

- goal and done predicate;
- exact slice or race arm;
- allowed local actions and forbidden external actions;
- available grounding;
- verification method;
- required report shape.

Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. If a worker drops out, retry only when its slice is required; otherwise record the gap.

## 3. Drain and aggregate

Wait for every required slice, not merely the first completion. Inspect actual artifacts for writing tasks rather than trusting summaries. Deduplicate related issues, preserve provenance by worker or slice, and make gaps explicit.

For a race, apply the predeclared selection rule. Do not silently switch from first pass to best overall after seeing results.

## 4. Report

Return one compact in-task report with the result table, evidenced issue summaries, selected race result when applicable, verification status, and gaps or dropouts. Do not paste raw worker dumps or publish the report elsewhere.
