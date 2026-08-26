# $fix-all-issues

Review and fix a pull request or branch through bounded fresh outer rounds. Keep every verified issue visible, fix qualifying responsibility, route adjacent work, and stop with an exact terminal state.

## Arguments

- `pr`: PR URL or number. If omitted, use the current branch and documented integration or default base.
- `review_mode`: `exhaustive` by default, or `quick`.
- `num_agents`: Concurrent background-agent ceiling, including the coordinator. Default `6` or `4` by mode.
- `orchestrator_only`: Default `true`.
- `fresh_round_context`: Default `true`; freshness applies at outer-round boundaries.
- `stop_policy`: `fresh-zero` by default in exhaustive mode, or `stabilized`.
- `required_clean_outer_rounds`: Default `1`.
- `max_outer_rounds`: Default `6` in exhaustive mode and `4` in quick mode.
- `max_fix_rounds`: Default `6` in exhaustive mode and `4` in quick mode.
- `max_rounds`: Legacy alias for `max_outer_rounds`.
- `cap_strategy`: `reserve-confirmation` by default, or `hard`, or `ask`.
- `reviewer_timebox_minutes`: Default `12` in exhaustive mode and `8` in quick mode.
- `early_claim_minutes`: Default `4` in exhaustive mode and `3` in quick mode.
- `progress`: `milestones` by default, or `heartbeat`.

## Workflow

Use the `fix-all-issues` skill and its linked protocol, templates, and schemas. Invocation approves background agents, local edits, validation, focused commits, normal pushes, and PR description updates. It does not approve deployment, production mutation, product expansion, history rewrite, force-push, destructive cleanup, external communication, or tracker mutation.

When `orchestrator_only=true`, the main agent manages state and a fresh outer coordinator owns target work. Each outer round uses one exact-tree evidence packet and a small fixed pool with reserved independent slots. Workers reuse the packet and applicable repository rules instead of rereading the whole diff and skill reference set.

Attribute every verified finding. Fix `in-envelope` work from the original change, candidate behavior, direct contracts and callers, and accepted-fix correctness. Durably record adjacent pre-existing or product issues as `deferred`, `routed-follow-up`, `routed-user-authority`, or `routed-external-owner`. Growth triggers root-cause consolidation or patch replacement. It never makes a qualifying issue disappear.

Run cold code and proposed-body review before canonical root validation. Root validation runs once per zero-claim candidate, followed by a narrow post-cleanup check. Keep `remote_body_hash` and `proposed_body_hash` separate. Reuse validation only through explicit final-tree ledger rows with unaffected dependency proof.

Stop as `clean`, `scope-routed`, `stabilized`, `blocked`, `capped-in-envelope-green`, or `capped-with-residuals`. Never call routed, blocked, or capped work cleanly fixed.

## Output

Report the terminal state, exact final tree, body hashes, outer and inner counts, findings by attribution and route, validation execution and reuse, cleanup and cold-zero results, growth responses, push and PR-body status, critical-path time, repeated-work or serialization alarms, deployments, and residual risks.
