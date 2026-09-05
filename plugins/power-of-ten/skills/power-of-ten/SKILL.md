---
name: power-of-ten
version: 0.3.0
description: "Apply all ten language-agnostic rules to every coding task. Inspect the code needed for the task, improve encountered violations without widening into unrelated rewrites, verify affected behavior, and document any justified deviation."
---

# Power of Ten

Apply all ten rules on every coding task. Check the code you must read or change to complete the task, including relevant entry points, callers, dependencies, and failure paths. Scale the depth of inspection and verification to the amount of touched code and the risk of the change. Do not turn this policy into an unrelated repository-wide rewrite.

Compliance is directional. Leave every inspected or changed area at least as compliant as you found it. When you encounter a local violation, remove it or constrain it when that is safe and within the task. Never introduce a new violation or make new code depend unnecessarily on an existing one. If immediate cleanup would increase risk or expand scope, record the violation, keep the change from worsening it, and give a concrete follow-up. Never weaken behavior, error handling, tests, or verification to claim compliance.

Preserve the ten constraints of the 2006 Power of Ten ruleset while translating language-specific mechanisms into their equivalents. When a language lacks a mechanism, record that fact and inspect its nearest equivalent. Do not treat a weaker substitute as direct compliance. Use the deviation policy when a constraint cannot be met.

For each rule, perform the stated inspection, make the stated change when needed, and collect the stated evidence.

## The rules

### 1. Use structured control flow without recursion

- **Inspect:** Trace branches, loops, calls, returns, exceptions, cancellation, and cleanup across every changed path. Find unstructured jumps, nonlocal transfers, and direct or indirect recursion, including cycles through callbacks.
- **Change:** Use structured branches, loops, pattern matching, scoped cleanup, and explicit error propagation. Eliminate arbitrary jumps and direct or indirect recursion. Replace recursive traversal with iteration over a bounded worklist. Keep early returns and structured exceptions only when each exit preserves ownership and cleanup. A termination proof alone does not make recursion compliant.
- **Evidence:** Enumerate exits and cleanup paths. Inspect the affected call graph for cycles. Exercise success and failure or cancellation paths when control flow changed. For unavoidable recursion, document a deviation with a proven depth limit and stack budget.

### 2. Give every loop an explicit iteration upper bound

- **Inspect:** Find loops, iterator pipelines, retries, queue drains, and batches, including work hidden in library calls. Identify an explicit maximum iteration count derivable from code or enforced input constraints. Also inspect waits, blocking calls, and asynchronous operations for time bounds.
- **Change:** Enforce a finite iteration upper bound before or during each loop. Use bounded collection sizes, attempt counters, or decreasing work budgets. A deadline, cancellation signal, or expected terminal state alone does not establish an iteration bound. For an intentionally long-lived service loop, document its purpose and stop path as a deviation, and bound the work in each turn. Derive limits from input constraints, measured capacity, or service requirements.
- **Evidence:** State each affected loop's maximum iterations and how the code enforces it. Account for nested loops and work added during iteration. Exercise the limit and exhaustion behavior. Verify timeouts and cancellation separately where required.

### 3. Fix memory capacity before steady operation

- **Inspect:** Identify initialization and steady operation for the affected component. Locate explicit and implicit allocation after initialization, including collection growth, temporary objects, closures, and library allocations. List other finite resources with their owners, capacities, and lifetimes.
- **Change:** Where allocation is controllable, allocate required memory during initialization and prohibit dynamic allocation afterward. Use fixed-capacity storage or preallocated pools with explicit exhaustion behavior. Where the runtime requires allocation, document a deviation and bound live memory through enforced input sizes, concurrency limits, bounded buffers, and backpressure. Garbage collection or eventual release alone does not satisfy the allocation constraint. Pair resource acquisition with reliable release on every exit.
- **Evidence:** Show the initialization boundary, capacity calculation, and exhaustion behavior. Use allocation instrumentation or static inspection to check steady operation. For a managed-runtime deviation, verify the live-memory bound under sustained work and cleanup on failure or cancellation. State any runtime or library allocation that cannot be inspected.

### 4. Keep functions within one screen or page

- **Inspect:** Measure each affected function or method in its normal repository formatting. Use roughly 60 physical lines as the review ceiling when the project has no stricter one-page limit. Include signatures, comments, and blank lines. Check cohesion as well as length.
- **Change:** Shorten functions that exceed the ceiling by separating responsibilities into named operations with explicit inputs, outputs, ownership, and failure behavior. Do not compress formatting, delete useful explanations, or scatter one invariant across forwarding helpers to pass the count. If a cohesive function must exceed the limit, document a deviation.
- **Evidence:** Report the length and responsibility of each affected function near or above the ceiling. Exercise behavior through any new boundary and confirm that ownership and failure handling remain intact.

### 5. Assert meaningful invariants

- **Inspect:** Identify preconditions, postconditions, legal state transitions, ranges, ordering rules, and resource assumptions. Check assertion density in the affected code. Use a target of at least 2%, approximately one meaningful assertion per 50 lines of code, as a review signal.
- **Change:** Add side-effect-free assertions or executable contracts for internal assumptions that can fail. Make each check useful for detecting a fault. Do not add tautologies, duplicate checks, or assert externally supplied input to meet a quota. Validate untrusted input with normal error handling. Use types and checked constructors where they can eliminate invalid states, but identify which runtime checks they replace. Tests support these checks rather than counting toward runtime assertion density.
- **Evidence:** Identify each invariant and its enforcing mechanism. Exercise valid and invalid cases when an invariant changes. Verify the failure behavior and whether checks remain enabled in production. If density is below the target, explain which assumptions are enforced elsewhere or why more assertions would be redundant.

### 6. Narrow the scope of state and authority

- **Inspect:** Locate each affected declaration, mutation, capability, dependency, and lock. Identify state or authority visible beyond the code that owns its full lifetime, plus shared mutable state whose synchronization or atomicity is unclear.
- **Change:** Move state and authority to the narrowest scope that preserves lifetime, ownership, atomicity, and lock discipline. Prefer immutable local values and explicit dependencies. Do not disguise broad state behind a singleton, registry, ambient context, or service locator.
- **Evidence:** Show which code can read, mutate, or exercise the affected state or capability after the change. Use the repository's type, concurrency, or behavior checks to demonstrate that required access remains and unintended access does not.

### 7. Check every returned value and argument contract

- **Inspect:** Enumerate every affected call that returns a value and every callee's argument constraints. Include status values, partial reads or writes, missing values, asynchronous results, timeouts, cancellation, and cleanup failures.
- **Change:** Consume and check each returned value as its contract requires, or explicitly mark an intentional discard with a reason that establishes safety. Handle every failure by propagating, translating, retrying within a bound, compensating, or returning a documented safe result. Check argument validity at function entry through types, checked constructors, contracts, assertions, or runtime validation. Validate untrusted values before constructing trusted state. Do not repeat checks already guaranteed by the internal representation.
- **Evidence:** Account for every discarded result and show how each argument constraint is enforced. Exercise invalid input and relevant failure results, including partial progress and cleanup when applicable. Show the caller-visible outcome and state after failure.

### 8. Restrict preprocessing and metaprogramming

- **Inspect:** Find preprocessing, macros, conditional compilation, reflection, code generation, dynamic evaluation, decorators, and runtime registration. Identify token construction, variadic macro expansion, hidden control flow, and build-dependent behavior.
- **Change:** Limit preprocessing to file inclusion and simple macros. Avoid token pasting and variadic macros, and minimize conditional compilation. In languages without preprocessing, apply the same restriction to mechanisms that construct code or hide behavior. Prefer ordinary functions, modules, and explicit configuration. Language-supported variable-argument functions do not by themselves violate the macro restriction. When required generation or framework machinery exceeds these limits, document a deviation with constrained inputs and inspectable output or mappings.
- **Evidence:** Inspect expansions, generated output, or runtime mappings. Check supported build variants affected by conditional compilation. Exercise introduced behavior and invalid definitions at the documented failure phase.

### 9. Limit dereferencing and indirect calls

- **Inspect:** Count levels of pointer dereferencing in affected expressions and identify function pointers or equivalent indirect call targets. In reference-based languages, inspect chained object traversal, nested mutable references, callback chains, and runtime dispatch. An ordinary member access is not automatically equivalent to an unsafe pointer dereference.
- **Change:** Where pointers exist, use no more than one level of dereferencing per expression and avoid function pointers. Do not hide deeper pointer chains in aliases just to pass the count. Elsewhere, keep data access shallow and prefer direct calls with explicit ownership and visible targets. Remove forwarding layers without a responsibility. When callbacks or dynamic dispatch are required by a framework or a used substitution boundary, document a deviation with bounded targets and explicit lifecycle rules.
- **Evidence:** Show the affected data-access and call paths, the dereference depth where applicable, and the possible targets of remaining indirect calls. Exercise required dispatch and verify ownership and lifetime behavior.

### 10. Enable maximum diagnostics on every build

- **Inspect:** Identify compiler warnings, type checks, linters, and static analyzers available for the affected language. Check their strictest or most pedantic settings and whether every system build runs them. For interpreted code, inspect the equivalent validation or CI workflow.
- **Change:** Enable all applicable warnings and the strongest supported analysis settings within the affected configuration. Run static analysis on every system build, or the equivalent validation run when there is no compiler. Resolve findings in touched code and prevent new warnings. Do not mute a diagnostic to finish the task. Document unavailable tools, deferred configuration changes, and unavoidable suppressions under the deviation policy. Keep any suppression specific to its diagnostic and location.
- **Evidence:** Record the exact commands, settings, and results. Inspect the build or CI configuration to verify recurring enforcement. Distinguish existing diagnostics from new ones and tie each remaining suppression to its reason, compensating control, and verification.

## Compliance workflow

1. **Bound the task.** Identify the code that must be read or changed, its entry points and callers, its owned resources, and the behavior that the task can affect.
2. **Assess before editing.** Run all ten inspections against that code. Record local violations that the change could touch, worsen, or depend on.
3. **Plan a safer change.** Remove or constrain encountered violations when it is safe and in scope. Preserve existing behavior unless the task changes it, and do not weaken tests or failure handling.
4. **Apply every rule.** Check each edit against all ten rules. New code must comply. Existing inspected code must not become less compliant or gain new dependence on a deferred violation.
5. **Verify affected behavior.** Exercise the real changed path, including relevant boundary, failure, timeout, cancellation, capacity, partial-progress, and cleanup behavior. Run the diagnostics and static analysis supported for the affected code.
6. **Report the result.** State which encountered violations were fixed. For each violation left in place or each legitimate deviation, record the exact reason, bounded scope, compensating control, verification, and concrete follow-up.

## Universal deviation policy

No rule is optional, contextual, or a default that can be skipped. A legitimate language or runtime mechanism may satisfy a rule in different ways. A deviation is acceptable only when direct compliance would conflict with a platform constraint, break a required behavior, or expand the change beyond the safely bounded task. Convenience, legacy precedent, and lack of time are not enough.

Keep each deviation beside the repository's design or safety decisions and tie it to the affected code. Update or remove it when the code or constraint changes.

```text
Rule: <rule number and name>
Location: <code paths or components>
Reason: <specific constraint preventing direct compliance>
Scope: <exact behavior and duration covered>
Compensating control: <mechanism limiting the same failure mode>
Verification: <command, test, analysis, or observed result proving the control>
Follow-up: <specific code change and the condition or owner that will trigger it>
```

A deviation does not waive the risk or permit new code to spread it. If the compensating control cannot be verified, redesign the affected change or report that the work is blocked rather than claiming compliance.
