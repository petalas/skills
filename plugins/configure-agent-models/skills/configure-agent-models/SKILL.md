---
name: configure-agent-models
version: 0.1.0
disable-model-invocation: true
description: Record host-neutral model preferences for internal agent roles using only models available in the current environment.
---

# Configure agent models

Create or update a project-local model preference file for skills that coordinate subagents. The file is advisory configuration, not an automatically applied host rule. Only a skill that explicitly reads `.agents/agent-models.md` uses these preferences. Discover the current consumers from installed skill instructions instead of assuming that every host or installation contains the same set.

## 1. Detect available choices

Enumerate the models, model families, and reasoning profiles the current host exposes for subagents. Prefer a host-provided model listing. If the host cannot enumerate choices, ask the user to provide the supported identifiers.

Never write an identifier that has not been confirmed in the current environment. The values `inherit-parent` and `auto` are always valid. They mean the role should omit an explicit model override.

## 2. Load current preferences

Use the repository's documented model configuration when it has one. Otherwise use `.agents/agent-models.md` in the project root. Read the current file before proposing changes.

Start a new file with these roles:

- implementation
- bug investigation
- performance investigation
- judgment and prose
- design candidates
- independent judge
- review lenses
- synthesis
- bulk source reading

Do not add a role until a consumer skill documents that role. When a consumer is unavailable, keep its role out of a new file rather than implying the preference is active.

## 3. Confirm the mapping

Show every role and its current value. Mark unavailable identifiers. Let the user accept the mapping or choose from confirmed models plus `inherit-parent` and `auto`.

Panel roles may contain a list. One internal subagent runs per entry, so list length controls fan-out. Prefer model-family diversity for design panels and independent review when the host supports it.

## 4. Validate and write

Reject any unconfirmed identifier. Write the whole file so repeated runs are idempotent. Use this shape:

```markdown
# Agent model preferences

This file configures internal subagent roles. Skills fall back to the parent model when a role is absent.

- implementation: inherit-parent
- bug investigation: inherit-parent
- performance investigation: inherit-parent
- judgment and prose: inherit-parent
- design candidates: inherit-parent
- independent judge: inherit-parent
- review lenses: inherit-parent
- synthesis: inherit-parent
- bulk source reading: inherit-parent
```

Keep provider-specific identifiers only in the values. Do not add provider-specific tool calls, task flags, or directory assumptions.

## 5. Report

Tell the user which local file changed, which roles use explicit choices, and which installed skills actually read the file. Re-running this skill updates the same file. Do not claim that non-consumer skills honor it. Do not change global host settings, install models, or contact external services.
