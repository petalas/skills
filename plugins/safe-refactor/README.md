# Safe Refactor

`safe-refactor` is an evidence-first refactoring workflow for finding the highest-value behavior-preserving refactor that can be safely bounded, staged, and validated.

It is designed for workflows where the agent should:

- optimize for maintainability value per unit of risk, not smallest diff
- preserve current behavior through public-interface tests, existing coverage, typecheck, benchmarks, or equivalent evidence
- compare candidate refactors by value, risk, testability, scope coherence, and validation cost
- support either an implemented refactor or a recommendation-only outcome when the right refactor is too strategic for one safe pass
- keep public APIs, schemas, exported types, routes, persisted data, analytics events, error contracts, and high-risk domains compatible unless the user approves a migration
- use meaningful test design: fewest useful tests, representative edge cases, table/property tests for matrices, and diagnostic failures
- require confirmation before editing a dirty tracked worktree
- run focused validation first, then broader validation when the blast radius warrants it
- require a build-green gate before completion: package typecheck/build, downstream consumer typecheck/build, deploy-equivalent app build, or repo-level validation as appropriate
- inspect the final diff for unrelated churn and hidden behavior changes

## Example Prompts

```text
Use $safe-refactor to find the highest-value safe refactor and preserve behavior.
Use $safe-refactor in this repo and preserve public API compatibility.
Find a meaningful refactor opportunity, protect existing behavior, and validate it.
Use $safe-refactor to evaluate whether this module has a worthwhile refactor; no token cleanup.
```

## Source Map

```text
plugins/safe-refactor/
  .codex-plugin/plugin.json
  commands/safe-refactor.md
  skills/safe-refactor/SKILL.md
  skills/safe-refactor/agents/openai.yaml
```

## Notes

- repository instructions override the skill's defaults
- the skill chooses one coherent refactor, not unrelated broad cleanup
- a successful run can end with no code changes when the best outcome is a staged recommendation
- characterization tests may pass before the refactor when covering existing behavior, but the protected invariant and future regression should be named
- tiny private-helper extraction is only acceptable when it protects a previously untested public invariant
- type-safety refactors should make internal types at least as strict while preserving public compatibility
- performance refactors need measurement when practical or a defensible complexity/repeated-work argument
- schema/API/high-risk work must stay additive and backward-compatible unless the user approves a migration plan
- skipped full validation should include a blast-radius rationale or a clear validation gap
- a refactor is not complete, safe, or validated until the relevant build-green gate has passed; tests alone are insufficient for build-affecting TypeScript or app code
