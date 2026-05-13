---
name: safe-refactor
version: 0.4.0
description: Find the highest-value behavior-preserving refactor that can be safely bounded, covered by tests or equivalent evidence, and validated. Use when the user asks to improve code quality, simplify architecture, reduce duplication, improve performance or types, deepen a module, make code easier to test, or refactor safely while preserving behavior and compatibility.
---

# Safe Refactor

Use this skill to make one coherent behavior-preserving refactor whose value is justified by improved simplicity, maintainability, correctness resilience, performance, type safety, testability, or boundary clarity.

Prefer the highest-value refactor that can be safely bounded, staged, tested, and validated. The refactor does not need to be tiny, but every touched file should serve one architectural goal. A successful run may either implement a safe refactor or stop with a concrete recommendation when the best opportunity is too broad and no independently valuable first stage exists.

## Workflow

### 0. Check Starting State

Start by reading repo instructions and required docs. Check worktree status before editing.

If tracked files are already modified, do not start code edits without user confirmation. Report the modified files, whether they appear related to the intended refactor, overlap risk, and your recommended action. You may still inspect code and propose candidates. You may proceed without confirmation only when existing changes are clearly unrelated untracked/generated artifacts and the refactor will not touch or depend on them.

Follow repo branch conventions. For larger refactors, mention branch status before editing, but do not create branches unless repo rules or the user require it.

### 1. Find a High-Value Bounded Candidate

Inspect nearby code and tests before proposing edits. Scout enough to avoid grabbing the first easy cleanup.

When comparing candidates, consider:

- Value: what maintenance cost, complexity, or risk it removes.
- Risk: what could regress and how visible the regression would be.
- Testability: whether behavior can be pinned through public interfaces or stable module boundaries.
- Scope coherence: whether every touched file serves one architectural goal.
- Validation cost: whether checks are practical for the blast radius.

Choose the candidate with the best value-to-risk ratio. Do not default to the smallest diff when a larger refactor has clearly better payoff and can be protected by tests. If there is a clear winner, recommend it and proceed. Ask for quick confirmation only when the choice depends on user intent, product semantics, public compatibility, high-risk domains, subjective architecture tradeoffs, or expensive/blocked validation.

If several candidates exist, list 1-3 rejected candidates in one short line each with the reason they were not chosen.

### 2. Value Taxonomy

A strong candidate improves one or more of these while preserving behavior:

- Simplicity: fewer concepts, branches, states, files, or indirections.
- Readability: easier control flow, clearer names, less surprising structure.
- Maintainability: easier future changes, clearer ownership, better locality.
- Correctness resilience: fewer invalid states, concentrated invariants, fewer edge-case traps.
- Type safety: stricter or more expressive internal types without narrowing public compatibility unexpectedly.
- Testability: easier tests through stable boundaries with fewer mocks.
- Performance: less unnecessary work, fewer queries/renders/allocations, or better algorithmic complexity.
- Data structures: better representation for lookup, grouping, ordering, dedupe, or state transitions.
- Design patterns: replacing an ill-fitting pattern with a simpler or more idiomatic one.
- Duplication: one source of truth for caller-visible rules or important constants.
- Boundary clarity: cleaner module/API layering, fewer cycles, better dependency direction.
- Error handling: clearer result/error variants, fewer swallowed or ambiguous failures.
- Resource safety: better cleanup, cancellation, transaction boundaries, or lifecycle handling.
- Compatibility: easier coexistence with legacy clients, migrations, or old data shapes.
- Observability: clearer logs/metrics around existing behavior without changing semantics.
- Build/runtime health: less bundle weight, less dead code, faster tests/builds, fewer flaky paths.

Prefer candidates that improve several dimensions at once. Elegance must be justified by concrete simplification, not personal taste. Acceptable evidence includes fewer concepts, less branching or state, clearer data flow, removed indirection, stronger types, smaller public surface, fewer mocks needed in tests, better locality of a domain rule, or an extension point that matches existing patterns.

Reject style-only rewrites, naming churn, pattern swaps that do not reduce complexity, and changes that merely make code look more familiar to the agent.

### 3. Common Refactor Shapes

These are examples, not an exhaustive list:

- Simplify and collapse: remove unnecessary abstractions, state, branching, configuration, or indirection.
- Characterize and simplify: pin current behavior, then simplify local internals.
- Extract and route: extract a shared rule behind existing public APIs and migrate callers one at a time.
- Strangler stage: build a tested new path beside a tangled old path, then route one narrow slice through it.
- Compatibility wrapper: introduce an internal canonical model and adapt legacy inputs/outputs at the boundary.
- Delete shallow layer: prove external behavior, then inline or remove a layer that hides more than it helps.
- Strengthen types: make invalid internal states unrepresentable while keeping public contracts compatible.
- Improve representation: replace an awkward data structure or model with one that makes behavior simpler, faster, or harder to misuse.
- Replace pattern: replace an ill-fitting design pattern with a simpler or more idiomatic one.

Prefer existing local patterns, naming, testing style, and abstractions by default. Local convention is a default, not a veto. Never reject a clearly better pattern only because it differs from local convention. If local convention appears worse, state the better pattern, the convention it would replace, and whether the right move is a local upgrade, a staged convention migration, or a separate design task.

### 4. Candidate Card

Before editing, write a short candidate card:

- Candidate:
- Value dimensions:
- Refactor shape:
- Why this is the highest-value safe refactor:
- Size / blast radius:
- Why this scope is justified:
- Larger opportunity / this pass / deferred:
- Independent value of this pass:
- Behavior to preserve:
- Non-goals / behavior not changing:
- Compatibility guardrails:
- Type-safety change, if relevant:
- Performance evidence, if relevant:
- Local convention fit / better-pattern opportunity:
- Bugs or questionable behavior found:
- Test coverage before refactor:
- Expected first test result:
- Proceed / ask decision:
- Docs impact:
- Focused validation:
- Broader validation:

Do not choose a refactor whose only value is extracting a private helper from fewer than 3 call sites unless the new or strengthened test covers a previously unprotected public invariant. When choosing a very small refactor, state why it is still worth doing beyond "less duplication."

If the highest-value refactor is too large for one safe pass, do not substitute a trivial cleanup just to make a change. Describe the larger opportunity, explain why it is too large or risky for one pass, and propose the first coherent stage. Proceed only if that stage leaves the codebase better on its own and can be tested/validated. If no independently valuable first stage exists, stop before editing and report a recommendation.

### 5. Compatibility Guardrails

Behavior-preserving means callers and users observe the same intended behavior through supported interfaces: same accepted public inputs, compatible returned shapes, same persisted-data tolerance, same routes/events, same UI states, same documented errors, and no product semantics change.

Internal representation, private helper behavior, algorithms, data structures, and tests may change. Diagnostics may become clearer only if public error variants/contracts remain compatible.

Before writing tests, identify what must not break:

- Public function names, exported types, routes, UI states, analytics events, and persisted data shape.
- Convex public API names, argument validators, return shapes, indexes, and schema compatibility with already-live app versions.
- Mobile/web/admin callers that may still expect old fields, optional fields, or legacy behavior.
- Error variants and `better-result` contracts where used.
- AI prompts, command routing, eval fixtures, model/tool contracts, and generated-output schemas when touched.

For Convex schema/API changes, use compatibility-first migration discipline: additive optional fields first, tolerate old and new shapes, keep existing public functions callable by previous clients, and avoid narrowing validators or returns until all live clients are known safe.

Treat auth, permissions, payments, subscriptions, privacy, analytics attribution, migrations, data deletion, cryptography, external integrations, and AI behavior/eval paths as high-risk. For high-risk refactors, prefer characterization tests through the public boundary, identify compatibility and abuse-case guardrails explicitly, ask for confirmation before broad changes, run broader validation, and do not change semantics, event names, data retention, prompts, schemas, or error contracts without approval.

If discovery reveals a bug, do not silently fix it inside a behavior-preserving refactor. If the bug fix is necessary to make the refactor meaningful, stop and reframe the task as a bug fix with tests for intended behavior. If the bug is incidental, record it as follow-up and keep the refactor behavior-preserving. When current behavior appears wrong but may be depended on, characterize current behavior and ask before changing it.

### 6. Evidence Before Refactor

Before refactoring, either add a focused characterization test or identify existing tests that already protect the behavior. If relying on existing tests, name the exact test files/cases and the regression they would catch. Add a new test when coverage is missing, too private, too broad to diagnose failures, or does not protect the invariant being refactored.

For behavior-preserving refactors, a passing characterization test is valid when it protects behavior that was previously unpinned. It must name the public behavior it protects, the future regression it would catch, and why testing at this boundary is stable.

For larger refactors, before each structural stage, add or identify the public behavior test that guards it. After each meaningful stage, run the focused test.

Test quality bar:

- Prefer the fewest tests that cover the important behavior space.
- Protect public behavior, not private implementation.
- Cover the invariant being moved, concentrated, or simplified.
- Include representative edge cases, not every permutation.
- Use table tests or property tests when they cover a behavior matrix more clearly.
- Avoid brittle snapshots unless the snapshot is the public contract.
- Avoid mocks unless the mock is at a true external boundary.
- Make failures diagnostic when the refactored rule breaks.

When behavior has a meaningful input matrix, choose efficient coverage: one typical case, boundary cases, legacy/compatibility case, invalid/error case where relevant, and one regression case for the maintenance risk motivating the refactor.

A type-focused refactor may be validated primarily by typecheck when behavior is unchanged and the value is making invalid internal states unrepresentable. Type-only refactors must name the invalid state, unsafe cast, implicit union, or weak boundary being removed. Compile-fail/type assertion tests are appropriate when the repo already uses them or the type boundary is the behavior being protected.

Performance can be the primary value dimension when the current code has measured cost, known scaling risk, obvious repeated work, excessive renders/subscriptions/queries, poor algorithmic complexity, or documented production pain. Before changing performance-sensitive code, record a benchmark/profile/test timing when practical, or a concrete complexity/repeated-work argument when measurement is too heavy. After the refactor, validate behavior first, then compare the performance claim where practical.

### 6.5 Build-Green Gate

Tests are not enough. A safe refactor must leave the relevant build and typecheck green before it can be reported as complete.

Before editing, identify the minimum build/type surface that could break:

- Package-local typecheck/build for files changed in one package.
- Downstream workspace typecheck/build for shared or exported code consumed outside the edited package.
- App production build for code included in deploy bundles, static generation, route handlers, middleware/proxy, or framework config.
- Repo-level typecheck/build when the import graph is unclear, generated types are involved, or the refactor crosses package/workspace boundaries.

If the repo has documented deploy validation, treat that command as the success gate for deploy-affecting code. For Vercel/Next.js, prefer the same production build command used by deployment, not only tests. For shared TypeScript packages, run either root typecheck or every known downstream consumer typecheck. If a package has no separate typecheck but an app build performs TypeScript checking, run that app build.

Do not claim a refactor is done, safe, or validated unless the identified build-green gate passed. If the gate is too slow, expensive, unavailable, or blocked by environment, say the refactor is not fully validated, name the exact command not run, and name the residual risk. Do not soften this as "probably safe."

### 7. Refactor While Green

Only refactor after relevant tests/evidence are green. Keep each stage coherent:

- Move, rename, or simplify internals behind existing exports when possible.
- Keep public names and shapes stable unless the user approved a compatibility plan.
- Prefer deleting duplication and concentrating invariants over adding abstractions.
- Prefer deleting unnecessary code over wrapping it.
- Run focused validation after meaningful steps.

Deletion candidates include dead branches, shallow abstractions, duplicate adapters, unused compatibility paths, redundant runtime guards made impossible by stricter types, and tests that only assert deleted implementation details. Do not delete compatibility behavior, persisted-data tolerance, public exports, routes, analytics names, migrations, feature flags, or error variants unless usage has been checked and the user approved the removal.

Internal types should usually become at least as strict as before. Public exported types, runtime validators, serialized payloads, API return shapes, and persisted data tolerance must remain backward-compatible unless the user approves a migration. If exported types/functions in shared packages change, run typecheck for known downstream workspaces or root typecheck even if runtime behavior is unchanged.

Do not add, remove, or upgrade dependencies without user approval. If a dependency would materially simplify the refactor, improve correctness, or replace risky homegrown infrastructure, surface it as an option with why existing tools are insufficient, maintenance/security/bundle/runtime tradeoffs, migration scope, and fallback without the dependency.

Avoid unrelated formatting churn, generated-file updates, dependency changes, and broad import sorting unless required by the refactor or repo tooling. If generated files must change, explain why and validate with the repo's generation/check command.

Update documentation when the refactor changes module ownership or boundaries, public API usage, testing strategy, migration/compatibility rules, known pitfalls, agent routing, or repo instructions. Do not add docs for self-evident internal cleanup.

### 8. Validate No Regression

Run the smallest relevant command first, then broader commands according to blast radius.

- Single module/package: run focused tests first, then package/workspace typecheck or test suite when practical.
- Shared exported types/functions: run downstream workspace typecheck/build or root typecheck/build. If an exported helper is imported by an app, run that app's production build when practical.
- Multi-workspace or cross-contract refactor: finish with repo-level validation required by project docs, typically lint, typecheck, and test, unless the user explicitly skips it or a tool/environment blocker prevents it.
- Deploy-affecting app code: run the deploy-equivalent production build or explicitly report the unvalidated deploy risk.
- Performance refactor: run behavior validation first, then benchmark/profile/build/analyzer checks when practical for the claim.

If full validation is unnecessary, too expensive, skipped, or blocked, run the strongest focused checks available and explicitly say why the checks are enough for the blast radius or what validation gap remains.

Before final response, inspect the diff. Confirm every changed file serves the chosen refactor, no unrelated formatting/generated/dependency churn slipped in, and tests still describe public behavior instead of private implementation.

Hidden behavior-change checklist:

- Public inputs/outputs unchanged or backward-compatible.
- Relevant build-green gate passed, including downstream consumers for shared/exported code.
- Persisted-data tolerance unchanged.
- Error/result variants compatible.
- Analytics/event names unchanged.
- UI visible states/copy unchanged unless intentionally documented.
- AI prompts/schemas/eval contracts unchanged unless intentionally documented.
- Performance/type/design claims supported by evidence.
- No unrelated formatting/generated/dependency churn.

### 9. Output Contract

For an implemented refactor, report:

- Refactor chosen, value dimensions, and why it met the candidate quality bar.
- Scope/blast radius and why the scope was justified.
- Tests/evidence added, changed, or reused, including what behavior they protect.
- Compatibility guardrails checked, especially public APIs, schemas, exported types, high-risk domains, and persisted data.
- Validation commands run and results.
- Why full/root validation was run, skipped, blocked, or considered unnecessary for the blast radius.
- Any remaining risk or follow-up that should stay separate from this refactor.

For recommendation-only mode, explicitly say no code changed and report:

- Refactor opportunity.
- Why it is high value.
- Why it is not safe to implement now.
- Proposed stages.
- Stage 1 tests/evidence and validation.
- Compatibility risks.
- Decision needed from the user.
