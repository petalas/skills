# Feature

Use for new or changed behavior.

1. Read repository instructions and map the affected subsystem.
2. Name the user-visible outcome, core data shape, boundaries, and proof predicate.
3. Explore competing designs in parallel when the choice is consequential. Use one direct design for a small change with a clear precedent.
4. Write the throughput checkpoint. Name blocking setup, independent workstreams, shared writes, and the smallest safe decomposition.
5. Implement in verifiable units. Give concurrent writers disjoint files or isolated worktrees. Review every diff in the parent agent.
6. Verify each unit before starting the next. Use the real user surface for behavior and focused tests for branch coverage.
7. Run repository-required validation. If a design remains contested, run an independent adversarial review.

Return what changed for the user, the chosen shape and alternatives, changed files, proof, and open decisions.
