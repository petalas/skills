# TDD Refactor

`tdd-refactor` is a small-scope refactoring workflow for improving code architecture without sneaking in behavior changes.

It is designed for workflows where the agent should:

- identify one small code architecture improvement
- preserve current behavior through public-interface tests
- use vertical TDD instead of writing a pile of speculative tests
- keep Convex schemas, APIs, exported types, routes, and persisted data compatible with live clients
- run focused validation first, then broader validation when the blast radius warrants it

## Example Prompts

```text
Use $tdd-refactor to find a small architecture improvement, cover it with tests first, then refactor safely.
Use $tdd-refactor in this repo and preserve public API compatibility.
Find one small refactor opportunity and do it TDD style without behavior changes.
```

## Source Map

```text
plugins/tdd-refactor/
  .codex-plugin/plugin.json
  commands/tdd-refactor.md
  skills/tdd-refactor/SKILL.md
  skills/tdd-refactor/agents/openai.yaml
```

## Notes

- repository instructions override the skill's defaults
- the skill deliberately chooses one small candidate instead of broad cleanup
- characterization tests may pass before the refactor when covering existing behavior
- schema or API work must stay additive and backward-compatible unless the user approves a migration plan
