# Autonomous local run

Use when the user asks the agent to keep working locally until a checkable condition is met.

1. State the exit predicate before the first iteration.
2. Choose a local wake method. Prefer an event-aware watcher for process completion or file changes. Otherwise use a bounded polling interval appropriate to the task. Use the host's recurring wake capability only when the user explicitly asks for future or repeated execution.
3. Start a decision trail with `show-me-your-work` when installed. Otherwise create an append-only `decisions.tsv` with timestamp, phase, decision, reason, evidence, and result columns.
4. Each iteration makes the smallest evidence-supported change, checks the predicate, logs the result, and discards changes that did not help.
5. Handle reversible local blockers within scope. Pause for missing authority, an irreversible decision, or a genuine product preference.
6. Continue through a plateau by changing the hypothesis or measurement. Stop at the predicate or a documented dead end. Never weaken the predicate.

This playbook grants no remote or communication authority. Return the predicate, iterations, accepted and discarded work, decision-log path, and final state.
