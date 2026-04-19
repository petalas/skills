---
name: fix-all-issues
version: 0.4.0
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
- Scale reviewer count to PR size. Oversizing a small PR wastes capacity and produces overlapping findings that still need deduplication:
  - `< 200` changed lines: 3 reviewers (correctness, compatibility, tests)
  - `200 – 1000` lines: 4 reviewers (add security/data integrity)
  - `> 1000` lines, or a diff spanning multiple subsystems: up to 5 reviewers (add maintainability/nits)

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

3. Sanity-check the base branch before spawning reviewers.

- If the PR targets a non-default branch (for example `dev`, a release branch, or a long-lived feature integration branch), briefly acknowledge the unusual base in your own plan and surface it in the final summary. Findings from reviewers may reflect base-branch drift rather than the PR's own changes.
- If the PR's diff against its declared base is much larger than the commits added in the PR, flag this — the base may be stale or the PR may need a rebase before review is useful.

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

Use the template below as the canonical reviewer prompt. You MAY append short lens-specific hints when a lens needs a concrete pointer (for example, for the maintainability lens: "watch for `||` where the project convention is `??`"), but do not replace the template wholesale and do not drop any field from the structured finding schema:

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
- For every accepted finding, record which acceptance rule passed (`high-confidence`, `two-reviewer-agreement`, or `main-agent-verified`). This exposes the reasoning, catches borderline acceptances, and gives the user a clear audit trail in the final ledger.
- Scope-expansion rule: if an accepted finding would add behavior, analytics, UX, or surface area that the PR body / description / commit messages do not already promise — even when the fix is backwards-compatible — do not silently grow the PR. Either:
  - surface the scope expansion to the user and get explicit confirmation before adding it to the fix batch, or
  - defer the finding with reason `scope-expansion` and call it out as a follow-up PR in the final summary.
    A "helpful" scope expansion can land medium-severity behavior changes the PR author never signed up for and complicates review/rollback.

## Fix Round

Spawn a new worker batch for the accepted findings.

- Before spawning fixers, close completed review agents if capacity is tight.
- Give each worker explicit ownership of files or modules.
- Give each worker a disjoint write set whenever possible. Keep generated files and final integration under the main agent unless delegation is clearly safer.
- Tell each worker that other workers are also active and they must not revert unrelated edits.
- Require 100% backwards-compatible fixes unless the finding itself proves the current behavior is already broken.
- Require the smallest relevant validation after each fix. Workers should also run the repo's autofix/formatter command (for example `lint:fix`, `prettier --write`, `biome check --write`) against their owned files before reporting done, so the main agent's canonical lint pass is guaranteed to run against already-formatted code.
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
- Useful local work to fill the wait: pre-draft fix-batch file partitions from the diff you already inspected; grep for callers of symbols the fix will likely touch; confirm canonical lint/test/typecheck commands exist in `package.json`, `Makefile`, or CI config; scaffold the final commit message and PR-description update. Avoid pre-reading file contents that a background agent is currently analyzing — that duplicates context and can bias your triage.

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
- In the final output:
  - lead with a one-paragraph summary (target PR or branch, round count, validation result, push status)
  - follow with a compact findings ledger table covering accepted/fixed, rejected, and deferred items. Columns: `id`, `status`, `severity`, `rule-applied`, `note`. Rule-applied is only meaningful on accepted rows — leave empty on rejected/deferred.
  - use bullets only for ancillary information such as validation commands run, generated-artifact notes, or scope-expansion items deferred to follow-up PRs

Suggested live status template:

```text
round 2/5 | reviewers 4/4 | fixers 1/2 | validation running
accepted 3 | deferred 1 | rejected 4
```

Suggested final ledger table:

```md
| id     | status   | severity | rule-applied           | note                              |
| ------ | -------- | -------- | ---------------------- | --------------------------------- |
| R1-001 | fixed    | medium   | two-reviewer-agreement | analytics regression              |
| R1-002 | deferred | low      |                        | needs live-store validation       |
| R3-004 | deferred | medium   |                        | scope-expansion → follow-up PR    |
| R4-002 | rejected | low      |                        | speculative, no concrete evidence |
```

## Generated Artifacts

- If the diff touches generated clients, typed RPC surfaces, schemas, codegen outputs, or framework-generated files, discover and run the repo's canonical generation step before final validation.
- If generated files changed, verify they match the source edits and include them in the final review surface.

## Validation

After integrating the fix batch:

Run validation in this order so the test/typecheck pass runs against the final, formatted code. This avoids the "autofix touched files, rerun tests" problem.

1. Apply autofix first. If the repo exposes a formatter or lint autofix command (for example `lint:fix`, `prettier --write`, `biome check --write`, `ruff format`, `gofmt`), run it once before any strict validation. Fix workers should ideally do this themselves before reporting done, but the main agent should still run it as a belt-and-braces step in case a worker forgot or a cross-file formatter rule needs a repo-wide pass. Stage or commit the resulting changes with the fix batch, not as a separate "lint fix" commit.
2. Run the narrowest relevant checks first (targeted tests for the files touched, fastest typecheck path).
3. Finish with the repo's canonical strict lint and test commands. These must now pass without modifying files — if the canonical lint still reports issues after the autofix pass, they are real findings, not cosmetics.
4. Run typecheck or build if the repo treats them as required PR gates.
5. If validation fails, open another fix batch for the failing area and rerun validation.
6. If validation is green, run one fresh review round on the final diff before declaring success.
7. Keep the final review narrow:
   - use `1-2` reviewers, not the full first-round fanout
   - review the current final diff only
   - do not reopen already-rejected speculative findings unless the new diff changes the evidence

Do not declare success while lint or tests still fail. If the repo has no lint or no tests, say that explicitly in the final summary.
Treat stderr noise carefully: distinguish real validation failures from known or pre-existing noisy warnings in green test runs, and report the noise without misclassifying the validation result.

## Git And PR Updates

When validation is clean:

1. Before pushing, review the PR body against the final diff. If the fix batch added behavior, analytics, UX changes, new tests, or new doc guidance beyond what the PR body already describes, update the PR description with a short "Additional fixes from review" section, grouped by category (correctness, analytics, UX, tests, docs). Keep commit message, PR title, and PR body aligned with the final diff.
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
