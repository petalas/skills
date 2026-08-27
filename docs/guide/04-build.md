# Build the change and keep the diff small

Good implementation prompts name the observed behavior, the invariant, and the proof. The workflow supplies the rest.

## Reproduce a defect before fixing it

```text
The export writes two rows after a retry. Reproduce it first. If there is a cheap local test seam, use regression-test. Fix the traced cause and rerun the reproduction.
```

[`regression-test`](../../plugins/regression-test/README.md) is for a known defect with a cheap test seam. It is not a command to build a large test harness. When the real command or flow is stronger evidence, use that instead.

Apply [`principle-fix-root-causes`](../../plugins/principle-fix-root-causes/README.md) if the patch starts adding guards around a symptom without tracing the cause.

## State both the new and preserved behavior

```text
Add a JSON output option. The existing text output must stay byte-identical. Run both forms against the sample project.
```

For TypeScript, [`typescript-best-practices`](../../plugins/typescript-best-practices/README.md) turns general type discipline into concrete rules such as `unknown` at boundaries, discriminated unions, and exhaustive variants.

## Pin behavior before refactoring

```text
Move parsing into one module with no behavior change. Capture the current outputs first, make the smallest structural change, then compare the outputs and run the focused tests.
```

Use [`safe-refactor`](../../plugins/safe-refactor/README.md) when you want the highest-value behavior-preserving cleanup that can be bounded and verified. Delete dead paths before adding an abstraction. Migrate internal callers and remove the old API in the same wave when the repository permits an atomic change.

## Measure performance work

```text
Startup takes 1.8 seconds on this fixture. Profile it, change the measured cause, and show comparable before and after results. Keep changes only when the metric improves without breaking the checks.
```

A performance claim needs a stable fixture and comparable measurements. Revert experiments that do not help. Do not accumulate speculative optimizations.

## Clean the diff before handoff

Run [`review-code-comments`](../../plugins/review-code-comments/README.md) when comments narrate the implementation or encode a constraint that a type, test, or lint could enforce. Apply [`unslop`](../../plugins/unslop/README.md) to prose, including README changes, commit bodies, and local handoff drafts.

Cleanup is part of the implementation:

- remove unrelated edits;
- remove dead compatibility paths;
- replace unsupported defensive checks with a traced fix;
- keep comments only when the code cannot carry the fact; and
- run the repository's formatter and focused checks.

Version-control actions are separate from editing. Commit only when the user or invoking workflow authorizes it. Pushes, remote review changes, merges, and deploys require their own authority. None of those permissions authorize human-directed communication.

Next: [Verify the result](./05-verify.md).
