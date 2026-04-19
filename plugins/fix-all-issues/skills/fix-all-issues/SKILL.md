---
name: fix-all-issues
description: Coordinate a multi-round PR review and remediation workflow using parallel background agents. Use when asked to review a pull request or current branch, find bugs, regressions, and nits, fix the accepted findings with delegated workers, rerun lint and tests, update the PR branch, and repeat until no actionable findings remain. Triggers include `$fix-all-issues`, requests to "review this PR and fix everything", or requests for a parallel review/fix loop on a GitHub PR.
---

Review and fix a PR in rounds. Stay in orchestration mode as much as possible: delegate reviews, code changes, and localized follow-up work; keep local work to integration, branch management, and final verification.

## Inputs

- `pr`: PR URL or number. If omitted, review the current branch against `main`.
- `num_agents`: Number of parallel background agents. Default `5`.
- `max_rounds`: Maximum review and fix rounds before stopping. Default `5`.
- `review_mode`: `exhaustive` or `quick`. Default `exhaustive`.
- `exhaustive`: keep concrete low-severity findings and local nits when they are safe to fix.
- `quick`: bias toward fewer, higher-signal findings and skip most low-severity nits unless they clearly matter.
- Treat legacy `normal` as an alias for `quick`.
- Omit `review_mode` when you want the full default pass.

## Capacity Planning

Before spawning background agents, budget thread capacity deliberately.

- `num_agents` is a ceiling, not a requirement.
- Reserve at least 2 background-agent slots beyond the main rollout:
  - 1 for a fix worker or fallback investigator
  - 1 for the final fresh review pass
- Close completed or no-longer-needed agents before spawning the next batch.
- If the platform enforces a thread cap and you cannot determine the remaining capacity, be conservative on the first review batch. Start with at most `4` reviewers even if `num_agents` is higher.
- Prefer having one fewer reviewer over blocking the entire fix round because no worker slots remain.

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

Spawn up to the effective reviewer count in parallel. Each reviewer inspects the same PR or branch diff, but use different review lenses to reduce duplicated blind spots:

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

Use a reviewer prompt equivalent to:

```text
Review only the current PR or branch diff against the base branch.
Lens: <assigned lens>.
Do not edit files.
Return only actionable findings.
For each finding include:
- stable id
- severity
- confidence
- category
- file:line
- why it is wrong or risky
- concrete proof or failure mode
- smallest safe fix
- breaking-risk
- validation to run
If no actionable findings, say that explicitly.
```

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

Prefer fewer, higher-signal findings in `quick` mode.
In `exhaustive` mode, keep low-severity findings and nits if they are concrete, actionable, and local enough to fix safely.

Apply a concrete triage rubric:

- Accept a finding when it names a specific failure mode and at least one of the following is true:
  - confidence is `high`
  - two reviewers independently describe the same root cause
  - the main agent locally verified the claim
- Reject a finding when it is speculative, duplicates an already-accepted root cause, lacks a concrete failure mode, or depends on an unstated product decision.
- Defer a finding when it is concrete but needs live-system validation, a broader refactor, cross-team coordination, or explicit user approval.
- Deduplicate by root cause, not wording. If three reviewers describe the same bug, keep one ledger item with merged supporting evidence.

## Fix Round

Spawn a new worker batch for the accepted findings.

- Before spawning fixers, close completed review agents if capacity is tight.
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

Use a fixer prompt equivalent to:

```text
Implement only the accepted findings assigned to your owned files.
You are not alone in the codebase. Do not revert unrelated edits.
Preserve backwards compatibility unless the finding proves current behavior is already broken.
Run the smallest relevant validation after the change.
Report:
- files changed
- findings resolved
- validation run
- remaining uncertainty
```

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
- Give each batch a timeout budget. Suggested defaults:
  - review batch: `10-15 minutes`
  - small fix batch: `10 minutes`
  - final re-review: `5 minutes`
- If an agent stays silent or misses its timeout, stop blocking on it. Continue with completed results, or respawn exactly once if the missing output is on the critical path.
- If the client supports richer live rendering, prefer compact progress bars or phase summaries that update in real time. If it does not, emit concise textual progress updates with the same information.
- Do not wait silently for long-running agents when the main agent can show overall progress. Keep updates useful and compact rather than verbose.
- Do not busy-poll with repeated short waits. Prefer longer waits while doing useful local work.

## Display Conventions

Prefer the richest structured display the client actually supports, but always keep a plain-text fallback.

- If a structured plan or task-progress API is available, use it for top-level phase tracking:
  - target resolution
  - review round
  - triage and fix round
  - validation
  - final re-review
- Use short one-line counter summaries for live status updates. Good shape:
  - `round 1/5 | reviewers 3/4 | fixers 0/1 | validation pending`
- Use flat Markdown tables only for stable, finalish metadata where rows share the same fields:
  - findings ledger
  - accepted vs deferred items
  - validation summary
- Use bullets, not tables, when data is sparse, hierarchical, or still changing quickly.
- Use fenced `json` or `yaml` blocks only when the schema itself matters more than readability.
- Do not dump raw agent transcripts into the main progress view. Aggregate them into stable counters and ledger entries.
- Do not emit giant metadata blocks repeatedly. Reuse the same keys and shapes so each update is easy to compare with the last one.
- In the final output, prefer:
  - short paragraph summary first
  - flat bullets for accepted, rejected, or deferred findings
  - a compact table only if it materially improves scanability

Suggested live status template:

```text
round 2/5 | reviewers 4/4 | fixers 1/2 | validation running
accepted 3 | deferred 1 | rejected 4
```

Suggested final ledger table:

```md
| id     | status   | severity | note                        |
| ------ | -------- | -------- | --------------------------- |
| R1-001 | fixed    | medium   | analytics regression        |
| R1-002 | deferred | low      | needs live-store validation |
```

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
6. Keep the final review narrow:
   - use `1-2` reviewers, not the full first-round fanout
   - review the current final diff only
   - do not reopen already-rejected speculative findings unless the new diff changes the evidence

Do not declare success while lint or tests still fail. If the repo has no lint or no tests, say that explicitly in the final summary.
Treat stderr noise carefully: distinguish real validation failures from known or pre-existing noisy warnings in green test runs, and report the noise without misclassifying the validation result.

## Git And PR Updates

When validation is clean:

1. Update the PR description if the scope or risk profile changed materially.
2. Default to a normal commit and regular push.
3. Amend the last commit and force-push with lease only if the user explicitly asked for history cleanup, or the repo workflow clearly expects it, and the branch is rewrite-safe.
4. If the branch is not rewrite-safe, stop and ask before rewriting history.
5. Keep commit and PR descriptions aligned with the final diff.

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
