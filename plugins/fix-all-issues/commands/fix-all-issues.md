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
4. Resolve the target PR or current branch before delegating review work. Flag unusual base branches (for example `dev` or a release branch) and carry the note through the final summary.
5. Budget thread capacity before spawning reviewers. Scale reviewer count to PR size (3 for small, 4 for medium, 5 only for large/multi-subsystem diffs). Reserve room for fixers and the final fresh review.
6. Run one independent review batch, one fix batch, then validation.
7. Close completed review agents before spawning fixers if capacity is tight.
8. During triage, record the acceptance rule (`high-confidence`, `two-reviewer-agreement`, or `main-agent-verified`) for every accepted finding, and apply the scope-expansion rule: never silently land behavior/UX/analytics changes the PR body did not promise — confirm with the user or defer as a follow-up.
9. Run the repo's autofix/formatter command before the strict lint and test pass, so tests always run against already-formatted code. Fix workers should do this on their owned files before reporting done.
10. If validation is clean, run one fresh review batch on the current final diff before declaring success.
11. While background agents are running, have them send frequent progress updates and keep the main agent showing an aggregated overall status.
12. If the client supports it, use structured phase tracking for top-level progress and compact live counters for in-flight status. Otherwise emit concise textual progress updates.
13. Use the skill's reviewer and fixer prompt templates so outputs stay structured and easy to triage.
14. Repeat in rounds until a fresh review batch returns zero actionable findings and validation is still clean, or `max_rounds` is reached.
15. Keep the main agent focused on orchestration, integration, and Git or GitHub state.
16. Before pushing, update the PR description when the fix batch added behavior, analytics, UX changes, new tests, or new doc guidance beyond the original body.
17. Default to a normal commit and regular push. Rewrite history only when the user explicitly asked for it or the repo workflow clearly requires it.

## Output

Report the PR or branch reviewed, round count, validation result, and push status in a one-paragraph summary, followed by a findings ledger table (`id | status | severity | rule-applied | note`) covering accepted/fixed, rejected, and deferred items. Call out scope-expansion items deferred to follow-up PRs, unusual base branches, any generated artifacts refreshed, and whether history was rewritten.
