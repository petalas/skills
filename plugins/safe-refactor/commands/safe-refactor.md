# $safe-refactor

Find the highest-value behavior-preserving refactor that can be safely bounded, covered by tests or equivalent evidence, and validated.

## Workflow

1. Use the `safe-refactor` skill.
2. Read repository instructions and required docs before editing.
3. Inspect nearby code and tests. Scout enough candidates to avoid grabbing the first easy cleanup. If there are multiple options, list 1-3 rejected candidates with one-line reasons.
4. Pick the candidate with the best value-to-risk ratio: meaningful enough to justify its size, bounded enough to complete safely, and protected through a clear public test surface. Do not choose a private-helper extraction from fewer than 3 call sites unless the test protects a previously unprotected public invariant.
5. Before editing, state a candidate card: candidate, why it is the highest-value safe refactor, size/blast radius, why the scope is justified, behavior to preserve, compatibility guardrails, first test, expected RED/characterization result, focused validation, and broader validation.
6. Write or strengthen one behavior-focused test through a public interface.
7. Run the test. If it is a characterization test for existing behavior, record that it passes before refactor, name the relationship or invariant it now protects, and say what future regression it would catch; otherwise confirm expected RED.
8. Refactor only while relevant tests are green. Keep public names, types, routes, Convex functions, schemas, and return shapes compatible unless the user approved a migration plan.
9. Run focused validation after meaningful refactor steps.
10. Run broader validation according to blast radius. If skipped or blocked, explain why focused checks are enough or report exactly what was not validated.

## Output

Report the chosen refactor, why it was high value, why it met the candidate quality bar, tests added or changed, compatibility checks, validation commands and results, why full/root validation was or was not run, and any follow-up that should stay separate.
