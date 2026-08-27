---
name: worktree-cleanup
version: 0.1.0
disable-model-invocation: true
description: Audit git worktrees and local development caches, then remove only targets proven unused and recoverable.
---

# Worktree cleanup

Reclaim local disk without deleting active work or uncommitted changes. Discovery is automatic. Deletion requires an explicit candidate list and a safety check for each path.

Subagents may communicate with each other, but no agent may communicate with a person. Internal read-only audits are allowed. No agent may post, send, reply, or comment through an external service.

## 1. Snapshot

Record free space with `df -h /`. Run `scripts/worktree-audit.sh [repo-path]` and derive every candidate path from its `git worktree list --porcelain` inventory. Never hand-type or glob a broad worktree parent. The helper is read-only and uses local Git state. It does not fetch or inspect remote reviews or conversation transcripts.

For each worktree, collect:

- path and branch or detached revision
- disk usage
- last filesystem change time
- tracked, untracked, and ignored entries from `git status --ignored --short --untracked-files=all`
- whether its revision is reachable from the repository's configured integration branches
- whether a local process has the directory open when that can be checked safely

Do not query or mutate remote review systems. Remote state is outside this skill.

## 2. Classify

Use these buckets:

- `hold`: the main worktree, active process, current task, tracked or untracked changes, or ignored files that look like credentials, authentication state, databases, uploads, or user data.
- `candidate`: no tracked, untracked, or ignored entries, no active process, revision recoverable from an existing ref, and not named by current repository instructions as protected.
- `needs-user-decision`: ambiguous ownership, detached unrecoverable work, or ignored build output and caches. The helper prints every ignored path. Empty normal status is never enough to classify a worktree as safe.

Subagents may inspect disjoint candidate worktrees in parallel. They remain read-only and return evidence to the parent.

## 3. Confirm destructive scope

Show the exact candidate paths and the reason each appears safe. If the user has not already authorized deletion of that confirmed set, ask once before removing it. Never infer permission from a request to inspect disk usage.

Do not remove a worktree with tracked or untracked changes unless the user explicitly names that exact path and accepts the loss. Treat ignored credentials and application state as `hold`. Deleting them requires a separate exact-path user decision that names the ignored files at risk. Do not delete branch refs.

## 4. Remove confirmed worktrees

For each authorized path:

1. Re-run `git status --ignored --short --untracked-files=all` in the target. Compare tracked, untracked, and ignored paths with the approved evidence.
2. Re-run `scripts/worktree-audit.sh [repo-path]` or the equivalent local process check. Hold the path if its bucket or evidence changed.
3. Re-check that no current process uses it.
4. Run `git worktree remove <path>` without `--force`.
5. If removal refuses, hold the path and report why. Do not bypass the gate.
6. Run `git worktree prune` after the confirmed set.

Do not use recursive deletion as a fallback. A surviving ignored build directory becomes a separately named cleanup candidate.

## 5. Optional local caches

Inspect development caches only when the user asks to reclaim more space. Report sizes first. Prefer tool-owned cleanup commands for simulators, package caches, build products, and unavailable runtimes. Never clear application state, browser profiles, credentials, or global caches without exact user authorization.

## 6. Verify

Re-run `scripts/worktree-audit.sh [repo-path]`, `git worktree list --porcelain`, and `df -h /`. Report free space before and after, every removed worktree, and every held path with its reason.

Version control history changes, remote operations, and external communication remain outside this skill.
