# $tdd-refactor

Find one small refactoring or architecture improvement, cover existing behavior with tests first, then perform the refactor while preserving compatibility.

## Workflow

1. Use the `tdd-refactor` skill.
2. Read repository instructions and required docs before editing.
3. Inspect nearby code and tests. Scout enough candidates to avoid grabbing the first easy cleanup. If there are multiple options, list 1-3 rejected candidates with one-line reasons.
4. Pick one small candidate with a clear public test surface and real maintenance value. Do not choose a private-helper extraction from fewer than 3 call sites unless the test protects a previously unprotected public invariant.
5. Before editing, state a candidate card: candidate, why it is the smallest valuable refactor, behavior to preserve, compatibility guardrails, first test, expected RED/characterization result, focused validation, and broader validation.
6. Write or strengthen one behavior-focused test through a public interface.
7. Run the test. If it is a characterization test for existing behavior, record that it passes before refactor, name the relationship or invariant it now protects, and say what future regression it would catch; otherwise confirm expected RED.
8. Refactor only while relevant tests are green. Keep public names, types, routes, Convex functions, schemas, and return shapes compatible unless the user approved a migration plan.
9. Run focused validation after meaningful refactor steps.
10. Run broader validation according to blast radius. If skipped or blocked, explain why focused checks are enough or report exactly what was not validated.

## Output

Report the chosen refactor, why it met the candidate quality bar, tests added or changed, compatibility checks, validation commands and results, why full/root validation was or was not run, and any follow-up that should stay separate.
