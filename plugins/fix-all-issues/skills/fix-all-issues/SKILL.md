---
name: fix-all-issues
version: 0.5.0
description: Coordinate a multi-round PR review and remediation workflow using parallel background agents. Quality-first by default — adds red-team and coverage lenses, per-finding verification, an independent second triager, mutation-style fix evidence, a dedicated cleanup round, live-feature validation, and a residual-risk inventory. Use when asked to review a pull request or current branch, find bugs, regressions, and nits, fix the accepted findings with delegated workers, rerun lint and tests, update the PR branch, and repeat until no actionable findings remain. Triggers include `$fix-all-issues`, requests to "review this PR and fix everything", or requests for a parallel review/fix loop on a GitHub PR.
---

Review and fix a PR in rounds. Stay in orchestration mode: delegate review, verification, code, and cleanup; keep local work to integration, branch management, and final synthesis. Default mode is **quality-first** — optimize for catching every real issue and shipping a clean diff, not for elapsed time.

## Inputs

- `pr`: PR URL or number. If omitted, review the current branch against `main`.
- `num_agents`: Ceiling on parallel background agents. Default `8` in exhaustive mode, `5` in quick mode.
- `max_rounds`: Maximum review/fix rounds before stopping. Default `8` in exhaustive mode, `5` in quick mode.
- `review_mode`: `exhaustive` (default) or `quick`. Treat legacy `normal` as `quick`.
  - `exhaustive`: full quality pipeline. Adds red-team / coverage / conformance reviewer lenses, per-finding verification gate, independent second triager, mutation-style fix evidence, dedicated cleanup round, live-feature validation, "would I block?" cold reviewer, residual-risk inventory.
  - `quick`: leaner pipeline. 4 lens reviewers, no second triager, no red-team or coverage agent, no separate cleanup round, lint/test/typecheck only for validation. Use when elapsed time matters more than residual-issue rate.

## Mode Comparison

| Stage                  | quick                             | exhaustive (default)                                             |
| ---------------------- | --------------------------------- | ---------------------------------------------------------------- |
| Pre-review conformance | ad-hoc hints in prompts           | extracted from CLAUDE.md/AGENTS.md, injected as a hard checklist |
| Reviewer fanout        | up to 4 lenses                    | up to 8 (lenses + red-team + coverage + conformance)             |
| Verification           | main-agent skim during triage     | per-finding verification subagent before triage                  |
| Triage                 | main agent only                   | main agent + independent second triager on disagreements         |
| Fix evidence           | "smallest validation"             | failing-test-first then green for any bug fix                    |
| Validation             | autofix + lint + test + typecheck | + live feature exercise / API hit when applicable                |
| Cleanup                | folded into maintainability lens  | separate round after bug fixes are green                         |
| Final review           | 1–2 reviewers on final diff       | + "would I block this PR?" cold reviewer                         |
| Output                 | findings ledger                   | + residual-risk inventory of what was NOT checked                |

The rest of this document describes the **exhaustive** pipeline. Drop the marked steps when running `quick`.

## Capacity Planning

- `num_agents` is a ceiling, not a quota.
- Reserve at least 3 background slots beyond the initial review batch:
  - 1 for the verification pass
  - 1 for fix workers
  - 1 for the final cold reviewer
- Close completed review agents before spawning fixers if capacity is tight.
- Scale reviewer fanout to PR size:
  - `< 200` lines: 4 reviewers (correctness+tests merged + red-team + coverage + conformance)
  - `200 – 1000` lines: 6 reviewers (4 lenses + red-team + coverage)
  - `> 1000` lines or multi-subsystem: up to 8 reviewers (5 lenses + red-team + coverage + conformance)
- Quick mode caps at 4 reviewers regardless of size.
- Prefer one fewer reviewer over starving fixer or verifier slots.

## Precedence

- Repository instructions override this skill. If `AGENTS.md`, `CLAUDE.md`, local docs, CI config, or the user request conflict with this skill, follow the repo and user instructions.

## Guardrails

- Treat invocation as explicit approval to spawn subagents and parallel worker batches.
- Preserve behavior. Fix bugs in a backwards-compatible way unless the finding itself proves current behavior is broken.
- Do not fabricate validation commands. Discover them from `package.json`, `Makefile`, `justfile`, CI config, repo docs, or `AGENTS.md`.
- Do not loop forever. Stop after a clean round (re-review zero AND cleanup zero AND cold reviewer green) and clean validation, or after `max_rounds`. Report residuals if the cap is hit.
- Rewrite history only when safe and only when the user asked. Use `git push --force-with-lease`, never plain `--force`. After any rewrite, rerun the full validation suite against the new tip.
- Prefer the repo's documented GitHub workflow. If unspecified, prefer GitHub app tools, fall back to `gh`.

## Resolve Target

1. Determine the review target.
   - If `pr` is a URL or number, inspect the PR and check out the local branch.
   - If `pr` is omitted, diff the current branch against `main`.
   - If on `main` with no `pr`, stop and ask.
2. Discover repo-specific commands: lint, lint:fix, test, typecheck, build, codegen, dev-server boot, preview deploy.
3. Note explicit compatibility constraints, generated code flows, and protected files.
4. **Base-branch drift audit (exhaustive only).** If the PR targets a non-default base (e.g. `dev`, a release branch, a long-lived integration branch), spawn an agent to enumerate `main..<base>` and flag anything load-bearing — schema changes, feature flags, behavior shifts, dropped exports. Reviewers must read against the actual base, not `main`. If the PR diff is much larger than the commits on the PR branch, the base is stale or the PR needs a rebase before review is useful.

## Conformance Checklist (exhaustive only)

Before spawning reviewers, build a per-repo rule list and inject it into every reviewer prompt as a hard checklist. Sources to scan:

- `CLAUDE.md`, `AGENTS.md` at every level (root, workspace, package).
- `.editorconfig`, formatter config (`biome.json`, `.prettierrc`, `ruff.toml`, `gofmt`).
- `package.json` engines/scripts, `tsconfig.json` strictness flags, `eslint`/`biome` rules.
- Any project conventions docs (`docs/STYLE_GUIDE.md`, `CONTRIBUTING.md`).

Extract concrete, mechanically-checkable rules. Examples seen in the wild: `??` not `||` for default values; use a Result type instead of raw try/catch; do not import `Text` from `react-native`; no Co-Authored-By in commits; ASCII-only files; `bun` not `npm`; never edit `components/ui/**` directly.

Pass the extracted checklist to every reviewer (the conformance lens uses it as its primary checklist; other lenses use it as a sanity backstop) and to the cleanup round.

## Review Round

Spawn the budgeted reviewers in parallel. Lenses for exhaustive mode:

- **correctness** — regressions, off-by-one, control flow, error paths
- **compatibility** — API changes, schema drift, public-surface breaks
- **tests** — missing branches, weak assertions, mock/prod drift
- **security** — auth, input validation, PII, data integrity, secret handling
- **maintainability** — naming, dead code, complexity, performance hotspots
- **red-team** — assume the PR is broken; construct adversarial inputs, race conditions, error-path interleavings, malformed clients, hostile state transitions
- **coverage** — for every new exported function/route/event, list input classes that SHOULD be tested but aren't (independent of existing test code — do not just review what's there)
- **conformance** — mechanical pass over the extracted checklist; report every violation with file:line

Quick mode runs only the first four lenses, with conformance hints folded into the maintainability prompt.

Reviewer prompt template (canonical — do not drop fields, may append lens-specific hints):

```text
Review only the current PR or branch diff against the base branch.
Lens: <assigned lens>.
Conformance rules to enforce: <checklist injected here>.
Do not edit files.
Open the cited file at the cited line and confirm the claim before reporting.

For each finding include:
- stable id
- severity (high/medium/low)
- confidence (high/medium/low)
- category
- file:line
- why it is wrong or risky
- concrete proof or failure mode (state what you observed, not what you suspect)
- smallest safe fix
- breaking-risk (yes/no)
- validation to run
- verification: ✓ if you opened the file and confirmed; ⚠ if speculative

At the end, list the categories of issues you considered and ruled out.
This surfaces blind spots — if no reviewer mentions race conditions, that is itself a gap.

If no actionable findings, say that explicitly.
```

## Verification Pass (exhaustive only)

Before triage, every speculative (`⚠`) finding goes to a verification subagent. Verified (`✓`) findings skip this step.

```text
Open <file> at <line>. Confirm or refute this claim:
"<finding text>"

Report one of:
- confirmed — cite the lines that prove the claim
- refuted — cite the lines that disprove the claim
- needs-runtime-check — explain what runtime evidence would settle it
```

- confirmed → upgrade to `verified ✓`, proceed to triage
- refuted → drop, log as rejected with reason `verification-failed`
- needs-runtime-check → keep as `⚠`, enter triage with status `defer-or-investigate`

## Triage Findings

1. Merge finding lists. Deduplicate by root cause, not wording. If three reviewers describe the same bug, keep one ledger item with merged evidence.
2. Apply the rubric:
   - **Accept** when the finding is `verified ✓` AND names a concrete failure mode. A single verified finding is enough; two unverified findings are not. Verified evidence beats reviewer agreement.
   - **Reject** when refuted by verification, speculative with no concrete failure mode, duplicate of an accepted root cause, or dependent on an unstated product decision.
   - **Defer** when concrete but needs live-system access, broader refactor, cross-team coordination, or explicit user approval. Tag with reason: `scope-expansion`, `needs-runtime-check`, `cross-team`, `larger-refactor`.
3. **Scope-expansion rule.** If a fix would add behavior, analytics, UX, or surface area beyond what the PR description promises — even backwards-compatibly — surface to the user OR defer with reason `scope-expansion` and call it out as a follow-up PR. Quality mode is not licence to silently grow the PR.
4. **Independent second triager (exhaustive only).** After the main agent produces a draft ledger, spawn a second triage agent with ONLY the merged finding list and the base diff (no reviewer rationales, no prior triage). Ask for accept/reject/defer per finding. Investigate every disagreement — usually the second triager catches a finding the main agent rubber-stamped, or pushes back on a wrongful rejection.
5. Group accepted findings into disjoint file batches for fix workers. Note the verification status of each.

## Fix Round

Spawn fix workers per disjoint file batch. Worker prompt template:

```text
Implement only the accepted findings assigned to your owned files.
You are not alone in the codebase. Do not revert unrelated edits.
Preserve backwards compatibility unless the finding proves current behavior is broken.

For any bug fix (not pure refactor or doc/test addition):
1. Write a failing test that demonstrates the bug. Confirm it is red.
2. Implement the smallest fix. Confirm the test goes green.
3. Include the red→green evidence in your report.

Run the repo's autofix command (lint:fix / prettier --write / biome check --write / ruff format) on owned files before reporting done.

Report:
- files changed
- findings resolved (with red→green test evidence per bug fix)
- validation run
- considered-but-not-changed: list anything you noticed in the touched files but deliberately left alone, with a one-line reason
- remaining uncertainty
```

The `considered-but-not-changed` log feeds the cleanup round and the residual-risk report.

For trivial fixes (≤5 single-line edits across ≤3 files), main-agent direct edits beat the worker-spawn overhead. Spawn workers only when the work is partitionable across files or large enough to amortize the spawn cost.

## Progress Reporting

- Background agents should send brief progress updates frequently. Prefer an update every 30–60 seconds during longer tasks, or immediately after a meaningful milestone (review complete, edit batch done, blocker hit).
- Each progress update should be short and structured for easy aggregation:
  - current phase
  - owned files or scope
  - completed work
  - next step
  - blocker, if any
- The main agent maintains and surfaces an overall progress summary while the workflow runs:
  - reviewers complete: `4/6`
  - verification: `2/3`
  - fix batches complete: `1/2`
  - cleanup batches: `0/1`
  - validation: `pending`, `running`, or `green`
  - current round: `2/8`
- Timeout budgets:
  - review batch: `10–15 minutes`
  - verification pass: `5–10 minutes`
  - fix batch: `10 minutes`
  - cleanup batch: `5–10 minutes`
  - re-review (incl. cold reviewer): `5 minutes`
- If an agent stays silent past its timeout, stop blocking. Continue with completed results, or respawn exactly once if the missing output is on the critical path.
- Do not busy-poll with repeated short waits. Prefer longer waits while doing useful local work — pre-draft fix-batch partitions, grep for callers of symbols the fix will likely touch, scaffold the final commit message and PR-description update. Avoid pre-reading file contents an active agent is analyzing.

## Display Conventions

Prefer the richest structured display the client supports, but always keep a plain-text fallback.

- If a structured plan or task-progress API is available, use it for top-level phase tracking:
  - target resolution
  - conformance checklist build
  - review round
  - verification pass
  - triage (with second triager)
  - fix round
  - validation (incl. live exercise)
  - cleanup round
  - re-review (incl. cold reviewer)
  - residual-risk synthesis
- One-line counter summaries for live status:
  - `round 2/8 | reviewers 6/6 | verify 3/3 | fixers 1/2 | validation running`
  - `accepted 5 | deferred 2 | rejected 7`
- Markdown tables only for stable finalish metadata where rows share fields (findings ledger, validation summary).
- Bullets, not tables, when data is sparse, hierarchical, or still changing.
- Do not dump raw agent transcripts into the main view. Aggregate into stable counters and ledger entries.

## Generated Artifacts

If the diff touches generated clients, schemas, codegen outputs, or framework-generated files, run the canonical generation step before final validation. Verify generated files match source edits and include them in the final review surface.

## Validation

After integrating each fix batch, in order:

1. **Autofix.** Run `lint:fix` / `prettier --write` / equivalent. Stage with the fix batch, not as a separate "lint fix" commit.
2. **Targeted checks.** Run the narrowest test/typecheck path for the touched files first.
3. **Strict lint + canonical test suite.** Must pass without modifying files. If the strict lint still reports issues after autofix, they are real findings, not cosmetics.
4. **Typecheck and build** if the repo treats them as required PR gates.
5. **Live feature exercise (exhaustive only).** For UI / payment / auth / API / data-flow changes, actually exercise the path:
   - Frontend: boot the dev server, navigate to the affected screen, trigger the changed flow, confirm the expected state.
   - Backend: hit the affected endpoint with `curl` or against the project's preview environment.
   - CLI / script: run the command end-to-end with a representative input.
   - Mobile native: at minimum boot the simulator and reach the screen. If the path requires sandbox credentials or a native rebuild that is out of scope, say so explicitly in the residual-risk report — do NOT silently skip and treat green tests as proof.
6. If validation fails, open another fix batch for the failing area and rerun.

Distinguish real validation failures from pre-existing noisy stderr warnings; report noise without misclassifying validation. Do not declare success while lint or tests fail. If the repo has no lint or no tests, say so explicitly in the final summary.

## Cleanup Round (exhaustive only)

After bug-fix validation is green, run a dedicated cleanup round. Constraint: pure quality with **no behavior changes**. Anything that needs a behavior change goes back to bug-fix triage as a new finding.

Targets:

- dead code, unused imports, redundant null checks
- naming/casing drift from project convention
- conformance checklist violations the bug-fix round did not cover
- comment rot (stale references, outdated examples, references to renamed symbols)
- doc drift (README/AGENTS.md still describing prior behavior)
- missing tests adjacent to touched code (where adding the test does not change behavior)
- TODO/FIXME left without ownership in touched files
- `considered-but-not-changed` items from fix workers that turn out to be safe to address now

Spawn 1–2 cleanup workers per file batch with the standard fixer prompt plus the no-behavior-change constraint. Re-validate after cleanup. The cleanup round is done when one pass yields zero edits.

## Re-Review

When bug-fix and cleanup rounds are both green:

1. **Narrow re-review.** 1–2 reviewers on the current final diff only. Do not reopen rejected speculative findings unless the new diff changes the evidence.
2. **"Would I block this PR?" cold reviewer (exhaustive only).** Fresh agent, no context except the final diff and the PR description.

   ```text
   You are reviewing this PR cold. You have not seen prior review activity.
   Final diff: <attached>.
   PR description: <attached>.
   Would you approve, request changes, or block?
   List any blockers as concrete findings with file:line and why.
   If you would approve, say so explicitly.
   ```

   Any blocker re-enters bug-fix triage. Loop until the cold reviewer has no blockers.

## Git And PR Updates

When validation, cleanup, and re-review are all clean:

1. **Update the PR description to match the final diff.** If review fixes added behavior, analytics, UX, tests, or doc guidance beyond the original body, **fold them into the existing sections** — do not append a separate "Additional fixes from review" section that becomes misleading the moment the branch is squashed. Ensure title, commit messages, and body align.
2. When editing the PR body via `gh pr edit`, **fetch the existing body first** (`gh pr view <n> --json body --jq .body`) and edit it. Do not clobber with a fresh string.
3. Default to a normal commit and regular push.
4. Amend or squash and force-push-with-lease only if the user explicitly asked OR the repo workflow requires it AND the branch is rewrite-safe.
5. **After any history rewrite, rerun the full validation suite (lint + typecheck + tests, plus live exercise if it ran originally) against the new tip.** Squashes and amends can drop hunks; `--force-with-lease` catches lost commits but not lost lines within commits.

Treat a branch as rewrite-safe only when ALL hold:

- branch is not protected
- branch is not shared in a way that would surprise collaborators
- new changes belong in the existing tip commit (or the squash represents the same final tree)
- `git push --force-with-lease` is available

## Loop

Repeat:

1. review round
2. verification pass (exhaustive)
3. triage (with second triager in exhaustive)
4. fix round
5. validation
6. cleanup round (exhaustive)
7. re-review (with cold reviewer in exhaustive)

Stop when ALL of:

- bug-fix re-review finds zero actionable findings
- cleanup round yields zero edits
- cold reviewer (exhaustive) has no blockers
- validation is clean against the final tip (including post-rewrite if applicable)

Or when `max_rounds` is reached. If capped, summarize residuals instead of looping.

## Final Output

One-paragraph summary: target PR/branch, mode, round count, validation result, push status, base branch if non-default.

Findings ledger:

```md
| id     | status   | severity | verified | note                           |
| ------ | -------- | -------- | -------- | ------------------------------ |
| R1-001 | fixed    | medium   | ✓        | analytics regression           |
| R1-002 | deferred | low      |          | needs-runtime-check            |
| R3-004 | deferred | medium   |          | scope-expansion → follow-up PR |
| R4-002 | rejected | low      |          | refuted on verification        |
```

Validation block: lint, typecheck, test, and live-exercise outcomes, with explicit notes for anything skipped and why.

**Residual-risk inventory (exhaustive only).** Mandatory section listing what was NOT checked. Examples:

- iOS sandbox PAYMENT_PENDING flow not exercised live (requires a real sandbox account)
- Firebase event arrival in GA4 not verified (no test environment)
- Android pending path not exercised (no Android device/emulator in this session)
- considered-but-not-changed items from fix workers (one line per item)

This forces honesty about coverage and gives the human reviewer a known-unknowns list.

Cleanup-round summary: items removed, conformance violations resolved, doc drift fixed.

Follow-up PR list: items deferred with reason `scope-expansion`.

Whether generated artifacts were refreshed. Whether history was rewritten and post-rewrite validation outcome.
