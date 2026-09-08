# engineering-mode

Use when starting a software task that needs rigor: a bug, feature, refactor, investigation, performance issue, or any multi-step change to code that will be kept. Picks one playbook, routes to the matching principle skills and power-of-ten, and proves the result on the real artifact. Skip for casual questions, throwaway scripts, or when the user opts out.

## Install

```bash
bunx skills@latest add petalas/skills --skill engineering-mode -g -y
```

<!-- BEGIN GENERATED COMPANION INSTALL -->

## Companion skills

The router indexes the `principle-*` leaves and `power-of-ten` and reads each one from `../<name>/SKILL.md` beside its own directory. Install them too, or the router falls back to the one-line rules in its index:

```bash
bunx skills@latest add petalas/skills \
  --skill principle-laziness-protocol \
          principle-foundational-thinking \
          principle-redesign-from-first-principles \
          principle-attack-the-premise \
          principle-subtract-before-you-add \
          principle-minimize-reader-load \
          principle-outcome-oriented-execution \
          principle-experience-first \
          principle-exhaust-the-design-space \
          principle-build-the-lever \
          principle-model-domain-in-code \
          principle-boundary-discipline \
          principle-type-system-discipline \
          principle-make-operations-idempotent \
          principle-replace-internal-apis-atomically \
          principle-separate-before-serializing-shared-state \
          principle-prove-it-works \
          principle-fix-root-causes \
          principle-sequence-verifiable-units \
          principle-test-behavior-not-implementation \
          principle-guard-the-context-window \
          principle-local-autonomy \
          principle-encode-lessons-in-structure \
          power-of-ten \
  -g -y
```

<!-- END GENERATED COMPANION INSTALL -->

## Usage

```text
Use $engineering-mode for this task.
```

This plugin adapts material from pstack. The installed skill includes the full upstream notice and exact provenance.
