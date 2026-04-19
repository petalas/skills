# Fix All Issues

`fix-all-issues` is a review-and-remediation skill for pull requests and active branches.

It is designed for workflows where the agent should:

- fan out independent review passes in parallel
- deduplicate findings
- fix accepted issues with delegated workers
- keep live progress visible while work is running
- validate changes
- run one fresh review round before declaring success

## Example Prompts

```text
Use $fix-all-issues on this PR with 5 agents
Use $fix-all-issues pr=123
Review my current branch against main and fix every issue you find
Use $fix-all-issues pr=123 num_agents=6 max_rounds=5 review_mode=quick
```

## Source Map

```text
plugins/fix-all-issues/
  .codex-plugin/plugin.json
  commands/fix-all-issues.md
  skills/fix-all-issues/SKILL.md
  skills/fix-all-issues/agents/openai.yaml
```

## Notes

- repository instructions override the skill's defaults
- `review_mode=exhaustive` is the default and keeps concrete low-severity issues and nits
- omit `review_mode` when you want the full default pass
- `review_mode=quick` is the faster, lower-noise mode for higher-signal findings
- the skill explicitly asks background agents to send frequent progress updates so the main agent can show an aggregated status view
- the skill now treats `num_agents` as a ceiling and explicitly reserves thread budget for fixers and the final fresh review
- use `$fix-all-issues` consistently in prompts and examples
- see [../../LEARNINGS.md](../../LEARNINGS.md) for design notes on agent budgets, timeouts, triage, prompt templates, and git safety
