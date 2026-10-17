---
name: swarm
version: 0.3.0
disable-model-invocation: true
description: "Fan out independent subagents across parallel slices or races, drain every required result, and return one consolidated local report."
---

# Swarm

Swarm inherits the caller's authority. It never turns a read-only request into edits or a local request into external actions. Workers must never push, publish, post, comment, review, open or mutate issues, or message anyone. Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. Keep findings and drafts local.

Model and reasoning preferences are optional. Read repository-documented model configuration or `.agents/agent-models.md` when present. Use `implementation` for workers unless an explicit race brief assigns a different confirmed model to an arm.

Read its optional `reasoning profile` line and validate each explicit model/profile pair against the current host. For a missing role or an `auto` or `inherit-parent` model entry, omit both overrides. For a missing, `auto`, or `inherit-parent` profile, omit the reasoning override. Never require the file, construct model identifiers from effort labels, or use unconfirmed choices. If a configured choice is unavailable or the host rejects a model/profile pair, report the fallback and retry that seat once with both overrides omitted. If the retry fails, record the gap or use the local fallback below. When `engineering-mode` is installed, match each subagent's reasoning profile to the job by its Delegation rule; otherwise use the configured profile.

If the host cannot spawn subagents, execute the slices sequentially and report that the run was not parallel. If the available concurrency is lower than the requested worker count, run bounded waves until every required slice is drained.

## 1. Frame

1. State the done predicate and final artifact or report.
2. Choose coverage slices, a race, or a mixed shape.
3. For a race, declare the selection rule before launch: first passing result, rank all, or best overall.
4. Use the worker preference above. For a model race, name each arm's confirmed model before launch.
5. Give each writing worker an isolated task-specific temporary directory or artifact path by default. Use a worktree only when the user or repository workflow calls for one. Never rely on conventions to serialize shared mutable state.
6. When workers verify or measure commits, name the exact commit SHAs in each brief. For measurements, also specify the sample count, what one sample represents, and the measurement order. Require each worker to record the SHAs and method in its result.

## 2. Fan out

Launch as many workers concurrently as the host allows. Every brief must stand alone and include:

- goal and done predicate;
- exact slice or race arm;
- allowed local actions and forbidden external actions;
- available grounding;
- verification method, including the exact SHAs and measurement method when applicable;
- required report shape.

Reports use `PASS`, `ISSUES`, or `BLOCKED` with evidence. A worker that proves a defect reports `ISSUES` and lists every issue it can prove. If a worker drops out, retry only when its slice is required; otherwise record the gap.

## 3. Drain and aggregate

Wait for every required slice, not merely the first completion. Reject a result that omits or does not match the SHAs or method its brief names, and respawn a fresh worker once with the same brief. After a second miss, record a gap. A gap never counts as a pass. Inspect actual artifacts for writing tasks rather than trusting summaries. Deduplicate related issues and preserve provenance by worker or slice.

For a race, apply the predeclared selection rule. Do not silently switch from first pass to best overall after seeing results.

## 4. Report

Return one compact in-task report with the result table, every proven issue with concise evidence, selected race result when applicable, verification status, and gaps or dropouts. Do not paste raw worker dumps or publish the report elsewhere.
