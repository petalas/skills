# Autonomous local run

Use when the user asks the agent to keep working locally until a checkable condition is met.

1. State the exit predicate before the first iteration.
2. Choose a local wake method. Prefer an event-aware watcher for process completion or file changes. Otherwise use a bounded polling interval appropriate to the task. Use the host's recurring wake capability only when the user explicitly asks for future or repeated execution.
3. Start a decision trail with `show-me-your-work` when installed. Otherwise create an append-only `decisions.tsv` with timestamp, phase, decision, reason, evidence, and result columns.
4. Each iteration makes the smallest evidence-supported change, checks the predicate, logs the result, and discards changes that did not help.
5. Handle reversible local blockers within scope. Under an explicit full-autonomy grant, apply a default for a reversible user preference, explain it, and give one reply word that reverses it. Pause for missing authority, an irreversible decision, or a user-named gate.
6. Continue through a plateau by changing the hypothesis or measurement. Stop at the predicate or a documented dead end. Never weaken the predicate.

This playbook grants no remote or communication authority. Return the predicate, iterations, accepted and discarded work, decision-log path, and final state.

When the run delegates work, record each worker's id, expected runtime, and state in a local `children.tsv` or the host's equivalent task record. Base the expected runtime on prior comparable runs when available. At each wake, check errors and overdue workers against observable progress. Stop a stuck worker and record its state even if stopping fails. Replace it when the work remains required, using separate writable output if the old worker may still run. A stall does not prove or remove required work. Drain delegated work before completing the run.

At scheduled checks, report only changes that earlier status messages have not covered, including completed work, verification results, stuck workers, blockers added or cleared, and decisions needing the user. If nothing changed, keep the scheduled check silent. Record each check in the decision trail, including what was reported or `none`.
