# Refactoring

Use for a behavior-preserving structural change.

1. Invoke `safe-refactor` when installed. Otherwise use steps 2 through 7 as the complete local safety workflow.
2. Pin current behavior with a characterization test, snapshot, replay, or equivalence harness before moving structure.
3. Name the target shape and the reader-load reduction it should produce.
4. Remove dead paths and redundant wrappers before adding a new abstraction.
5. Move in small steps while the behavior pin stays green. Migrate callers and remove an obsolete internal API in the same local wave.
6. Prove equivalence on the real artifact. Type checking and linting alone do not prove unchanged behavior.
7. Revert structural edits that add indirection without reducing branching, hidden state, or duplicated assumptions.

Return the old and new structure, behavior pin, equivalence proof, reader-load change, and anything intentionally left alone.
