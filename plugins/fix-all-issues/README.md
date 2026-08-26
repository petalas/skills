# Fix all issues

`fix-all-issues` runs a bounded PR review and remediation loop through background agents. Version 0.8.0 keeps strict fresh-zero proof for work the PR owns while routing verified adjacent issues instead of silently dropping them or letting them inflate the current PR forever.

The skill:

- attributes findings to the originating change, candidate behavior, direct contracts and callers, accepted-fix correctness, adjacent pre-existing code, or product decisions
- fixes verified in-envelope issues and records durable defer, follow-up, user-authority, or external-owner routes for verified out-of-envelope issues
- treats growth thresholds and a second same-invariant finding as root-cause consolidation or patch-replacement triggers
- creates one exact-tree evidence packet with caller rows so workers share facts without rereading the whole diff and protocol
- refreshes context at outer-round boundaries, then reuses a small fixed worker pool with reserved independent slots inside the round
- batches findings through primary and independent triage, using a resolver only for real disagreement
- runs cold code and proposed-body review before expensive root validation, then performs a narrow post-cleanup check
- keeps tree-keyed validation rows with affected-surface invalidation and explicit reuse proof
- reports lifecycle, critical path, phase time, repeated validation, and avoidable serialization
- stops as `clean`, `scope-routed`, `stabilized`, `blocked`, `capped-in-envelope-green`, or `capped-with-residuals`

## Examples

```text
Use $fix-all-issues on this PR
Use $fix-all-issues pr=123
Use $fix-all-issues pr=123 review_mode=quick stop_policy=stabilized
Use $fix-all-issues pr=123 orchestrator_only=true fresh_round_context=true
Use $fix-all-issues pr=123 max_outer_rounds=6 max_fix_rounds=6 cap_strategy=reserve-confirmation
Use $fix-all-issues pr=123 reviewer_timebox_minutes=10 early_claim_minutes=3 progress=heartbeat
```

## Inputs

- `review_mode`: `exhaustive` by default, or `quick`
- `num_agents`: concurrent ceiling including the coordinator, default `6` or `4` by mode
- `orchestrator_only`: keeps target work out of the main agent, default `true`
- `fresh_round_context`: creates a fresh coordinator and blind pool at each outer boundary, default `true`
- `stop_policy`: `fresh-zero` or `stabilized`
- `required_clean_outer_rounds`: fresh zero rounds needed for in-envelope proof, default `1`
- `max_outer_rounds`: fresh review cap, default `6` or `4` by mode
- `max_fix_rounds`: repair-cycle cap, default `6` or `4` by mode
- `max_rounds`: legacy alias for `max_outer_rounds`
- `cap_strategy`: `reserve-confirmation`, `hard`, or `ask`
- `reviewer_timebox_minutes`: per-reviewer timebox, default `12` or `8` by mode
- `early_claim_minutes`: first-claim or no-claim checkpoint, default `4` or `3` by mode
- `progress`: `milestones` or `heartbeat`

Invocation covers local review and repair, validation, focused commits, normal pushes, and PR description updates. Deployment, production mutation, force-push, history rewrite, destructive cleanup, external communication, tracker mutation, and product expansion need separate authority.

## Source map

```text
plugins/fix-all-issues/
  .codex-plugin/plugin.json
  commands/fix-all-issues.md
  skills/fix-all-issues/
    SKILL.md
    agents/openai.yaml
    references/*.md
    templates/*.md
    schemas/*.json
```

The installed skill includes references, prompts, and JSON schemas for run state, evidence packets, findings, validation, and protocol cases. Repository maintainers can run `bun run validate:fix-all-issues` to check version parity, required files, shared inputs, schema structure, protocol cases, JSON syntax, and ASCII compliance.

See [../../LEARNINGS.md](../../LEARNINGS.md) for the v0.8.0 convergence and responsibility rationale.
