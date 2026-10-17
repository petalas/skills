---
name: engineering-mode
version: 0.6.0
description: "Use when starting a software task that needs rigor: a bug, feature, refactor, investigation, performance issue, or any multi-step change to code that will be kept. Picks one playbook, routes to the matching principle skills and power-of-ten, and proves the result on the real artifact. Skip for casual questions, throwaway scripts, or when the user opts out."
---

# Engineering mode

Apply this skill to a new task when a playbook matches or the work needs rigor. Do not apply it to a casual turn, a one-line answer, a throwaway script, or when the user opts out. Match one focused playbook, keep the main agent accountable for the result, and prove work against the real artifact.

## Authority boundary

Local in-scope edits and read-only investigation are allowed. Create a branch or worktree only when the user or repository workflow calls for it. A commit requires explicit user or invoking-workflow authorization. Use `commit-guidelines` when installed. Otherwise inspect the exact diff, preserve unrelated work, run repository checks, and use the repository's documented message format without adding agent attribution.

Rebase, amend, squash, reset, force operations, pushes, remote review requests, merges, deploys, issue mutations, and review-thread mutations require separate explicit authorization. Human-directed messages, comments, replies, email, and chat posts are always forbidden. No authorization overrides that rule. Prepare a local draft and let the user communicate human to human.

Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. Subagents work only on scoped internal tasks. The parent reviews their artifacts and owns the final answer.

## Working rules

- Read repository instructions before editing.
- Name the behavior, data shape, or measurable predicate before implementation.
- Prefer the smallest change supported by evidence.
- Every claim carries its evidence or its label in the same sentence: measured, inferred, or guess. A prediction or an unseen cause is a guess. Run checks you can perform before handing them to the user.
- Remove dead code before adding a new abstraction.
- Parse and validate at system boundaries. Keep internal logic typed and direct.
- Give concurrent writers disjoint files, worktrees, or branches. Serialize shared writes.
- Verify on the real user surface when the task changes behavior.
- Use `unslop` for all prose, including your reply to the user, when installed. Otherwise remove filler, generic claims, decorative formatting, and host jargon. Write short concrete sentences.
- Use `show-me-your-work` for long, unattended, or multi-phase runs when installed. Otherwise keep a local append-only `decisions.tsv` with timestamp, phase, decision, reason, evidence, and result columns.
- Read `.agents/agent-models.md` when present. Treat its values as preferences, never as required fixed identifiers.
- Before you report or act on a number you measured, such as a speedup, regression, throughput, latency, or eval result, vet it. For a performance number, follow `benchmark-checklist` when installed. It is user-only, so read `../benchmark-checklist/SKILL.md` relative to this skill's directory, as with principle leaves. Otherwise name the limiter, count errors, confirm the work ran inside the timed region, run each side at least 5 times in alternating order and report the median and range, and give the result's share of the end-to-end path. For an eval result, check that every run did the task, that the gap holds across trials and models, and that the scenario matters.

## Principles

Leaf skills are installed beside this skill and are user-only; do not try to invoke them. Before applying one, read its full `SKILL.md` at `../<name>/SKILL.md` relative to this skill's directory. If the leaf is not installed, apply the one-line rule from the index and say so. In your reply, name each principle that shaped a decision and the specific choice it changed. Cite only principles whose leaf `SKILL.md` you read this session.

<!-- BEGIN GENERATED PRINCIPLE INDEX -->

**Core**

- **Laziness Protocol** (`principle-laziness-protocol`). Apply when refactoring, evaluating diff size, or tempted to add abstractions, layers, or signal threading. Bias toward deletion and the smallest change that solves the problem.
- **Foundational Thinking** (`principle-foundational-thinking`). Apply before writing logic: choosing core types and data structures, sequencing scaffold-vs-feature work, asking what concurrent actors share. Get the data structures right so downstream code becomes obvious.
- **Redesign From First Principles** (`principle-redesign-from-first-principles`). Apply when integrating a new requirement into an existing design. Redesign as if the requirement had been a foundational assumption from day one, instead of bolting it on.
- **Attack the Premise** (`principle-attack-the-premise`). Apply when two or more fixes that share one premise have failed the same gate. Write the premise down and test it directly before you write another fix that assumes it.
- **Subtract Before You Add** (`principle-subtract-before-you-add`). Apply when sequencing an addition, refactor, or rewrite. Remove dead code, redundant validators, and stub references first, then build on the simpler base.
- **Minimize Reader Load** (`principle-minimize-reader-load`). Apply when reviewing or shaping code that's hard to trace. Count layers between question and answer, and hidden state in the reader's head; collapse one-caller wrappers and shrink mutable scope.
- **Outcome-Oriented Execution** (`principle-outcome-oriented-execution`). Apply during planned rewrites and migrations with explicit phase boundaries. Converge on the target architecture; don't preserve smooth intermediate states with throwaway compatibility code.
- **Experience First** (`principle-experience-first`). Apply when product, UX, or feature-scope tradeoffs come up. Choose user delight over implementation convenience; ship fewer polished features over more rough ones.
- **Exhaust the Design Space** (`principle-exhaust-the-design-space`). Apply when facing a novel UI interaction or architectural decision with no precedent in the codebase. Build 2-3 competing prototypes and compare side by side before choosing.
- **Build the Lever** (`principle-build-the-lever`). Apply to any non-trivial work, not just bulk work: edits, migrations, analyses, checks. Build the tool that does it or proves it (codemod, script, generator, or a skill your subagents follow) instead of working by hand. The tool is the artifact a reviewer can rerun.

**Architecture**

- **Model Domain in Code** (`principle-model-domain-in-code`). Apply when writing stateful logic, or when code branches a lot or repeats a shape assumption across files. Encode the domain in a structure instead of scattered conditionals.
- **Boundary Discipline** (`principle-boundary-discipline`). Apply when wiring validation, error handling, or framework adapters. Concentrate guards at system boundaries (CLI, config, network, external APIs); trust internal types and keep business logic in pure functions.
- **Type System Discipline** (`principle-type-system-discipline`). Apply when designing types, reviewing a function signature, or writing code in any statically-typed language. Make illegal states unrepresentable, brand semantic primitives, parse external data at boundaries, exhaust variants, derive from authoritative schemas.
- **Make Operations Idempotent** (`principle-make-operations-idempotent`). Apply when designing commands, lifecycle steps, or processing loops that run amid crashes, restarts, and retries. Converge to the same end state regardless of partial prior runs.
- **Replace Internal APIs Atomically** (`principle-replace-internal-apis-atomically`). Apply when introducing a new internal API while old callers still exist. Migrate callers and delete the old API in the same wave instead of preserving compatibility layers.
- **Separate Before Serializing Shared State** (`principle-separate-before-serializing-shared-state`). Apply when concurrent actors might write to the same file, branch, key, or state object. Eliminate the sharing first; serialize structurally only when one shared writer is a real invariant.

**Verification**

- **Prove It Works** (`principle-prove-it-works`). Apply after completing a task, before declaring done. Verify against the real artifact (run the feature, read the actual value, inspect the diff), not a proxy, self-report, or 'it compiles.'
- **Fix Root Causes** (`principle-fix-root-causes`). Apply when debugging. Trace each symptom back to the first place the system went wrong and fix it there. A guard is a fix only when the state it handles is legitimate.
- **Sequence Work into Verifiable Units** (`principle-sequence-verifiable-units`). Apply to multi-step work such as sweeps, migrations, and runs of similar edits. Break work into small units that each end in a verifiable state, check each before the next, and order authorized delivery so the sequence proves itself.
- **Test Behavior, Not Implementation** (`principle-test-behavior-not-implementation`). Apply when you write, change, or keep a test. Assert what the code's users can observe, so that the test fails when that behavior breaks and keeps passing when only the internals change.
- **Explain the Number** (`principle-explain-the-number`). Apply before you trust, report, or act on a number you measured: a speedup, a regression, a throughput, a latency, or an eval result. Find what limits it, and rule out that it measured something other than the work you think.
- **Benchmark checklist** (`benchmark-checklist`). Vet a perf measurement (limiter, tuning, limits, errors, repeatability, relevance, and whether the work happened) before you report or act on it. Use when you run a benchmark or report a speedup or regression you measured.

**Delegation**

- **Guard the Context Window** (`principle-guard-the-context-window`). Apply when context is filling up: large outputs, long files, repeated reads, fan-out planning. Route bulk to subagents; keep summaries in the main thread, not raw payloads.
- **Local Autonomy** (`principle-local-autonomy`). Apply when reversible local work can proceed without a permission pause. Keep agents autonomous inside the workspace while reserving external communication and consequential actions for the user.

**Meta**

- **Encode Lessons in Structure** (`principle-encode-lessons-in-structure`). Apply when you catch yourself writing the same instruction a second time, or notice a recurring correction. Encode the rule as a lint, metadata flag, runtime check, or script instead of more text.

**Code**

- **Power of Ten** (`power-of-ten`). Apply when writing or changing code that will be committed, tested, or run more than once. Hold every touched path to the ten language-agnostic rules, fix encountered violations within scope, verify affected behavior, and document justified deviations. Skip throwaway scripts, one-off commands, prototypes, and pure config or documentation edits; honor narrower project scoping.

<!-- END GENERATED PRINCIPLE INDEX -->

## Decision gate

Before asking about an approach, check whether a local experiment can answer the question. Use the prototype playbook for observable behavior, timing, layout, or performance. Keep a read-only investigation focused on a cited answer.

Under an explicit full-autonomy grant, decide calls that the grant covers, act, and report the decision without asking for a reply. For a reversible preference that only the user can choose, apply a default within the grant, explain it fully, and say in plain words what the user could tell you to do instead. The user answers in their own words. Never give a shorthand token to type back. User-named gates, missing authority, safety decisions, and irreversible choices still require the user.

Without that grant, do not execute while a product, scope, safety, or one-way user decision remains unresolved. If `wayfinder` is installed and the destination is still foggy or too large for one session, invoke it to create or work through decision tickets. Otherwise write a short local decision brief with the question, known facts, options, consequences, and recommendation, then stop for the user to decide. Internal agent votes may compare evidence. They never settle a one-way user decision.

`auditable-run` starts only after these decisions are settled. When it is unavailable, use its local fallback: define a falsifiable predicate, split work into independently checked units, run one hypothesis at a time, and keep the local TSV trail described above.

## Review routes

Match review work by intent before choosing an implementation playbook.

- Use `code-review` for a read-only review against repository standards and the originating spec. If unavailable, inspect the exact diff from the named base, read repository instructions, check behavior and tests, and report only evidence-backed findings with file and line pointers.
- Use `adversarial-review` to pressure-test a design, diagnosis, or patch without changing it. If unavailable, run two or more read-only internal reviewers with different lenses, verify their claims against source, and synthesize agreements and disagreements.
- Use `fix-all-issues` when the user asks for a bounded repeated review-and-fix loop over all qualifying findings. If unavailable, define the responsibility boundary and stop conditions, alternate fresh local review with focused fixes, validate the exact tree after each round, and stop only on a clean, blocked, stabilized, or capped result.

Review routes do not grant remote mutation or human-communication authority.

## Pick one playbook

Read the matching file before planning. Copy its numbered steps into the active plan verbatim, before any task-specific items. A step you choose not to do stays in the plan with a one-line `skip: <reason>`.

- Investigation: `playbooks/investigation.md`
- Bug fix: `playbooks/bug-fix.md`
- Performance issue: `playbooks/perf-issue.md`
- Hillclimb: `playbooks/hillclimb.md`
- Runtime forensics: `playbooks/runtime-forensics.md`
- Trace forensics: `playbooks/trace-forensics.md`
- Feature: `playbooks/feature.md`
- Refactoring: `playbooks/refactoring.md`, which uses `safe-refactor` when installed and otherwise carries its local contract inline
- Prototype: `playbooks/prototype.md`, which uses `prototype` when installed and otherwise builds an isolated throwaway artifact
- Visual parity: `playbooks/visual-parity.md`
- Skill authoring: `playbooks/authoring-a-skill.md`
- Evaluation: `playbooks/eval.md`
- Autonomous local run: `playbooks/autonomous-run.md`
- Session pickup: `playbooks/session-pickup.md`
- Pause safely: `playbooks/pause-safely.md`
- Worktree cleanup: `playbooks/worktree-cleanup.md`, which uses `worktree-cleanup` when installed and otherwise performs the same read-only inventory and exact-path gate inline

Use `auditable-run` for a large execution task that needs a custom workflow after its decisions are settled. Use the inline fallback under Decision gate when the skill is absent. If no playbook fits and the task is still small, make a short task-specific plan instead of forcing a ceremony.

## Delegation

The agent that loaded this skill runs the playbook. Delegate steps, never the playbook itself.

Use available internal subagent capabilities, not host-specific task names or flags. Choose roles by need. Bulk reading, competing designs, implementation, and independent review are different jobs. Run independent work concurrently when capacity allows. Keep file pointers in prompts and avoid pasting large source blocks. When a child must apply a principle leaf or another user-only sibling skill, put the absolute path of that skill's `SKILL.md` in the child prompt. A child's skill catalog can hide user-only skills.

Give new work to a fresh subagent by default. This covers a fix round, a follow-up, a retry, and the next queue item. The fresh brief consolidates the original brief, every later directive, and the prior agent's report, branch, and worktree. Resume or message an existing agent only when the new work needs state that lives in that agent and is costly to move: its checkout, its uncommitted changes, or a process it still runs, such as a dev server or simulator. A stop or hold order to a running agent is not reuse. Chained resumes can drop directives, so review the artifact instead of trusting a resumed agent's "done" summary.

Read the repository's documented model preferences or `.agents/agent-models.md` when present. Map feature and refactoring delegates to `implementation`, bug fixes to `bug investigation`, performance work and hillclimbs to `performance investigation`, and prose or judgment to `judgment and prose`. Use the same role for that delegate's work throughout the playbook.

Use only host-confirmed model identifiers and the configured global `reasoning profile` when the host supports that model/profile pair. If the role is absent or its value is `auto` or `inherit-parent`, omit both overrides. For a missing, `auto`, or `inherit-parent` reasoning profile, omit only the reasoning override. If a configured pair is rejected, report the fallback and retry once without either override. If that also fails, perform the work locally or record the delegation gap. Do not construct model identifiers from profile names. A second opinion should differ by model family or reasoning profile when possible.

Match reasoning to the job. Start each subagent from its role's configured reasoning profile. When the host confirms an ordered set of reasoning profiles for that model, step up one for the hardest work, down one for judgment work, and down two or more for routine reading or mechanical edits. Use a faster speed option only when the user is blocked right now. Keep verification on its configured profile and model. Never change the model family. If the host rejects the adjusted choice, retry once with the configured pair and say so. When the role has no configured reasoning profile, keep the reasoning override omitted.

## Handoff

Lead with the user-visible outcome. Name changed files, evidence, verification limits, and unresolved choices. Do not append an invitation to perform remote or human communication.
