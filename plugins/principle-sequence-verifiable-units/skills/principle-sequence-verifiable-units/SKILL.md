---
name: principle-sequence-verifiable-units
version: 0.1.0
disable-model-invocation: true
description: "Apply to multi-step work such as sweeps, migrations, and runs of similar edits. Break work into small units that each end in a verifiable state, check each before the next, and order authorized delivery so the sequence proves itself."
---

# Sequence Work into Verifiable Units

Order work as a sequence of small units, each ending in a state you can check, and don't advance until the current one is green. The same discipline runs at two altitudes, how you execute and how you deliver.

**Why:** A break caught at the unit that caused it is cheap to localize. A break caught after a batch is buried, and you have already built further on a broken base. Sequencing those same units into a delivery a reviewer can replay turns "trust me" into "watch it go red, then green."

**Execution.** In a sweep, migration, or any run of similar edits, verify each change before starting the next. Never batch the edits and verify once at the end. Each unit is a before/after bracket: known-good state, one change, run the check, then proceed. Start from a known clean baseline so every check measures the intended change. When a lever does the edits, the per-unit check is nearly free; run it anyway.

**Delivery.** Order checkpoints so they prove the work. The canonical shape is a failing test first, then the fix. The first unit shows the bug is real (red), and the next shows it resolved (green). Other useful orders are a subtraction before the reshape, a baseline capture before the treatment, or the scaffold before the feature. Each checkpoint stands on its own and the sequence reads as an argument.

**Pattern:**

- Pick the smallest unit that ends in a check: an edit plus its test, or another checkpoint that stands alone.
- Verify before advancing. Red to green per unit, never deferred to a final batch.
- Order the units so the sequence builds confidence on its own, for you while executing and for a reviewer reading the stack.

If `$principle-prove-it-works` is available, apply it to keep each check tied to the real artifact; otherwise exercise and inspect the actual output directly. If `$principle-build-the-lever` is available, apply it to make each unit cheap to repeat; otherwise use the smallest rerunnable check that proves the unit.

**Git authority:** This skill does not authorize Git mutations. Inspect Git as needed. Create a branch or worktree only when the user or repository workflow calls for it. Create a commit only when the user or invoking workflow explicitly authorizes committing. If `$commit-guidelines` is available, apply it; otherwise inspect the exact commit diff, preserve unrelated work, run repository checks, use the repository's commit-message convention, and never add AI attribution. Rebase, amend, squash, reset, force operations, push, pull-request changes, merge, deploy, issue changes, and review-thread actions each require separate explicit authorization.
