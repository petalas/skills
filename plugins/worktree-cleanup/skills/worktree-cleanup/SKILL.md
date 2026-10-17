---
name: worktree-cleanup
version: 0.3.0
disable-model-invocation: true
description: Audit git worktrees and local development caches, then remove only targets proven unused and recoverable.
---

# Worktree cleanup

Reclaim local disk without deleting active work or uncommitted changes. Discovery is automatic. Deletion requires an explicit candidate list and a safety check for each path.

Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. Internal read-only audits are allowed. No agent may post, send, reply, or comment through an external service.

## 1. Snapshot

Record free space with `df -h /`. Run `scripts/worktree-audit.sh [-b <ref>] [repo-path]` and derive every candidate path from its `git worktree list --porcelain` inventory. Never hand-type or glob a broad worktree parent. The helper is read-only and uses local Git state. It does not fetch or inspect remote reviews or conversation transcripts. `-h` prints its usage.

The first output line, `# base: <ref>`, names the ref behind the `BASE_MERGED` column. Pass `-b <ref>` when the user names the branch work merges into. Without `-b`, the helper uses the first of `origin/HEAD`, `origin/main`, and `origin/master` that exists in local refs, and prints `none` with every row `unknown` when all are missing. An explicit `-b` ref that does not exist locally exits 1. An unknown option exits 2.

For each worktree, collect:

- `WORKTREE` path and `SIZE_KIB` disk usage
- `AGE_DAYS`: days since the HEAD commit
- tracked, untracked, and ignored entries from `git status --ignored --short --untracked-files=all`
- `REF`: the branch, or for a detached worktree the first local or remote-tracking ref containing its revision, else `unrecoverable-detached`
- `BASE_MERGED`: `yes` when the revision is an ancestor of the base ref, `no` when it is not, `unknown` without a base. The result reflects the last fetch. A squash- or rebase-merged branch reads `no`. The column is informational and never changes the bucket.
- whether a local process has its working directory or any file open beneath the worktree
- whether the status and process scans completed; an unavailable or failed scan is unknown, never clean

Do not query or mutate remote review systems. Remote state is outside this skill.

## 2. Classify

Use these buckets:

- `hold`: the main worktree, active process, current task, tracked or untracked changes, or ignored files that look like credentials, authentication state, databases, uploads, or user data.
- `candidate`: successful status and process scans, no tracked, untracked, or ignored entries, no active process, revision recoverable from an existing ref, and not named by current repository instructions as protected.
- `needs-user-decision`: ambiguous ownership, incomplete status or process scans, detached unrecoverable work, or ignored build output and caches. The helper prints every ignored path. Empty normal status is never enough to classify a worktree as safe.

Subagents may inspect disjoint candidate worktrees in parallel. They remain read-only and return evidence to the parent.

## 3. Confirm destructive scope

Show the exact candidate paths and the reason each appears safe. If the user has not already authorized deletion of that confirmed set, ask once before removing it. Never infer permission from a request to inspect disk usage.

Do not remove a worktree with tracked or untracked changes unless the user explicitly names that exact path and accepts the loss. Treat ignored credentials and application state as `hold`. Deleting them requires a separate exact-path user decision that names the ignored files at risk. Do not delete branch refs.

## 4. Remove confirmed worktrees

For each authorized path:

1. Re-run `git status --ignored --short --untracked-files=all` in the target. Compare tracked, untracked, and ignored paths with the approved evidence.
2. Re-run `scripts/worktree-audit.sh [-b <ref>] [repo-path]` with the step 1 arguments, or the equivalent local process check. Hold the path if its bucket or evidence changed.
3. Re-check that no current process uses it.
4. Run `git worktree remove <path>` without `--force`.
5. If removal refuses, hold the path and report why. Do not bypass the gate.
6. Run `git worktree prune` after the confirmed set.

Do not use recursive deletion as a fallback. A surviving ignored build directory becomes a separately named cleanup candidate.

## 5. Optional local caches

Inspect development caches only when the user asks to reclaim more space. Report sizes first. Prefer tool-owned cleanup commands for simulators, package caches, build products, and unavailable runtimes. Never clear application state, browser profiles, credentials, or global caches without exact user authorization.

## 6. Verify

Re-run `scripts/worktree-audit.sh [-b <ref>] [repo-path]` with the step 1 arguments, `git worktree list --porcelain`, and `df -h /`. Report free space before and after, every removed worktree, and every held path with its reason.

Version control history changes, remote operations, and external communication remain outside this skill.
