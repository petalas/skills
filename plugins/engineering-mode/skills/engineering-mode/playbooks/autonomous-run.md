# Autonomous local run

Use when the user asks the agent to keep working locally until a checkable condition is met.

1. State the exit predicate before the first iteration.
2. Choose a local wake method. Prefer an event-aware watcher for process completion or file changes. Otherwise use a bounded polling interval appropriate to the task. Use the host's recurring wake capability only when the user explicitly asks for future or repeated execution.
3. Start a decision trail with `show-me-your-work` when installed. Otherwise create an append-only `decisions.tsv` with timestamp, phase, decision, reason, evidence, and result columns.
4. Each iteration makes the smallest evidence-supported change, checks the predicate, logs the result, and discards changes that did not help.
5. Handle reversible local blockers within scope. Under an explicit full-autonomy grant, apply a default for a reversible user preference, explain it, and say in plain words what the user could tell you to do instead. The user answers in their own words. Never give a shorthand token to type back. Pause for missing authority, an irreversible decision, or a user-named gate.
6. Continue through a plateau by changing the hypothesis or measurement. Stop at the predicate or a documented dead end. Never weaken the predicate.

This playbook grants no remote or communication authority. Return the predicate, iterations, accepted and discarded work, decision-log path, and final state.

When the run delegates work, whoever spawns a child records its id, state, and expected runtime in a local `children.tsv` or the host's equivalent task record. Nested children are recorded by their own parent. Base the expected runtime on prior comparable runs when available.

At each wake, probe every recorded agent down to the leaf children. Judge progress by side effects such as commits, changed files, written reports, and test output, not by status text or summaries. An agent waiting on the parent or the user is not stuck, so answer it, or record the decision it needs for the user. An agent is stuck when it errors, cannot start turns, or shows nothing new past its expected runtime. Record a stuck agent's state, ask it to stop, and replace it at once with a fresh agent without waiting for the stop to land. Give the replacement separate writable output while the old agent may still run. A stall does not prove or remove required work. Drain delegated work before completing the run.

Fit re-verification to the change. New behavior, a redesign, or a large new diff gets one full review. A rebase, a conflict resolution, or a minor fix gets a single check of the affected behavior at the new state.

At scheduled checks, report only changes that earlier status messages have not covered, including completed work, verification results, stuck workers and the action taken, blockers added or cleared, and decisions needing the user. Use `ketchup` for that catch-up when installed. It is user-only, so read `../ketchup/SKILL.md` relative to the engineering-mode skill directory. Otherwise write the change-only report directly. If nothing changed, keep the scheduled check silent. Record each check in the decision trail, including what was reported or `none`.
