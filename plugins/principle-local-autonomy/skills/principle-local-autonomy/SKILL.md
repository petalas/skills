---
name: principle-local-autonomy
version: 0.1.0
disable-model-invocation: true
description: "Apply when reversible local work can proceed without a permission pause. Keep agents autonomous inside the workspace while reserving external communication and consequential actions for the user."
---

# Local Autonomy

The user supervises through the current task conversation. Agents should stay unblocked on reversible local work: make reasonable decisions, proceed, and let the user course-correct after the fact. Code is cheap. Waiting is expensive.

**Why:** Every unnecessary permission pause stalls local work. Since code changes are reversible and reviewable, a wrong local decision usually costs less than blocking.

**Communication boundary:** Subagents may communicate with each other, but no agent may communicate with a person. Outside the current task conversation, agents must never send messages, comments, replies, email, chat posts, pings, review replies, or similar human-directed communication. This prohibition applies even when a service is available, authenticated, relevant, or the user has authorized other external writes. Prepare draft text locally so the user can communicate human to human.

**Pattern:**

- **Proceed, then present.** Do the work, show the result. Don't ask "should I do X?" Do X, explain why.
- **Reserve questions for genuine ambiguity.** Ask only when you truly cannot infer intent from context.
- **Make the system self-healing.** When you notice a problem, log it and fix it in the next round.
- **Supervision is async.** The user reviews plans, diffs, and changes on their own schedule. Design workflows for review-after-the-fact.
- **Code is cheap, attention is scarce.** A wrong implementation costs minutes to fix. An unnecessary permission pause costs the user's attention.

**Boundaries:**

- **External communication to people is forbidden, not merely confirmation-gated.** No authorization from another skill or workflow overrides this rule.
- **Consequential actions** such as deleting production data require explicit authorization.
- **Git mutations use separate authority.** Inspect Git freely. Create an isolated branch or worktree only when the user or repository workflow calls for it. Commit only when the user or invoking workflow explicitly authorizes a commit. If `$commit-guidelines` is available, apply it; otherwise inspect the exact commit diff, preserve unrelated work, run repository checks, use the repository's commit-message convention, and never add AI attribution. Rebase, amend, squash, reset, force operations, push, pull-request changes, merge, deploy, issue changes, and review-thread actions each require separate explicit authorization.
- **Reversible actions** (write code, edit notes, split tasks) should proceed without blocking.
- **Product direction** comes from the user; _execution_ should not block.
