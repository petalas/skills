# power-of-ten

Apply all ten language-agnostic rules to every coding task. Inspect the code needed for the task, improve encountered violations without widening into unrelated rewrites, verify affected behavior, and document any justified deviation.

The skill checks all ten rules against the code read or changed for the task. Its compliance workflow requires the agent to assess touched code before editing, safely fix or constrain local violations, introduce no new violation, verify affected behavior, and report any deferred violation with its exact reason and follow-up. A legitimate deviation must name its reason, scope, compensating control, and verification.

The rules preserve the concrete constraints of the 2006 Power of Ten ruleset: no recursion, explicit iteration limits, memory capacity fixed before steady operation, one-page functions, meaningful assertions with a 2% density target, minimal declaration scope, checked return values and arguments, restricted metaprogramming, limited dereferencing and indirect calls, and maximum diagnostics on every build.

Language-specific mechanisms map to equivalent checks. Managed allocation, required callbacks, and other unavoidable departures need documented constraints and verification. The skill uses roughly 60 lines as a practical one-page ceiling and treats assertion density as a review signal, so agents cannot satisfy either target with formatting tricks or redundant checks.

## Install

```bash
bunx skills@latest add petalas/skills --skill power-of-ten -g -y
```

## Usage

```text
Apply $power-of-ten to this task. Check all ten rules, improve encountered violations within scope, verify affected behavior, and document justified deviations.
```
