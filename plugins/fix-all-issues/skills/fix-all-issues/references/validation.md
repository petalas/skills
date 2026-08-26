# Validation protocol

Validation proves the final candidate without paying full-repository cost on every speculative patch.

## Command discovery and classification

Discover commands from repository instructions, package scripts, CI, task runners, and domain docs. Record each command as:

- `read-only`: inspection, lint, tests, typecheck, or build that does not persist target changes
- `local-write`: formatter, autofix, code generation, or fixture update
- `development-mutation`: preview data, local migration, simulator state, or sandbox effect
- `production-mutation`: deploy, production data, release, or external send

Invocation authorizes the first two when repository rules allow them. Development mutation needs repository or user authority. Production mutation always needs explicit user authority.

## Tree-keyed ledger

Append one row to `validation.json` for every command, code review, body review, cleanup pass, or live check. Record:

- entry ID, kind, packet ID, candidate tree, and applicable body hash
- exact command and working directory when applicable
- command fingerprint, tool versions, environment, and cache state
- declared input paths, dependency fingerprint, and affected surfaces
- start, end, exit code, result, and modified files
- status: `passed`, `failed`, `blocked`, `invalidated`, or `reused`
- invalidation reason or source entry when reused

Never overwrite failure history.

## Affected-surface invalidation and reuse

After an edit, map changed files and contracts to affected surfaces. Invalidate an entry when its declared inputs, dependency graph, generated inputs, runtime configuration, public contract, or tested behavior intersects the change.

Evidence may be reused onto a new tree only when:

1. the prior entry passed
2. the dependency fingerprint is still valid
3. changed surfaces do not intersect its inputs or outputs
4. repository rules do not require a rerun
5. a new final-tree row records `status=reused`, the source entry, and the proof

Unknown impact invalidates conservatively. A reused row is not described as a command executed on the new tree.

Body-only edits do not invalidate code checks. Code-only edits do not invalidate body review unless they change promised behavior. A metadata-only commit with unchanged tree preserves tree evidence.

## Phase order

Use this order:

1. fixer red-green or mutation evidence
2. formatter or autofix on owned files
3. smallest affected tests and direct workspace checks
4. cleanup until one zero-edit pass
5. narrow re-review of touched invariants and callers
6. cold code and proposed-body confirmation on the post-cleanup candidate
7. canonical root lint, tests, typecheck, build, generation, and live checks once after the zero claim
8. one post-cleanup narrow review and affected check set

Do not run expensive root validation before cold confirmation. Do not repeat the same unchanged-tree root command. If a post-root check finds a qualifying issue and a repair changes the candidate, return to gates and require a new cold zero before another root run.

The root suite may contain several repository-mandated commands. "Once" means one canonical pass per zero-claim candidate, not one shell command.

## Cold code and body confirmation

Cold confirmation binds two independent claims:

- code claim against `candidate_tree_oid`
- spec claim against `proposed_body_hash`, while retaining `remote_body_hash` as the fetched source

The confirmer receives no prior findings or fix rationale. A zero claim must cover every mandatory responsibility-envelope and risk row. Uncovered mandatory rows do not unlock root validation.

A deferred or routed out-of-envelope issue does not fail the in-envelope zero claim. It must be written to `findings.json`, and the terminal state becomes `scope-routed` if all in-envelope gates later pass.

## Cache and repeated-work alarms

Record cache hits. A cached root command may supplement but not replace one direct affected-workspace or uncached check when the repository provides a documented command. Do not invent flags.

Raise `root-validation-repeat` when the same command fingerprint runs twice on the same tree and environment. Raise `avoidable-serialization` when disjoint checks waited despite free capacity. Repetition required by changed inputs is not an alarm, but record the invalidating change.

## Environment failures

Fingerprint a failure from command, stable error, runner, and environment. Investigate the first occurrence. If environmental:

1. record the fingerprint and workaround
2. reuse it while runner and environment stay unchanged
3. do not repeat the full investigation each round
4. reconfirm once in final validation

Changed signatures, runners, dependency graphs, or environments require a new investigation.

## Generated artifacts

Run generation only when source inputs changed or repository rules require it. Record input paths, command, outputs, and affected surfaces. Generated changes create a new tree and packet, then re-enter review and validation gates.

## Live validation

Choose the strongest practical level required by risk:

- `smoke`: boot or load the changed module
- `affected-path`: exercise the changed UI, endpoint, command, native screen, or transition end to end
- `external-effect`: confirm the intended result in an authorized sandbox or external system

Do not repeat an identical live check when tree, relevant runtime inputs, and environment are unchanged. Missing credentials, device state, build, or access becomes a residual risk or `blocked` when the evidence is mandatory.

## Deployment ledger

Keep a deployment ledger even when empty. Record environment, command or tool, actor, authority source, candidate tree, result, and rollback notes. Validation documentation never grants deployment authority.
