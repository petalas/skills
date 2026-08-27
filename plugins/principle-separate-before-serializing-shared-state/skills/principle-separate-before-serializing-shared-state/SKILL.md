---
name: principle-separate-before-serializing-shared-state
version: 0.1.0
disable-model-invocation: true
description: "Apply when concurrent actors might write to the same file, branch, key, or state object. Eliminate the sharing first; serialize structurally only when one shared writer is a real invariant."
---

# Separate Before Serializing Shared State

When concurrent actors might share mutable state, first ask whether they truly need the same mutable object. If not, eliminate the sharing. When sharing is real, enforce serialization structurally: lockfiles, sequential phases, exclusive ownership. Instructions and conventions are not concurrency control.

**Why:** Concurrent writes to shared state create race conditions that are intermittent, hard to reproduce, and expensive to debug. Telling agents or goroutines to "take turns" does not work.

Subagents may communicate with each other, but no agent may communicate with a person. Subagents coordinate internally and never send messages, comments, replies, email, or chat posts to people.

**Pattern:**

1. **Identify shared mutable state** (files both read and write, branches both push to, APIs both define and consume).
2. **Default: eliminate the shared write target.** Ask: do these actors need one canonical object, or are they publishing independent facts? Give each actor its own owned file, key, branch, or state directory, and merge only at the read/reporting boundary. Two workers writing their own `lastX` field into one `state.json` is still shared mutation; `indexer-state.json` + `metrics-state.json` is not.
3. **Only when one shared write target is a real invariant, serialize access structurally** (lockfiles, sequential phases, single-writer actor, or atomic compare-and-swap). Treat "we need a lock" as a design smell to check, not as the default answer.

This principle does not authorize Git mutations. Create a branch or worktree only when the user or repository workflow calls for it. A commit requires explicit authorization from the user or invoking workflow. If `$commit-guidelines` is available, apply it; otherwise inspect the exact commit diff, preserve unrelated work, run repository checks, use the repository's commit-message convention, and never add AI attribution. Rebase, amend, squash, reset, force operations, push, pull-request changes, merge, deploy, issue changes, and review-thread actions each require separate explicit authorization.
