# Validation protocol

Validation proves one exact candidate tree. A command that passed on an older tree is history, not current evidence.

## Command discovery and classification

Discover commands from repository instructions, package scripts, CI, Makefiles, task runners, and domain docs. Record each command class:

- `read-only`: inspection, lint, tests, typecheck, build that does not persist target changes
- `local-write`: formatter, autofix, code generation, local fixture update
- `development-mutation`: preview database write, local migration, simulator state change
- `production-mutation`: deploy, production database write, release, external send

Invocation authorizes the first two when repository rules allow them. Development mutation needs explicit repository or user authority. Production mutation always needs explicit user authority.

## Validation record

For every command record:

- candidate tree OID before command
- exact command and working directory
- relevant runtime/tool versions
- environment or service target without secrets
- command class
- cache mode or cache hit when known
- start/end time and exit code
- concise result
- files modified
- candidate tree OID after command

If a local-write command changes files, snapshot the new tree and invalidate checks on the old tree.

## Required order

1. repository autofix/formatter
2. smallest affected tests or checks
3. direct affected-workspace check, uncached when the repository supports it
4. canonical lint and test suite
5. required typecheck and build
6. generation only when source inputs changed
7. live validation level selected from risk

Run validation again after any fix, cleanup edit, generated change, conflict resolution, or history rewrite that changes `HEAD^{tree}`.

## Cache evidence

Record cache hits. A cached root command can supplement, but not replace, one direct affected-workspace or uncached check when the repository exposes such a command. Do not invent an uncached flag.

## Environment failures

Fingerprint known environment failures from command, stable error signature, runner, and environment. Investigate the first occurrence during the overall run. If confirmed environmental:

1. record the fingerprint and workaround
2. reuse the workaround in later rounds when runner and environment are unchanged
3. do not spend a full investigation each round
4. reconfirm the failure or workaround once during final validation

If the signature, runner, dependency graph, or environment changes, investigate again.

## Generated artifacts

Run generation only when its source inputs changed or repository rules require it. Record input paths, command, and outputs. Review generated diffs with the candidate tree. Never regenerate repeatedly merely because another outer round started.

## Live validation levels

Choose the strongest practical level required by the change:

- `smoke`: boot or load the changed module and confirm no immediate failure
- `affected-path`: exercise the changed UI, endpoint, command, native screen, or state transition end to end
- `external-effect`: confirm the intended result reached a real sandbox or external system

Do not repeat an identical smoke check when relevant runtime inputs and candidate tree are unchanged. A changed implementation, configuration, generated artifact, dependency, or environment invalidates the prior live result.

If credentials, a device, a build, or external access prevent the required level, record the missing evidence in residual risks. Green unit tests do not substitute for it.

## Deployment ledger

Keep a deployment ledger even when empty. Record environment, command/tool, actor, authority source, candidate tree, result, and rollback notes. Do not deploy because a validation document mentions a preview command. Deployment remains a separate authority decision.
