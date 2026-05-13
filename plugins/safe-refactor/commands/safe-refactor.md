# $safe-refactor

Find the highest-value behavior-preserving refactor that can be safely bounded, protected by tests or equivalent evidence, and validated.

## Workflow

1. Use the `safe-refactor` skill.
2. Read repository instructions and required docs. Check worktree status before editing; if tracked files are already modified, inspect and recommend, but do not edit without user confirmation.
3. Inspect nearby code and tests. Scout enough candidates to avoid grabbing the first easy cleanup.
4. Compare candidates by value, risk, testability, scope coherence, and validation cost. Pick the best value-to-risk ratio, not the smallest diff.
5. If there is a clear winner, state the recommendation and proceed. Ask only when the choice depends on user intent, public compatibility, high-risk domains, subjective architecture tradeoffs, or blocked/expensive validation.
6. Before editing, state a candidate card covering value dimensions, refactor shape, size/blast radius, scope justification, larger opportunity/this pass/deferred, behavior to preserve, non-goals, compatibility guardrails, type/performance evidence when relevant, tests/evidence, proceed/ask decision, docs impact, and validation.
7. Add a focused characterization test or identify exact existing tests that already protect the behavior. For characterization tests, name the public behavior, future regression caught, and stable boundary.
8. Identify the build-green gate before editing: package typecheck/build, downstream consumer typecheck/build, app production build, deploy-equivalent command, or repo-level validation depending on blast radius.
9. Refactor only while relevant tests/evidence are green. Keep each stage coherent, behavior-preserving, and compatible.
10. Run focused validation after meaningful stages, then the build-green gate. Multi-workspace/cross-contract changes require repo-level validation unless skipped or blocked.
11. Never report the refactor as complete/safe/validated unless the build-green gate passed. If blocked or skipped, name the exact command and residual risk.
12. Before final, inspect the diff for unrelated churn and run the hidden behavior-change checklist.

## Recommendation-Only Mode

If the highest-value refactor is too large or strategic for one safe pass and no independently valuable first stage exists, do not make a token cleanup. Stop before editing and report the opportunity, value, risk, proposed stages, stage 1 evidence/validation, compatibility risks, and decision needed.

## Output

For implemented refactors, report value and scope justification, tests/evidence, compatibility guardrails, validation results, root-validation rationale, and remaining risk/follow-up.

For recommendation-only mode, explicitly say no code changed and report the staged recommendation.
