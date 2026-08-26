# $fix-all-issues

Review and fix a pull request or branch through fresh background-agent rounds. Keep the main agent available as the orchestrator, bind evidence to exact Git trees, publish each repaired round, and stop only at the selected clean or capped outcome.

## Arguments

- `pr`: PR URL or number. If omitted, use the current branch and repository integration/default base.
- `review_mode`: `exhaustive` by default, or `quick`.
- `num_agents`: Concurrent background-agent ceiling, including coordinators. Default `8` or `5` by mode.
- `orchestrator_only`: Default `true`.
- `fresh_round_context`: Default `true`.
- `stop_policy`: `fresh-zero` by default in exhaustive mode, or `stabilized`.
- `required_clean_outer_rounds`: Default `1`.
- `max_outer_rounds`: Default `8` in exhaustive mode and `5` in quick mode.
- `max_fix_rounds`: Default `8` in exhaustive mode and `5` in quick mode.
- `max_rounds`: Legacy alias for `max_outer_rounds`.
- `cap_strategy`: `reserve-confirmation` by default, or `hard`, or `ask`.
- `progress`: `milestones` by default, or `heartbeat`.

## Workflow

Use the `fix-all-issues` skill and its linked protocol, templates, and schemas. Treat this command as approval for background agents, local edits, validation, focused commits, normal pushes, and PR description updates. It does not approve deployment, production mutation, scope expansion, history rewrite, force-push, destructive cleanup, or external communication.

When `orchestrator_only=true`, the main agent must not do target work. It creates durable run state, spawns a new coordinator for every outer round, tracks cumulative unique findings, reports after each round, and enforces the selected stop policy. Each coordinator owns review, gated triage, fixes, validation, cleanup convergence, commit, push, and fetch-before-edit PR delivery.

Repository and user instructions override defaults. Never approve review or validation from a different candidate tree. Do not let late findings skip verification and triage. If caps stop the run, report `capped-stabilized` or `capped-with-residuals`, never a vague success.

## Output

Report the named outcome, exact final tree, outer and inner counts, cumulative unique findings by origin, validation bound to the final tree, cleanup convergence, push and PR-body status, diff-growth guard, deployments, and residual risks.
