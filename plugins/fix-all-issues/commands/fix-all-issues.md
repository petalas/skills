# $fix-all-issues

Review the target pull request or current branch in parallel, fix the accepted findings, and iterate until validation is clean.

## Arguments

- `pr`: PR URL or number. If omitted, use the current branch against `main`.
- `num_agents`: Parallel background agents to use for review and fix batches. Optional. Default `5`.
- `max_rounds`: Maximum review and fix rounds before stopping. Optional. Default `5`.
- `review_mode`: `exhaustive` or `quick`. Optional. Default `exhaustive`. Treat legacy `normal` as `quick`.
- Omit `review_mode` for the full default pass.

## Workflow

1. Use the `fix-all-issues` skill.
2. Treat this command as explicit approval to use subagents and parallel worker batches.
3. Follow repository `AGENTS.md`, local docs, and user instructions over the skill's default tool and git preferences.
4. Resolve the target PR or current branch before delegating review work.
5. Budget thread capacity before spawning reviewers. Reserve room for fixers and the final fresh review.
6. Run one independent review batch, one fix batch, then validation.
7. Close completed review agents before spawning fixers if capacity is tight.
8. If validation is clean, run one fresh review batch on the current final diff before declaring success.
9. While background agents are running, have them send frequent progress updates and keep the main agent showing an aggregated overall status.
10. If the client supports it, use structured phase tracking for top-level progress and compact live counters for in-flight status. Otherwise emit concise textual progress updates.
11. Use the skill's reviewer and fixer prompt templates so outputs stay structured and easy to triage.
12. Repeat in rounds until a fresh review batch returns zero actionable findings and validation is still clean, or `max_rounds` is reached.
13. Keep the main agent focused on orchestration, integration, and Git or GitHub state.
14. Default to a normal commit and regular push. Rewrite history only when the user explicitly asked for it or the repo workflow clearly requires it.

## Output

Report the PR or branch reviewed, round count, accepted findings, rejected or deferred findings, fixes made, validation commands run, whether any generated artifacts were refreshed, and whether history was rewritten.
