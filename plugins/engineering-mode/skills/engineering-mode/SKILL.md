---
name: engineering-mode
version: 0.3.0
disable-model-invocation: true
description: Route solo software work through focused, evidence-driven playbooks without assuming a specific agent host.
---

# Engineering mode

Use this optional router for deliberate solo development. Match one focused playbook, keep the main agent accountable for the result, and prove work against the real artifact.

## Authority boundary

Local in-scope edits and read-only investigation are allowed. Create a branch or worktree only when the user or repository workflow calls for it. A commit requires explicit user or invoking-workflow authorization. Use `commit-guidelines` when installed. Otherwise inspect the exact diff, preserve unrelated work, run repository checks, and use the repository's documented message format without adding agent attribution.

Rebase, amend, squash, reset, force operations, pushes, remote review requests, merges, deploys, issue mutations, and review-thread mutations require separate explicit authorization. Human-directed messages, comments, replies, email, and chat posts are always forbidden. No authorization overrides that rule. Prepare a local draft and let the user communicate human to human.

Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. Subagents work only on scoped internal tasks. The parent reviews their artifacts and owns the final answer.

## Working rules

- Read repository instructions before editing.
- Name the behavior, data shape, or measurable predicate before implementation.
- Prefer the smallest change supported by evidence.
- Remove dead code before adding a new abstraction.
- Parse and validate at system boundaries. Keep internal logic typed and direct.
- Give concurrent writers disjoint files, worktrees, or branches. Serialize shared writes.
- Verify on the real user surface when the task changes behavior.
- Use `unslop` for prose when installed. Otherwise remove filler, generic claims, decorative formatting, and host jargon; write short concrete sentences.
- Use `show-me-your-work` for long, unattended, or multi-phase runs when installed. Otherwise keep a local append-only `decisions.tsv` with timestamp, phase, decision, reason, evidence, and result columns.
- Read `.agents/agent-models.md` when present. Treat its values as preferences, never as required fixed identifiers.

## Decision gate

Do not execute while a product, scope, safety, or one-way user decision remains unresolved. If `wayfinder` is installed and the destination is still foggy or too large for one session, invoke it to create or work through decision tickets. Otherwise write a short local decision brief with the question, known facts, options, consequences, and recommendation, then stop for the user to decide. Internal agent votes may compare evidence. They never settle a one-way user decision.

`auditable-run` starts only after these decisions are settled. When it is unavailable, use its local fallback: define a falsifiable predicate, split work into independently checked units, run one hypothesis at a time, and keep the local TSV trail described above.

## Review routes

Match review work by intent before choosing an implementation playbook.

- Use `code-review` for a read-only review against repository standards and the originating spec. If unavailable, inspect the exact diff from the named base, read repository instructions, check behavior and tests, and report only evidence-backed findings with file and line pointers.
- Use `adversarial-review` to pressure-test a design, diagnosis, or patch without changing it. If unavailable, run two or more read-only internal reviewers with different lenses, verify their claims against source, and synthesize agreements and disagreements.
- Use `fix-all-issues` when the user asks for a bounded repeated review-and-fix loop over all qualifying findings. If unavailable, define the responsibility boundary and stop conditions, alternate fresh local review with focused fixes, validate the exact tree after each round, and stop only on a clean, blocked, stabilized, or capped result.

Review routes do not grant remote mutation or human-communication authority.

## Pick one playbook

Read the matching file before planning. Copy its numbered steps into the active plan. Keep a skipped step visible with a short reason.

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

Use available internal subagent capabilities, not host-specific task names or flags. Choose roles by need. Bulk reading, competing designs, implementation, and independent review are different jobs. Run independent work concurrently when capacity allows. Keep file pointers in prompts and avoid pasting large source blocks.

Do not require a particular model. Use the current host's available choices, the local preferences file, or the parent model. A second opinion should differ by model family or reasoning profile when possible.

## Handoff

Lead with the user-visible outcome. Name changed files, evidence, verification limits, and unresolved choices. Do not append an invitation to perform remote or human communication.
