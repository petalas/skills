# Hillclimb

Use for sustained improvement of one metric against a target.

1. Define a realistic workload, one metric, the better direction, a target, and a minimum number of attempts.
2. Build a repeatable harness that prints its error count and a count of the work done. Prove it distinguishes an easy case from the target case and measure its noise. Vet it with `benchmark-checklist` when installed, otherwise with the measured-number checks under Working rules in the engineering-mode `SKILL.md`. Then freeze it.
3. Record the baseline and a passing correctness gate.
4. Start a local decision log with `show-me-your-work` when installed. Otherwise create an append-only `decisions.tsv` with timestamp, attempt, hypothesis, change, before, after, correctness check, verdict, and note columns.
5. State one mechanism-based hypothesis. For a performance metric, order hypotheses by the performance mantras in step 3 of `playbooks/perf-issue.md`. Borrow only their order, not that step's stop rule. Make one isolated change, measure it with the frozen harness, and run the correctness gate.
6. Keep the change only when the metric clears noise and correctness holds. Otherwise revert only that attempt while preserving unrelated work.
7. On a plateau, change hypothesis family, revisit the trace, or combine near-misses only after measuring them separately.
8. Stop when the predicate is met or the remaining ideas cost more than their likely value. Never relax the predicate to declare success.

Return the target, baseline and final values, attempt count, kept and rejected hypotheses, decision-log path, and best remaining idea.
