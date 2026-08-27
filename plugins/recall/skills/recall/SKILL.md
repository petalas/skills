---
name: recall
version: 0.1.0
disable-model-invocation: true
description: "Reconstruct recent solo-development context from the current host's accessible task history, repository history, local docs, and live workspace state, then return a concise current-state brief."
---

# Recall

Rebuild the user's recent working context before resuming work. Return a concise brief of what changed, what remains open, and the best next move.

Only inspect the active workspace and task history the host exposes for this user. Never scan another workspace, workplace chat, other people's activity, private correspondence, or a hard-coded host transcript directory. Never post, reply, or update external state.

When the accessible history is large, use subagents to inspect disjoint time or topic slices. Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. Each child must keep extracted history local and return only the facts needed for synthesis. If subagents or task-history access are unavailable, fall back to the current conversation, repository history, and live workspace state, and state the limitation.

Model preferences are optional. Read repository-documented model configuration or `.agents/agent-models.md` when present, and map roles only to models the current host confirms are available. Otherwise omit model selection and inherit the parent or host defaults. Never require the file or hard-code unconfirmed model identifiers.

## 1. Set scope

Pin the workspace, topic, and time window. Default "recent" to the last seven days. Do not silently narrow an explicit request for all history. If the user already supplied a complete state capsule, use it and skip history mining.

## 2. Inspect accessible task history

Use host-provided task or conversation listing and reading capabilities when available. Search by topic first, order by real update time, skip the current task and obvious automated noise, and read only the relevant portions.

For each matching task, capture:

- the user's goal;
- decisions and constraints;
- work completed and validation run;
- open threads, failures, and corrections;
- local artifacts such as paths, branches, and commits.

Cite the host's stable task title or identifier when available. Do not infer completion from a plan; verify artifacts and final state.

## 3. Inspect repository and local evidence

Use git status, branches, logs, diffs, local issue/spec files, and relevant docs to reconstruct work that task history missed. For a named feature or bug, use `why` when installed, with only relevant read-only lanes. Without `why`, inspect repository history, local docs, tests, and available read-only runtime evidence directly; cite exact sources, distinguish facts from inference, and record gaps.

Read-only remote repository views may be used to verify an already surfaced branch or change. Never create, edit, comment on, assign, close, or merge anything.

## 4. Verify live state

History is not current truth. Confirm referenced paths, branches, commits, worktree changes, tests, and generated artifacts in the active workspace. When history and live state disagree, lead with live state and explain the discrepancy.

## Output contract

- **Capsule:** at most five bullets describing the work and current state.
- **Threads:** one line per active thread, prefixed with a factual status such as `[committed]`, `[in progress]`, `[verified, uncommitted]`, `[reverted]`, or `[planned]`.
- **Problems:** at most five recurring failures, corrections, or unresolved risks.
- **Next move:** the single most useful concrete action.

Keep adjacent work out unless it blocks the named topic. Write through `unslop` when installed; otherwise apply the same local rule by cutting filler and retaining only evidence needed to resume. Return the brief only in the current task.
