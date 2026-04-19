# /fix-all-issues

Review the target pull request or current branch in parallel, fix the accepted findings, and iterate until validation is clean.

## Arguments

- `pr`: PR URL or number. If omitted, use the current branch against `main`.
- `num_agents`: Parallel background agents to use for review and fix batches. Optional. Default `5`.
- `max_rounds`: Maximum review and fix rounds before stopping. Optional. Default `5`.
- `review_mode`: `normal` or `exhaustive`. Optional. Default `normal`.

## Workflow

1. Use the `fix-all-issues` skill.
2. Treat this command as explicit approval to use subagents and parallel worker batches.
3. Follow repository `AGENTS.md`, local docs, and user instructions over the skill's default tool and git preferences.
4. Resolve the target PR or current branch before delegating review work.
5. Run one independent review batch, one fix batch, then validation.
6. If validation is clean, run one fresh review batch on the final diff before declaring success.
7. While background agents are running, have them send frequent progress updates and keep the main agent showing an aggregated overall status.
8. If the client supports it, render compact live progress bars or phase summaries. Otherwise emit concise textual progress updates.
9. Repeat in rounds until a fresh review batch returns zero actionable findings and validation is still clean, or `max_rounds` is reached.
10. Keep the main agent focused on orchestration, integration, and Git or GitHub state.
11. Amend the last commit and force-push with lease only if the branch is rewrite-safe and the user or workflow explicitly calls for rewriting history. Otherwise stop and ask before rewriting history.

## Output

Report the PR or branch reviewed, round count, accepted findings, rejected or deferred findings, fixes made, validation commands run, whether any generated artifacts were refreshed, and whether history was rewritten.
