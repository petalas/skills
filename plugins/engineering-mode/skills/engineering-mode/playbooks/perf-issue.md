# Performance issue

Use for a measured slowdown that needs a one-off diagnosis and improvement.

1. Capture a realistic baseline on the matching user surface. Record the revision, workload, environment, sample count, and noise.
2. Inspect the affected subsystem and reduce a trace or profile to the dominant cost.
3. Form hypotheses from the evidence. Consider deletion, less input, caching with explicit invalidation, batching, cheaper lookup structures, deferred work, and moving work away from the interactive path.
4. Change one mechanism at a time. Delegate isolated attempts when useful and review every diff.
5. Capture a post-change artifact with the same harness and workload.
6. Interleave baseline and changed-revision runs when comparing distributions or repeated samples. Both revisions must produce the same metric under comparable conditions. If the baseline lacks the feature, record that absence and set absolute budgets for the added work and user-visible completion. Do not report a ratio between unlike scenarios. A wrong-surface or inconclusive result is not a pass.
7. Run correctness checks and remove changes that do not beat noise.

Return the baseline, final measurement, delta, artifact paths, correctness evidence, and remaining dominant cost.
