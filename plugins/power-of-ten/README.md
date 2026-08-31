# power-of-ten

Apply all ten language-agnostic rules to every coding task. Inspect the code needed for the task, improve encountered violations without widening into unrelated rewrites, verify affected behavior, and document any justified deviation.

The skill checks all ten rules against the code read or changed for the task. Its scope-bounded compliance ratchet requires the agent to assess touched code before editing, safely fix or constrain local violations, introduce no new violation, verify affected behavior, and report any deferred violation with its exact reason and follow-up. A legitimate deviation must name its reason, scope, compensating control, and verification.

## Install

```bash
bunx skills@latest add petalas/skills --skill power-of-ten -g -y
```

## Usage

```text
Apply $power-of-ten to this task. Check all ten rules, improve encountered violations within scope, verify affected behavior, and document justified deviations.
```
