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
Use /fix-all-issues on this PR with 5 agents
Review my current branch against main and fix every issue you find
Use /fix-all-issues pr=123 num_agents=6 max_rounds=5 review_mode=exhaustive
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
- `review_mode=exhaustive` keeps concrete low-severity issues and nits
- the skill explicitly asks background agents to send frequent progress updates so the main agent can show an aggregated status view
