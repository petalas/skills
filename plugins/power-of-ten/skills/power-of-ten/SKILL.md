---
name: power-of-ten
version: 0.2.0
description: "Apply all ten language-agnostic rules to every coding task. Inspect the code needed for the task, improve encountered violations without widening into unrelated rewrites, verify affected behavior, and document any justified deviation."
---

# Power of Ten

Apply all ten rules on every coding task. Check the code you must read or change to complete the task, including relevant entry points, callers, dependencies, and failure paths. Scale the depth of inspection and verification to the amount of touched code and the risk of the change. Do not turn this policy into an unrelated repository-wide rewrite.

Compliance is directional. Leave every inspected or changed area at least as compliant as you found it. When you encounter a local violation, remove it or constrain it when that is safe and within the task. Never introduce a new violation or make new code depend unnecessarily on an existing one. If immediate cleanup would increase risk or expand scope, record the violation, keep the change from worsening it, and give a concrete follow-up. Never weaken behavior, error handling, tests, or verification to claim compliance.

For each rule, perform the stated inspection, make the stated change when needed, and collect the stated evidence.

## The rules

### 1. Use structured control flow

- **Inspect:** Trace branches, loops, calls, returns, exceptions, cancellation, and cleanup across every changed path. Identify jumps, hidden transfers, or recursion whose exit and cleanup behavior cannot be stated.
- **Change:** Replace opaque transfers with the language's structured branches, loops, pattern matching, scoped cleanup, ordinary calls, or explicit error propagation. Keep early returns and exceptions only when each exit preserves ownership and cleanup. Keep recursion only with a defensible termination condition and depth bound.
- **Evidence:** Show that each exit and cleanup path can be enumerated from the code. Exercise a representative success and failure or cancellation path when control flow changed, and state the recursion depth bound when recursion remains.

### 2. Bound every unit of work

- **Inspect:** Find every loop, retry, recursion, queue drain, wait, blocking call, asynchronous operation, and batch. Identify its finite input bound, deadline, cancellation signal, attempt budget, capacity limit, or terminal protocol state.
- **Change:** Add a stopping condition where none exists. Bound each turn of a long-lived server or event loop and provide an orderly stop path. Derive numeric limits from input constraints, measured capacity, or service requirements rather than choosing an unexplained constant.
- **Evidence:** Name the bound for each affected operation and its source. Exercise the limit, timeout, cancellation, or terminal state, and show that the operation stops with the documented result.

### 3. Control finite resources

- **Inspect:** List memory, files, sockets, locks, tasks, threads, processes, storage, handles, and other finite resources acquired or retained by the affected path. For each one, locate its owner, lifetime, capacity, and cleanup on success, failure, timeout, and cancellation.
- **Change:** Give unowned resources an explicit owner and pair each acquisition with reliable release. Add admission control, backpressure, streaming, pooling, bounded allocation, or rejection behavior before capacity is exhausted. Use the mechanism that fits the language, runtime, measured budget, and failure model.
- **Evidence:** Show the acquisition-to-release path and the behavior at capacity. Exercise cleanup on the relevant non-success exit and use a leak, resource-count, or capacity check when the toolchain provides one.

### 4. Keep units small and cohesive

- **Inspect:** State the contract and responsibility of every function, method, module, or process changed. Flag a unit when it mixes independent policies, owns unrelated resource lifetimes, has effects outside its contract, or requires tracing distant mutable state to understand it.
- **Change:** Split mixed responsibilities at a boundary with explicit inputs, outputs, ownership, and failure behavior. Remove or combine fragments when a split scatters one invariant or lifecycle across layers. Do not use line count as a substitute for cohesion.
- **Evidence:** State the contract of each resulting unit and show where each resource and effect belongs. Run affected behavior through the new boundary and confirm that no policy or lifecycle was lost between units.

### 5. Make invariants executable

- **Inspect:** Identify the preconditions, postconditions, legal state transitions, ranges, ordering rules, and resource assumptions on which the changed behavior depends. Find assumptions expressed only in prose, comments, naming, or caller convention.
- **Change:** Encode each important assumption with the strongest suitable language or runtime mechanism, such as types, checked constructors, contracts, assertions, schema constraints, state machines, or targeted tests. Validate untrusted input instead of asserting it. Keep invariant checks free of side effects required for correct execution.
- **Evidence:** Point to the machine-enforced check and exercise a valid and invalid case when the invariant changed. Show that violation fails at the intended boundary without corrupting state or hiding the fault.

### 6. Narrow the scope of state and authority

- **Inspect:** Locate each affected declaration, mutation, capability, dependency, and lock. Identify state or authority visible beyond the code that owns its full lifetime, plus shared mutable state whose synchronization or atomicity is unclear.
- **Change:** Move state and authority to the narrowest scope that preserves lifetime, ownership, atomicity, and lock discipline. Prefer immutable local values and explicit dependencies. Do not disguise broad state behind a singleton, registry, ambient context, or service locator.
- **Evidence:** Show which code can read, mutate, or exercise the affected state or capability after the change. Use the repository's type, concurrency, or behavior checks to demonstrate that required access remains and unintended access does not.

### 7. Check inputs and fallible results

- **Inspect:** Follow untrusted input from each affected boundary into domain state. Enumerate every fallible operation and result, including partial reads or writes, missing values, timeouts, cancellation, retries, and cleanup failures that can affect correctness.
- **Change:** Validate before constructing trusted state. Handle each failure by propagating, translating, retrying within a bound, compensating, or returning a documented safe result. If a best-effort result may be ignored, make that decision explicit in code and define the safe fallback.
- **Evidence:** Exercise malformed or boundary input and the relevant failure result. Show the caller-visible outcome, state after failure, and handling of partial progress or cleanup when those cases exist.

### 8. Keep metaprogramming inspectable

- **Inspect:** Identify macros, reflection, code generation, dynamic evaluation, decorators, annotations, runtime registration, and other mechanisms that create behavior outside the direct control flow. Determine what code or behavior they produce and when failures appear.
- **Change:** Replace opaque machinery with direct language constructs when it adds no necessary capability. When metaprogramming removes real repetition or derives behavior from an authoritative schema, constrain its inputs, make generated output or expansion inspectable, and move failures to build or startup time where the runtime permits.
- **Evidence:** Inspect the generated output, expansion, registration, or runtime mapping. Exercise behavior introduced by the mechanism and an invalid definition or input so failure occurs at the documented phase.

### 9. Remove needless indirection

- **Inspect:** Trace the affected path from entry point to the operation it controls. Mark wrappers, callback chains, forwarding modules, dynamic dispatch, adapters, and pointer-like hops, then name the policy, isolation, lifecycle, or substitution each layer provides.
- **Change:** Remove or collapse a layer that has no named responsibility beyond forwarding. Keep an abstraction when it owns a stable boundary, isolates a volatile dependency, enforces a policy, manages a lifecycle, or provides a substitution the code actually uses. Make implementation selection explicit when dynamic dispatch remains.
- **Evidence:** Provide the resulting call or data path and the responsibility of each remaining layer. Exercise the affected operation through its real entry point and confirm that required substitution or isolation still works.

### 10. Enforce diagnostics and static analysis

- **Inspect:** Identify the compiler warnings, type checks, linters, static analyzers, and language-specific safety checks already supported for the affected code. Review every diagnostic attributable to code in task scope.
- **Change:** Enable the strongest supported settings that can be applied within the affected configuration and resolve findings in touched code. Do not mute a diagnostic to finish the task. If a tool is wrong or cannot inspect generated, platform, or third-party code, use the narrowest suppression and follow the deviation policy below.
- **Evidence:** Record the exact relevant commands or editor checks and their results. Tie every remaining suppression to a specific diagnostic, code location, reason, compensating control, and verification.

## Compliance ratchet workflow

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
