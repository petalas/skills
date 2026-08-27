# Steer with principle names

The repository includes 21 principle skills. Their names are compact corrections during a task. A principle counts only when it changes a concrete decision.

For example:

```text
Apply subtract before you add. Remove the obsolete adapters, then design against what remains.
```

```text
Apply prove it works. Run the real import flow and show the stored records.
```

```text
Apply separate before serializing shared state. Give each writer its own worktree.
```

## Scope and design

- [`principle-laziness-protocol`](../../plugins/principle-laziness-protocol/README.md) prefers deletion and the smallest sufficient change.
- [`principle-foundational-thinking`](../../plugins/principle-foundational-thinking/README.md) settles core types and shared data before logic.
- [`principle-redesign-from-first-principles`](../../plugins/principle-redesign-from-first-principles/README.md) integrates a requirement as if it had existed from the start.
- [`principle-subtract-before-you-add`](../../plugins/principle-subtract-before-you-add/README.md) removes dead weight before building on top of it.
- [`principle-minimize-reader-load`](../../plugins/principle-minimize-reader-load/README.md) removes layers and hidden state that make code hard to trace.
- [`principle-outcome-oriented-execution`](../../plugins/principle-outcome-oriented-execution/README.md) converges an authorized rewrite on its target without preserving throwaway intermediate APIs.
- [`principle-experience-first`](../../plugins/principle-experience-first/README.md) chooses the user's result over implementation convenience.
- [`principle-exhaust-the-design-space`](../../plugins/principle-exhaust-the-design-space/README.md) compares small competing prototypes when no precedent exists.
- [`principle-build-the-lever`](../../plugins/principle-build-the-lever/README.md) builds a script or check that does or proves repeatable work.

## Boundaries and state

- [`principle-model-domain-in-code`](../../plugins/principle-model-domain-in-code/README.md) encodes repeated rules in a structure instead of scattered conditionals.
- [`principle-boundary-discipline`](../../plugins/principle-boundary-discipline/README.md) validates at system boundaries and trusts internal types.
- [`principle-type-system-discipline`](../../plugins/principle-type-system-discipline/README.md) makes illegal states unrepresentable.
- [`principle-make-operations-idempotent`](../../plugins/principle-make-operations-idempotent/README.md) makes retries converge on the same end state.
- [`principle-replace-internal-apis-atomically`](../../plugins/principle-replace-internal-apis-atomically/README.md) migrates internal callers and deletes the old API in one wave.
- [`principle-separate-before-serializing-shared-state`](../../plugins/principle-separate-before-serializing-shared-state/README.md) removes shared writable state before adding coordination.

## Evidence and execution

- [`principle-prove-it-works`](../../plugins/principle-prove-it-works/README.md) checks the real artifact before reporting success.
- [`principle-fix-root-causes`](../../plugins/principle-fix-root-causes/README.md) reproduces and traces a defect before changing code.
- [`principle-sequence-verifiable-units`](../../plugins/principle-sequence-verifiable-units/README.md) ends each small unit with a check.
- [`principle-guard-the-context-window`](../../plugins/principle-guard-the-context-window/README.md) routes bulk reading to internal subagents and keeps compact findings in the main task.
- [`principle-local-autonomy`](../../plugins/principle-local-autonomy/README.md) proceeds with reversible local work while reserving external actions and communication for the user.
- [`principle-encode-lessons-in-structure`](../../plugins/principle-encode-lessons-in-structure/README.md) turns repeated advice into a check, type, lint, or script.

Do not memorize the list. Return when a task drifts and pick the principle that changes the next decision.

Next: [Copy practical recipes](./08-recipes-and-pitfalls.md).
