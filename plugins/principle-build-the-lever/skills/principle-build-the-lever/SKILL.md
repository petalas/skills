---
name: principle-build-the-lever
version: 0.1.0
disable-model-invocation: true
description: "Apply to any non-trivial work, not just bulk work: edits, migrations, analyses, checks. Build the tool that does it or proves it (codemod, script, generator, or a skill your subagents follow) instead of working by hand. The tool is the artifact a reviewer can rerun."
---

# Build the Lever

When the work isn't trivial, build the tool that does it instead of doing it by hand.

**Why:** Two payoffs. Throughput: a codemod, generator, or script does the work the same way every time and reruns for free. Confidence: the tool is one artifact a reviewer can read and rerun to check the work. Hand-done changes can only be re-verified by redoing them. A deterministic script turns "trust me" into "run this".

**Pattern:** Default to building the lever. Skip it only when the task is genuinely trivial, a couple of obvious edits you can see at a glance.

- Do the first unit by hand to learn the recipe, then build the tool. Prove it by rerunning it on that unit and diffing against your hand-done version. Make the lever safe to rerun. A reviewer will.
- Codemod or script for edits, generator for repetitive files, a dump-to-sqlite query for analysis, a rerunnable check for verification.
- A deterministic lever beats fan-out. If the tool can process every unit in one pass, run it yourself; don't fan out delegates to hand-apply what a script can do.
- When you fan work out to subagents, write the lever as a skill they all read: the recipe, the verification contract, and the do-not-touch fences in one artifact, so every delegate inherits the same hardened version instead of re-explaining it per prompt and watching each one drift. Keep it outside the delegates' write scope so they can't quietly edit the contract.
- Subagents may communicate with each other, but no agent may communicate with a person. Keep external communication manual: prepare local draft text for the user instead of sending messages, comments, replies, email, or chat posts.
- Applying this principle produces a file. If you cited it and there is no codemod, script, generator, or delegate skill in the diff, you didn't apply it.
- When the work outlives the session, keep the lever in the worktree so the next run can rerun it. Commit it only when the user or invoking workflow explicitly authorizes a commit. If `$commit-guidelines` is available, apply it; otherwise inspect the exact commit diff, preserve unrelated work, run repository checks, use the repository's commit-message convention, and never add AI attribution.

**Balance:** The bar is triviality, not repetition. A one-off still earns a lever when the lever is what makes the work checkable. If `$principle-laziness-protocol` is available, apply it; otherwise build the smallest script that does or proves the job, never a framework.

If `$principle-encode-lessons-in-structure` is available, use it instead when a recurring instruction needs a durable guardrail; otherwise encode recurring rules in lint, metadata, runtime checks, or automation. This principle is for throughput and reviewability on the work in front of you. If `$principle-prove-it-works` is available, use its verification guidance; otherwise rerun the lever and inspect the real output directly.
