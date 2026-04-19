---
name: fix-all-issues
description: Coordinate a multi-round PR review and remediation workflow using parallel background agents. Use when asked to review a pull request or current branch, find bugs, regressions, and nits, fix the accepted findings with delegated workers, rerun lint and tests, update the PR branch, and repeat until no actionable findings remain. Triggers include `/fix-all-issues`, requests to "review this PR and fix everything", or requests for a parallel review/fix loop on a GitHub PR.
---

Review and fix a PR in rounds. Stay in orchestration mode as much as possible: delegate reviews, code changes, and localized follow-up work; keep local work to integration, branch management, and final verification.

## Inputs

- `pr`: PR URL or number. If omitted, review the current branch against `main`.
- `num_agents`: Number of parallel background agents. Default `5`.
- `max_rounds`: Maximum review and fix rounds before stopping. Default `5`.
- `review_mode`: `normal` or `exhaustive`. Default `normal`. Use `exhaustive` when the user explicitly asks for all issues, low-severity findings, or nits.

## Precedence

- Repository instructions override this skill. If `AGENTS.md`, local docs, CI config, or the user request conflict with this skill's default tool choices, branch workflow, or validation order, follow the repo and user instructions.

## Guardrails

- Treat this workflow as explicit approval to use subagents and parallel worker batches.
- Preserve behavior. Fix issues in a backwards-compatible way unless the user explicitly approves a breaking change.
- Do not fabricate validation commands. Discover them from `package.json`, `Makefile`, `justfile`, CI config, repo docs, or `AGENTS.md`.
- Do not loop forever. Stop after a clean round with zero actionable findings, or after `max_rounds` full rounds and report the residual issues.
- Rewrite history only when safe. If the workflow calls for amending and force-pushing, verify the branch is rewrite-safe first and use `git push --force-with-lease`, never plain `--force`.
- Prefer the repo's documented GitHub workflow. If the repo does not specify one, prefer GitHub app tools when available and fall back to `gh` for PR lookup, checkout, and PR body updates.

## Resolve Target

1. Determine the review target.

- If `pr` is a URL or number, inspect the PR and ensure the correct branch is checked out locally.
- If `pr` is omitted, diff the current branch against `main`.
- If the current branch is `main` and no `pr` is provided, stop and ask the user for a PR or non-default branch.

2. Gather repo-specific rules before delegating work.

- Read nearby `AGENTS.md`, repo docs, CI config, and package scripts.
- Record the canonical lint, test, typecheck, and build commands.
- Note any explicit compatibility constraints, generated code flows, or protected files.

## Review Round

Spawn `num_agents` reviewers in parallel. Each reviewer inspects the same PR or branch diff, but use different review lenses to reduce duplicated blind spots:

- correctness and regressions
- backward compatibility and API changes
- missing tests and edge cases
- security, data integrity, and failure handling
- maintainability, performance, and nits

Ask each reviewer to return only actionable findings. Require:

- stable finding id
- severity: `high`, `medium`, or `low`
- confidence: `high`, `medium`, or `low`
- category: correctness, compatibility, tests, security, maintainability, performance, or nit
- file and line references when possible
- why the behavior is wrong or risky
- concrete proof or failure mode, not just suspicion
- the smallest safe fix
- whether the fix has breaking-risk
- any validation the fixer should run

## Triage Findings

After all reviewers return:

1. Merge the finding lists.
2. Deduplicate overlapping items.
3. Drop weak or purely speculative comments.
4. Group the remaining findings into disjoint implementation batches by file ownership.
5. Track a findings ledger for the round before spawning fixers:
   - accepted
   - rejected
   - deferred
   - fixed
   - validation status

Prefer fewer solid findings over exhaustive noise in `normal` mode.
In `exhaustive` mode, keep low-severity findings and nits if they are concrete, actionable, and local enough to fix safely.

## Fix Round

Spawn a new worker batch for the accepted findings.

- Give each worker explicit ownership of files or modules.
- Give each worker a disjoint write set whenever possible. Keep generated files and final integration under the main agent unless delegation is clearly safer.
- Tell each worker that other workers are also active and they must not revert unrelated edits.
- Require 100% backwards-compatible fixes unless the finding itself proves the current behavior is already broken.
- Require the smallest relevant validation after each fix.
- Ask each worker to report:
  - files changed
  - findings resolved
  - validation run
  - remaining uncertainty

Keep the main agent available. It should orchestrate, integrate worker results, resolve overlaps, and handle git and GitHub state, not become the primary coder unless no delegated path is viable.

## Progress Reporting

- Background agents should send brief progress updates frequently while they are working. Prefer an update every 30 to 60 seconds during longer tasks, or immediately after a meaningful milestone such as finishing review, finishing an edit batch, or hitting a blocker.
- Each progress update should be short and structured enough for the main agent to aggregate:
  - current phase
  - owned files or scope
  - completed work
  - next step
  - blocker, if any
- The main agent should maintain and surface an overall progress summary while the workflow is running. Prefer simple, live-readable status such as:
  - reviewers complete: `3/5`
  - fix batches complete: `2/3`
  - validation: `pending`, `running`, or `green`
  - current round: `2/5`
- If the client supports richer live rendering, prefer compact progress bars or phase summaries that update in real time. If it does not, emit concise textual progress updates with the same information.
- Do not wait silently for long-running agents when the main agent can show overall progress. Keep updates useful and compact rather than verbose.

## Generated Artifacts

- If the diff touches generated clients, typed RPC surfaces, schemas, codegen outputs, or framework-generated files, discover and run the repo's canonical generation step before final validation.
- If generated files changed, verify they match the source edits and include them in the final review surface.

## Validation

After integrating the fix batch:

1. Run the narrowest relevant checks first.
2. Finish with the repo's canonical lint and test commands.
3. Run typecheck or build if the repo treats them as required PR gates.
4. If validation fails, open another fix batch for the failing area and rerun validation.
5. If validation is green, run one fresh review round on the final diff before declaring success.

Do not declare success while lint or tests still fail. If the repo has no lint or no tests, say that explicitly in the final summary.
Treat stderr noise carefully: distinguish real validation failures from known or pre-existing noisy warnings in green test runs, and report the noise without misclassifying the validation result.

## Git And PR Updates

When validation is clean:

1. Update the PR description if the scope or risk profile changed materially.
2. If the branch is rewrite-safe and the workflow or user request calls for it, amend the last commit and force-push with lease.
3. If the branch is not rewrite-safe, stop and ask before rewriting history.
4. Keep commit and PR descriptions aligned with the final diff.

Treat a branch as rewrite-safe only when all of the following are true:

- the branch is not protected
- the branch is not shared in a way that would surprise collaborators
- the new changes belong in the existing tip commit
- `git push --force-with-lease` is available

## Loop

Repeat:

1. review round
2. triage
3. fix round
4. validation

Stop when a fresh review round finds zero actionable issues and validation is clean, or when `max_rounds` rounds have completed. If the round cap is hit, summarize the unresolved items instead of looping again.

## Final Output

Report:

- target PR or branch
- number of rounds
- all accepted findings that were fixed
- any findings deliberately rejected or deferred and why
- validation commands run and their result
- whether generated artifacts were refreshed
- whether the branch was force-pushed
