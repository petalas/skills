# Fix all issues

`fix-all-issues` runs a stateful PR review and remediation loop through fresh background agents. Version 0.7.0 makes orchestration-only operation the default and separates fresh outer review rounds from inner fix stabilization.

The skill now:

- creates untracked run state with immutable original intent, root-cause fingerprints, tree-bound validation, and round summaries
- spawns a new round coordinator for every outer iteration while the main agent stays available
- selects specialist reviewers from risk signals such as async lifecycle, time authority, reactive dependencies, native APIs, and changed shared interfaces
- blocks fixes until verification, primary triage, independent second triage, and disagreement resolution finish
- requires caller inventories, temporal state-machine review, and root-cause escalation to the responsible seam
- invalidates review and validation when the candidate tree or behavior-relevant PR body changes
- stops with explicit `clean`, `stabilized`, `capped-stabilized`, or `capped-with-residuals` outcomes
- guards against runaway PR growth and records finding origin, deployment authority, and residual risk

## Examples

```text
Use $fix-all-issues on this PR
Use $fix-all-issues pr=123
Use $fix-all-issues pr=123 review_mode=quick stop_policy=stabilized
Use $fix-all-issues pr=123 orchestrator_only=true fresh_round_context=true
Use $fix-all-issues pr=123 max_outer_rounds=8 max_fix_rounds=8 cap_strategy=reserve-confirmation
Use $fix-all-issues pr=123 required_clean_outer_rounds=2 progress=heartbeat
```

## Inputs

- `review_mode`: `exhaustive` by default, or `quick`
- `num_agents`: concurrent background-agent ceiling, including the coordinator
- `orchestrator_only`: keeps target work out of the main agent, default `true`
- `fresh_round_context`: requires new coordinators and reviewers, default `true`
- `stop_policy`: `fresh-zero` or `stabilized`
- `required_clean_outer_rounds`: fresh zero rounds needed for `clean`, default `1`
- `max_outer_rounds`: fresh review cap, default `8` or `5` by mode
- `max_fix_rounds`: inner stabilization cap, default `8` or `5` by mode
- `max_rounds`: legacy alias for `max_outer_rounds`
- `cap_strategy`: `reserve-confirmation`, `hard`, or `ask`
- `progress`: `milestones` or `heartbeat`

Invocation covers local review/fix work, validation, focused commits, normal pushes, and PR description updates. Deployment, production mutation, force-push, history rewrite, destructive cleanup, external communication, and scope expansion need separate authority.

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

The installed skill includes the references, templates, and schemas. Repository maintainers can run `bun run validate:fix-all-issues` to check version parity, required files, shared inputs, protocol cases, JSON syntax, and ASCII compliance.

See [../../LEARNINGS.md](../../LEARNINGS.md) for the design history and v0.7.0 run evidence.
