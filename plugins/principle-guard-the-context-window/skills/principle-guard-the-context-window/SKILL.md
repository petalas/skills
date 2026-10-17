---
name: principle-guard-the-context-window
version: 0.4.0
disable-model-invocation: true
description: "Apply when context is filling up: large outputs, long files, repeated reads, fan-out planning. Route bulk to subagents; keep summaries in the main thread, not raw payloads."
---

# Guard the Context Window

**Why:** Context overflow degrades reasoning quality, creates compression artifacts, and halts progress.

**Pattern:**

- **Keep delegation internal.** Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. Subagents return their findings internally; they never send messages, comments, replies, email, or chat posts to people.
- **Size phases and cap scope.** Limit files per phase, set turn budgets, account for mechanism costs.
