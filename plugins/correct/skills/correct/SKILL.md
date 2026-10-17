---
name: correct
version: 0.1.0
disable-model-invocation: true
description: "Find the mistakes agents keep repeating in this repo and make each one impossible. Try architecture first, then types, then a lint whose error names the fix, then a test, and write docs last. Prove each check fails on a real past mistake. Repeat this each time the user corrects you."
---

# Correct

The user keeps correcting agents in this repo for the same mistakes. Change the repo so the next agent can't make them.

Assume every contributor is an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that compiles. Design the repo so a change that looks right from one file is right for the whole repo.

If `principle-encode-lessons-in-structure` is installed, read [its skill](../principle-encode-lessons-in-structure/SKILL.md) before you pick a level. Otherwise apply its rule directly: when a correction repeats, the instruction is the symptom, so encode the lesson as structure (a lint, type, runtime check, or script), and only make the instruction more prominent, with an example of the failure, when the lesson needs judgment.

## Find the mistake classes

First, read recent commits, reverts, review comments, agent instruction files (AGENTS.md or the repo's equivalent), and comments that explain workarounds. Review comments are read-only evidence: do not reply to, resolve, or react to them. Group the mistakes into classes. A class counts once it has happened twice.

## Fix each class at the highest level that works

1. **Eliminate it with architecture.** Give each piece of state one owner and each task one supported way. Hide internals so the wrong import fails. Replace hand-synced lists with one source of truth. Delete old ways and dead code an agent would copy.
2. **Enforce it with types so the bad state can't be written.** If bad code still compiles, add a lint or CI check whose error names the file, type, or function to use instead. If the pattern is already common, fail only when a change adds more.
3. **Test the behavior.** Fix or delete any test that still passes when the behavior it checks breaks, or that fails when only the internals change.
4. **Write docs or agent rules last, only for judgment calls.** Nothing fails when an agent skips them.

## Fix and prove

Then fix the most frequent classes now, one focused change each. Prove each new check fails on a real past mistake. Run the same command locally and in CI. Exceptions go on the offending line with a reason, an expiry date, and the user's approval.

Commit only when the user or the invoking workflow explicitly authorizes commits. Then make one commit per class: if `commit-guidelines` is installed, apply it; otherwise inspect the exact commit diff, preserve unrelated work, run repository checks, write a Conventional Commits message, and add no agent attribution. Without that authority, leave each change uncommitted and list the changes for the user.

## Keep the rule table

Last, keep a table in the repo's agent instruction file (AGENTS.md or the repo's equivalent) that pairs each rule with what enforces it. When the user corrects you, fix the mistake and add the rule. If the rule was already there and nothing enforces it, that's a repeat, so fix it at the highest level in the same change. Drop a rule once its mistake can't happen.

**Reply:** each class with its evidence, the level you picked, and why a higher level didn't work.
