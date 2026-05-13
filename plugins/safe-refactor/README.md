# Safe Refactor

`safe-refactor` is a disciplined refactoring workflow for finding the highest-value behavior-preserving refactor that can be safely bounded, covered by tests or equivalent evidence, and validated.

It is designed for workflows where the agent should:

- identify one coherent high-value code architecture improvement
- preserve current behavior through public-interface tests
- use characterization tests, existing tests, vertical TDD, typecheck, benchmarks, or other appropriate evidence instead of speculative rewrites
- keep Convex schemas, APIs, exported types, routes, and persisted data compatible with live clients
- run focused validation first, then broader validation when the blast radius warrants it
- state a candidate card before editing so the refactor choice, first test, and validation scope are auditable
- reject near-trivial cleanup unless the test protects a public invariant or compatibility guardrail

## Example Prompts

```text
Use $safe-refactor to find the highest-value safe refactor and preserve behavior.
Use $safe-refactor in this repo and preserve public API compatibility.
Find a meaningful refactor opportunity, protect existing behavior, and validate it.
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
- the agent should briefly mention rejected candidates when multiple options exist, so "small" does not collapse into "first easy cleanup"
- characterization tests may pass before the refactor when covering existing behavior, but the protected invariant should be named
- tiny private-helper extraction is only acceptable when it protects a previously untested public invariant
- schema or API work must stay additive and backward-compatible unless the user approves a migration plan
- skipped full validation should include a blast-radius rationale or a clear validation gap
