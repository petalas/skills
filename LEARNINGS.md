# Learnings

Notes from building and running skills in this repo, especially `fix-all-issues`.

## Core Lesson

Parallel review skills usually fail operationally before they fail intellectually.

The common failure mode is not bad code review. It is poor orchestration:

- too many reviewers started at once
- no free slots left for fixers
- agents that never reply still block the run
- findings arrive in inconsistent formats and are hard to merge
- the final review reopens the whole PR instead of checking the final diff
- git cleanup turns into history-rewrite drama

The fixes below make the workflow more boring, which is the goal.

## Operator Mindset

Run this skill like an incident commander, not like a solo reviewer with extra tabs.

That means:

- keep the system moving
- avoid creating deadlocks
- prefer partial but trustworthy results over complete but stale results
- keep reviewer noise away from fixer execution
- make every stage produce artifacts the next stage can consume cleanly

Bad operator instinct:

- "I asked for 5 reviewers so I should wait for all 5 forever"

Better operator instinct:

- "I have 3 solid reviewer outputs, 2 duplicates, and a free worker slot; move to triage now"

The job is not to maximize parallelism.
The job is to maximize useful throughput.

## Agent Budgets

Treat `num_agents` as a ceiling, not a target.

Why:

- reviewer fanout has diminishing returns
- each extra reviewer consumes thread budget
- if all slots are used on reviewers, the run stalls when it is time to fix things

Practical rule:

1. reserve 1 slot for a fixer or fallback investigator
2. reserve 1 slot for the final fresh review
3. use the remaining slots for the first reviewer batch

If you do not know the platform's thread cap, start conservatively.

Good default:

- first review batch: at most 4 reviewers
- final review batch: 1-2 reviewers

Close completed agents before spawning the next batch.

### Good Budget Example

If the platform can support 6 total background agents:

1. keep 2 slots in reserve
2. start 4 reviewers
3. close completed reviewers
4. spawn 1-2 fixers
5. reserve the final slot for a narrow fresh review

### Bad Budget Example

1. spawn 6 reviewers
2. get 4 useful results
3. have no room for fixers
4. wait around or manually close agents under pressure

That is avoidable. Budget first.

## Timeouts And Silence

Parallel orchestration needs timeout budgets, not vibes.

Why:

- some agents never respond
- some agents keep running but stop being useful
- waiting forever on one slow reviewer is worse than proceeding with partial results

Suggested budgets:

- review batch: 10-15 minutes
- small fix batch: 10 minutes
- final re-review: 5 minutes

Silence policy:

- if an agent misses the timeout, stop blocking on it
- continue with completed results
- respawn once only if the missing result is truly on the critical path

Do not busy-poll every few seconds. That creates noise and burns attention.

### Good Timeout Behavior

- reviewer A finished
- reviewer B finished
- reviewer C returned duplicates
- reviewer D silent at timeout

Move to triage with A, B, C.
Only respawn D if a lens is now completely uncovered and that gap matters.

### Bad Timeout Behavior

- 3 good outputs already in hand
- 1 agent is silent
- main agent keeps calling wait in a loop for 10 more minutes

That is how momentum dies.

## Triage Rubric

The main agent needs an explicit accept/reject/defer rubric.

### Accept

Accept a finding when it names a concrete failure mode and at least one of these is true:

- confidence is high
- two reviewers independently describe the same root cause
- the main agent verified it locally

### Reject

Reject a finding when it is:

- speculative
- duplicative at the same root cause
- missing a real failure mode
- dependent on an unstated product decision

### Defer

Defer a finding when it is concrete but needs:

- live-environment testing
- a broader refactor
- user or product approval
- coordination outside the current PR

Deduplicate by root cause, not wording.

If three reviewers say the same thing three ways, keep one ledger item and merge the evidence.

### Record Which Acceptance Rule Passed

For every accepted finding, pin which of the three rules got it across the line:

- `high-confidence`
- `two-reviewer-agreement`
- `main-agent-verified`

Why:

- exposes the reasoning in the final output
- makes borderline acceptances visible
- gives the user a clear audit trail when they skim the ledger
- makes it obvious when a finding slipped in on weaker evidence than the rubric requires

### Triage Ledger Example

Good ledger shape:

```text
R1-001 | accepted | medium | two-reviewer-agreement | analytics regression | assigned to fixer-1
R1-002 | rejected | low     |                         | speculative UX concern, no concrete failure mode
R1-003 | deferred | low     |                         | live-store validation needed; note in final summary
R1-004 | accepted | high   | main-agent-verified     | missing null guard
R1-005 | deferred | medium |                         | scope-expansion → follow-up PR
```

Bad ledger shape:

```text
maybe 1
probably duplicate?
fix this later
```

If the ledger is sloppy, the fix round will also be sloppy.

## Scope Guardrails

A parallel-review skill is dangerous precisely because it is good at finding things.

The failure mode is not "the reviewers miss bugs." It is "the reviewers find extra bugs, the orchestrator accepts the fix because it is backwards-compatible, and the PR quietly grows behavior the author never signed up for."

### The Scope-Expansion Rule

If an accepted finding would land behavior, analytics, UX, surface area, or side effects that the PR body / description / commit messages do not already promise, do one of:

- surface the scope expansion to the user and get explicit confirmation before adding it to the fix batch
- defer the finding with reason `scope-expansion` and call it out as a follow-up PR in the final summary

"Backwards-compatible" is not a license to expand scope. A backwards-compatible behavior change is still a behavior change, and reviewers on the other side of the PR are not expecting it.

### Good Scope Behavior

- reviewer flags "pending purchase alert has no recovery action"
- proposed fix adds `refreshCustomerInfo` and `handleDismiss` on alert OK
- orchestrator notices this adds new UX behavior not in the PR body
- orchestrator asks the user: "accept this scope expansion or defer as follow-up?"
- user decides explicitly

### Bad Scope Behavior

- same finding
- orchestrator silently adds the new UX behavior because it is "helpful" and "backwards-compatible"
- PR ships with a medium-severity UX change reviewers did not evaluate on the other side

A skill that silently grows PRs is worse than a skill that misses nits.

## Choosing Review Modes

`fix-all-issues` now defaults to `review_mode=exhaustive`.

Use `exhaustive` when:

- the branch is small or medium and you want the full pass
- the user asked for everything, nits included
- you are near merge and want low-severity cleanup too

Use `quick` when:

- the branch is large and you want higher-signal issues first
- you are doing an early pass before a broader cleanup
- time or thread budget is tight

Rule of thumb:

- omit `review_mode` unless you have a reason not to
- reach for `quick` deliberately, not reflexively

## Prompt Templates

Prompt templates matter because they reduce entropy.

Without templates:

- reviewers return different schemas
- some include fixes, some include essays, some include guesses
- fixers report different validation formats
- triage becomes manual cleanup

Reviewer prompts should always pin:

- exact scope
- exact review lens
- no-edit rule
- required output fields
- explicit instruction to say "no actionable findings" when appropriate

Fixer prompts should always pin:

- owned files
- assigned finding ids
- non-revert rule
- backwards-compatibility requirement
- minimum validation to run
- exact final report fields

Templates turn orchestration from improvisation into a repeatable protocol.

### Reviewer Prompt: Bad

```text
Review this PR and tell me what you think.
```

Why bad:

- no scope pin
- no lens
- no schema
- invites essays and vibes

### Reviewer Prompt: Better

```text
Review only the current diff against origin/main.
Lens: correctness and regressions.
Do not edit files.
Return only actionable findings.
For each finding include:
- stable id
- severity
- confidence
- category
- file:line
- why it is risky
- concrete proof or failure mode
- smallest safe fix
- breaking-risk
- validation to run
If no actionable findings, say that explicitly.
```

### Fixer Prompt: Bad

```text
Fix the issues in this PR.
```

Why bad:

- no ownership
- no boundaries
- no compatibility constraint
- no reporting format

### Fixer Prompt: Better

```text
Implement only findings R1-001 and R1-004.
Owned files:
- src/paywall.ts
- src/analytics.ts
Other workers are active. Do not revert unrelated edits.
Preserve backwards compatibility unless the finding proves current behavior is broken.
Run the smallest relevant validation after the edit.
Report:
- files changed
- findings resolved
- validation run
- remaining uncertainty
```

### Prompt Design Rule

The prompt should answer four questions before the agent starts:

1. what exact slice do I own
2. what exact shape should I return
3. what am I forbidden from doing
4. what proof threshold counts as success

If any of those is missing, expect drift.

## Validation Order

Run the repo's autofix/formatter command before strict validation, not after.

Why:

- strict lint will flag formatting issues that the formatter was about to fix anyway
- if you run tests before the formatter, a later autofix pass can modify files and force you to re-run tests to be safe
- running the formatter first means tests and typecheck execute against the final, formatted code — exactly the shape that will be committed

Good order:

1. autofix / formatter (`lint:fix`, `prettier --write`, `biome check --write`, `ruff format`, `gofmt`)
2. narrow targeted checks (tests for touched files only)
3. canonical strict lint + full test run
4. typecheck / build

Fixer workers should ideally run the autofix on their owned files before reporting done, so the main agent's canonical lint pass is green by construction. The main agent still runs a repo-wide autofix as a belt-and-braces step in case a worker forgot or a cross-file formatter rule needs a repo-wide pass.

Commit the formatter output as part of the fix batch. Do not split off a separate "lint fix" commit — that fragments the audit trail.

### Bad Validation Order

- run tests first
- run lint after tests
- lint autofix touches five files
- now you have no proof the tests still pass against the reformatted code
- either re-run tests (wasted minutes) or push a silent risk

Autofix first makes that whole problem disappear.

## Final Review Should Be Narrow

A fresh final review is good.

A fresh final review over the entire PR from scratch is wasteful.

Why narrow the final review to the current diff:

- it checks what actually changed in the fix round
- it avoids reopening already-rejected speculative findings
- it is faster and easier to reason about
- it lowers reviewer noise near the end of the run

Good final-review pattern:

- 1-2 reviewers only
- current final diff only
- focus on regressions introduced by the fixes

### Bad Final Review Pattern

- reopen the entire PR
- ask for every nit again
- rediscover already-rejected findings
- burn another full batch of reviewer slots

The endgame should compress, not expand.

## Git Defaults

Default to a normal commit and regular push.

Why:

- it is safer in shared branches
- it preserves auditability during multi-round automation
- it avoids surprising collaborators

Only amend and force-push when all of these are true:

- the user explicitly asked for history cleanup, or the repo workflow clearly expects it
- the branch is not protected
- the branch is effectively solo-owned
- `git push --force-with-lease` is available

The burden of proof should be on rewriting history, not on avoiding it.

### Good Git Outcome

- commit fix batch clearly
- push normally
- update PR body if behavior changed

### Bad Git Outcome

- amend three times mid-run
- force-push while reviewers are still reasoning over old SHAs
- make the branch history harder to audit

Clean history is nice.
Predictable collaboration is nicer.

## Operating Checklist

Use this mental checklist when running `fix-all-issues`:

1. Resolve target PR or branch. Flag unusual base branches (`dev`, release branches, long-lived integration branches).
2. Read repo instructions and validation commands.
3. Budget thread capacity before spawning reviewers. Scale reviewer count to PR size (3 for small, 4 for medium, 5 only for large / multi-subsystem diffs).
4. Run reviewer batch with fixed lenses and structured prompts.
5. Triage with accept/reject/defer rubric. Record which acceptance rule passed per finding. Apply the scope-expansion rule — never silently grow the PR.
6. Close old reviewers if capacity is tight.
7. Spawn fixers with disjoint ownership. Fixers apply the repo's autofix/formatter on owned files before reporting done.
8. Run validation in order: autofix first (belt-and-braces), then narrow checks, then canonical lint and tests, then typecheck.
9. Run narrow fresh final review on the current diff.
10. Update the PR description if the fix batch added behavior, analytics, UX, tests, or doc guidance beyond the original body.
11. Commit and push normally unless rewrite is explicitly justified.

## Smells

These are signs the run is getting unhealthy:

- reviewers keep returning the same finding because the prompt did not separate lenses
- fixers touch overlapping files because ownership was not explicit
- validation starts before worker results are fully integrated
- the main agent starts doing most of the coding despite free worker capacity
- final review raises broad architectural issues that should have been found in round 1
- the branch is force-pushed even though nobody asked for cleanup

When you see these smells, the answer is usually not "work harder."
The answer is "tighten the protocol."

## How To Read A Run

After a run, ask:

1. Did the bottleneck come from code reasoning or orchestration?
2. Which step waited too long on low-value work?
3. Which findings were noisy and why did they survive triage?
4. Did fix ownership stay disjoint?
5. Did validation happen at the right width and in the right order?
6. Did the final review actually check the final diff, or did it restart the whole process?

If you can answer those, you can improve the skill.

## Why This File Exists

`SKILL.md` should stay operational and concise.

This file is for the ideas behind the instructions:

- why the rules exist
- what failure modes they prevent
- what tradeoffs they encode

When the skill feels too terse, update this file.

## Quality-First Revision (v0.5.0)

The 0.4.x pipeline optimized for a lean review/fix loop on bug-finding. Real-world runs surfaced consistent gaps where the skill said "clean" but a careful human review would still block. The 0.5.0 revision reorients the default mode (`exhaustive`) toward maximum residual-issue coverage at the cost of elapsed time. The leaner prior pipeline is still available as `quick`.

### Failure Modes The Revision Targets

**Reviewer overconfidence.** Reviewers cite line numbers they did not read. Triage trusted them. With small PRs the main agent caught bad citations by re-reading; with large PRs that fallback would silently fail. Fix: every reviewer tags findings `verified ✓` (file opened, claim confirmed) or `speculative ⚠` (suspicion). A verification subagent runs on every `⚠` finding before triage and reports `confirmed` / `refuted` / `needs-runtime-check`. Refuted findings are dropped automatically; the main agent stops adjudicating reviewer speculation.

**Sympathetic review.** Lens reviewers read the PR for what it claims to do. They miss adversarial cases the author did not consider — race conditions, malformed clients, hostile state. Fix: a dedicated red-team reviewer whose only job is to find ways the PR is broken. Distinct from correctness, which still reads sympathetically for regressions.

**Coverage as a side effect.** The "tests" lens reviews the test code that exists. It does not enumerate the input classes that should have tests but don't. Fix: a coverage reviewer whose only job is to list missing test classes for every newly exported function/route/event, independent of the existing test code.

**Conformance buried in lens hints.** Codebases have mechanically-checkable rules (`??` not `||` for defaults, error-type conventions, no-import-from-X). The 0.4.x skill mentioned them as ad-hoc maintainability hints. Fix: extract the conformance checklist from `CLAUDE.md` / `AGENTS.md` / formatter config / style docs before reviewer fanout, inject it into every reviewer prompt as a hard checklist, and run a dedicated conformance reviewer.

**Triage rubber-stamping.** The main agent reads the reviewer rationales, then triages. By the time the rubric runs, the main agent is already biased by reviewer framing. Fix: an independent second triager gets ONLY the merged finding list and the base diff (no rationales) and produces an independent verdict. Disagreements get investigated.

**Acceptance via popularity.** "Two reviewers agree" was a primary acceptance rule. Two confidently-wrong reviewers can pass that bar. Fix: a single `verified ✓` finding is enough; two `⚠` findings are not. Verified evidence beats reviewer agreement.

**Cleanup competing with bug-finding.** Maintainability was one of N lenses competing for attention with correctness in a single round. Cleanup got partial coverage at best. Fix: a dedicated cleanup round runs after bug fixes are validated. Constraint: zero behavior changes. Targets dead code, conformance violations, comment/doc rot, adjacent missing tests. Loops until one pass yields zero edits.

**Tests passing as proof of feature working.** A green test suite tells you the unit tests pass, not that the feature actually works in the running app. For UI / payment / auth / API changes the gap matters. Fix: exhaustive validation requires a live feature exercise (boot dev server, hit endpoint, run CLI). If live exercise is impossible (sandbox required, secrets unavailable), it goes in the residual-risk report rather than being silently skipped.

**Mutation-blind fixes.** Workers were asked for "smallest validation" — which can be satisfied by tests that already pass. There is no evidence the fix actually fixes the reported bug. Fix: every bug-fix worker (not refactor or pure doc/test addition) must write a failing test first, then implement the fix, then show red→green. Skipping the failing-test-first step means the fix has no evidence of fixing.

**Final review reopens the whole PR.** A wide-fanout final review re-litigates rejected findings and burns budget on already-vetted code. Fix: keep the narrow re-review (1–2 reviewers on the final diff only). Add a separate "would I block this PR?" cold reviewer that sees only the final diff and PR description, with no prior context. Models the actual human reviewer who will see this PR cold.

**Silent coverage gaps.** The skill ended on a green checkmark without acknowledging what was not checked. Fix: a mandatory residual-risk inventory in exhaustive mode lists what was NOT exercised — sandbox flows, third-party arrival confirmation, paths requiring secrets — and folds in `considered-but-not-changed` items from fix workers. Forces honesty.

**Squash drops hunks.** A force-push-with-lease catches lost commits but not lost lines within commits. After any history rewrite, the prior pipeline trusted that the rewritten tip was still green. Fix: after any rewrite, rerun the full validation suite (lint + typecheck + tests, plus live exercise if it ran originally) against the new tip.

**PR-body drift.** Appending an "Additional fixes from review" section made sense before the user squashed. After squash, "additional" is a lie — the section is now just part of the diff. Fix: fold review fixes into existing PR-body sections from the start. Always fetch the existing body before editing via `gh pr edit` (do not clobber).

**Worker spawn overhead on trivial deltas.** Five tiny edits across three files were partitioned into a worker batch when a main-agent direct edit would have been faster. Fix: explicit threshold — for ≤5 single-line edits across ≤3 files, the main agent edits directly. Spawn workers only when the work is partitionable across files or large enough to amortize the spawn cost.

**Base-branch drift inherited silently.** When PRs target non-default bases (`dev`, release branches, integration branches), reviewers were reading against an implicit `main` mental model. Fix: a base-branch drift audit enumerates `main..<base>` and surfaces load-bearing differences (schema changes, feature flags, behavior shifts) before reviewers spawn.

### Tradeoffs

The revision is roughly 2–3x the elapsed time and token cost of the 0.4.x pipeline on a typical medium PR. The expected return is a substantially lower residual-issue rate at ship: speculative findings get refuted instead of accepted-then-rejected later; cleanup happens in the same PR instead of accumulating; live-exercise catches "tests green, feature broken" cases that previously slipped to production. Use `quick` when the elapsed-time bound matters more than residual coverage.
