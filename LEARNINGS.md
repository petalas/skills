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

### Triage Ledger Example

Good ledger shape:

```text
R1-001 | accepted | medium | analytics regression | verified locally | assigned to fixer-1
R1-002 | rejected | low | speculative UX concern | no concrete failure mode
R1-003 | deferred | low | live-store validation needed | note in final summary
R1-004 | accepted | high | missing null guard | corroborated by 2 reviewers
```

Bad ledger shape:

```text
maybe 1
probably duplicate?
fix this later
```

If the ledger is sloppy, the fix round will also be sloppy.

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

1. Resolve target PR or branch.
2. Read repo instructions and validation commands.
3. Budget thread capacity before spawning reviewers.
4. Run reviewer batch with fixed lenses and structured prompts.
5. Triage with accept/reject/defer rubric.
6. Close old reviewers if capacity is tight.
7. Spawn fixers with disjoint ownership.
8. Run narrow validation, then canonical validation.
9. Run narrow fresh final review on the current diff.
10. Commit and push normally unless rewrite is explicitly justified.

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
