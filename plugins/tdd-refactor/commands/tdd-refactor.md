# $tdd-refactor

Find one small refactoring or architecture improvement, cover existing behavior with tests first, then perform the refactor while preserving compatibility.

## Workflow

1. Use the `tdd-refactor` skill.
2. Read repository instructions and required docs before editing.
3. Inspect nearby code and tests. Pick one small candidate with a clear public test surface.
4. State the chosen candidate, affected files, behavior to preserve, compatibility guardrails, and focused validation command.
5. Write or strengthen one behavior-focused test through a public interface.
6. Run the test. If it is a characterization test for existing behavior, record that it passes before refactor; otherwise confirm expected RED.
7. Refactor only while relevant tests are green. Keep public names, types, routes, Convex functions, schemas, and return shapes compatible unless the user approved a migration plan.
8. Run focused validation after meaningful refactor steps.
9. Run broader validation according to blast radius. If blocked, report exactly what was not validated.

## Output

Report the chosen refactor, tests added or changed, compatibility checks, validation commands and results, and any follow-up that should stay separate.
