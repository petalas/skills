---
name: tdd-refactor
description: Find one small refactoring or architecture improvement, cover current behavior with tests first, then perform the refactor safely. Use when the user asks to improve code quality, simplify architecture, reduce duplication, deepen a module, make code easier to test, or do a TDD refactor while preserving behavior and backward compatibility.
---

# TDD Refactor

Use this skill to make a narrow, behavior-preserving improvement. The goal is not broad cleanup; it is one concrete refactor whose value can be proven by tests and validation.

## Workflow

### 1. Find a Small Candidate

Start by reading the repo instructions and any required docs for files likely to change. Then inspect nearby code and tests before proposing edits.

Choose a candidate only if it is:

- Small enough to finish in one pass.
- Behavior-preserving from a caller or user point of view.
- Valuable because it improves locality, reduces duplication, clarifies an interface, removes a shallow module, or makes existing behavior easier to test.
- Testable through public interfaces or stable module boundaries.

Reject candidates that require broad rewrites, new product behavior, schema/API breaks, speculative abstractions, or tests coupled to private implementation details.

Scout enough to avoid grabbing the first easy cleanup. If several candidates exist, list 1-3 rejected candidates in one short line each with the reason they were not chosen, then pick the smallest one with the clearest test surface. State the chosen candidate, affected files, current behavior to preserve, and validation command before editing.

Before editing, write a short candidate card:

- Candidate:
- Why this is the smallest valuable refactor:
- Behavior to preserve:
- Compatibility guardrails:
- Test to add first:
- Expected first test result: expected RED or characterization pass
- Focused validation:
- Broader validation:

Prefer candidates where the new or strengthened test protects a real maintenance risk: duplicated caller-visible behavior, scattered invariants, unclear module boundaries, or code that is hard to change safely. Avoid refactors that only move literals, rename private helpers, or introduce abstractions unless they clearly improve a public test surface or compatibility guardrail.

Do not choose a refactor whose only value is extracting a private helper from fewer than 3 call sites unless the new or strengthened test covers a previously unprotected public invariant. When choosing a very small refactor, state why it is still worth doing beyond "less duplication."

### 2. Define Compatibility Guardrails

Before writing tests, identify what must not break:

- Public function names, exported types, routes, UI states, analytics events, and persisted data shape.
- Convex public API names, argument validators, return shapes, indexes, and schema compatibility with already-live app versions.
- Mobile/web/admin callers that may still expect old fields, optional fields, or legacy behavior.
- Error variants and `better-result` contracts where used.

For Convex schema/API changes, use compatibility-first migration discipline: additive optional fields first, tolerate old and new shapes, keep existing public functions callable by previous clients, and avoid narrowing validators or returns until all live clients are known safe.

### 3. Write Tests First

Use vertical TDD:

1. Write one focused test for existing observable behavior.
2. Run it and confirm it fails for the expected reason if it covers missing or previously untested behavior. If preserving already-working behavior, it may pass before refactor; record that it is a characterization test.
3. Add only the minimal implementation or test harness needed to make the behavior covered.
4. Repeat only for behaviors needed to make the refactor safe.

When a characterization test passes before the refactor, say what relationship or invariant it now protects and name the future regression it would catch. Do not treat "it passes" as enough justification by itself.

Prefer integration-style tests through exported functions, public routes, Convex test helpers, or rendered user-visible behavior. Avoid tests that assert private helper names, internal call order, or mock-heavy implementation details.

### 4. Refactor While Green

Only refactor after relevant tests are green. Keep each refactor step small:

- Move or rename internals behind existing exports when possible.
- Keep public names and shapes stable unless the user explicitly approves a compatibility plan.
- Prefer deleting duplication and concentrating invariants over adding abstractions.
- Run the focused test command after meaningful steps.

If a refactor reveals behavior change is needed, stop and ask or create a separate feature task. Do not smuggle product changes into a refactor.

### 5. Validate No Regression

Run the smallest relevant command first, then broader commands according to blast radius. For cross-workspace changes, finish with the repo's documented lint, typecheck, and test commands.

If full validation is unnecessary, too expensive, or blocked, run the strongest focused checks available and explicitly say why the checks are enough for the blast radius or what validation gap remains.

## Output Contract

When finished, report:

- Refactor chosen, why it was small, and why it met the candidate quality bar.
- Tests added or changed, including what behavior they protect.
- Compatibility guardrails checked, especially Convex/API/schema concerns.
- Validation commands run and results.
- Why full/root validation was run, skipped, or considered unnecessary for the blast radius.
- Any remaining risk or follow-up that should stay separate from this refactor.
