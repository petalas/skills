---
name: configure-agent-models
version: 0.3.0
disable-model-invocation: true
description: Record host-neutral model and reasoning preferences for internal agent roles using only choices available in the current environment.
---

# Configure agent models

Create or update a project-local model and reasoning preference file for skills that coordinate subagents. The file is advisory configuration, not an automatically applied host rule. Only a skill that explicitly reads `.agents/agent-models.md` uses these preferences. Discover the current consumers from installed skill instructions instead of assuming that every host or installation contains the same set.

## 1. Detect available choices

Enumerate the models, model families, and reasoning profiles the current host exposes for subagents, including which profiles each model supports. Prefer a host-provided capability listing. If the host cannot enumerate choices, ask the user to provide the supported identifiers and profiles.

Never write an identifier or profile that has not been confirmed in the current environment. The values `inherit-parent` and `auto` are always valid. For a model entry, they mean the role should omit both model and reasoning overrides. For the reasoning profile, they mean omit the reasoning override. Never construct a model identifier by adding, removing, or replacing an effort suffix.

## 2. Load current preferences

Use the repository's documented model configuration when it has one. Otherwise use `.agents/agent-models.md` in the project root. Read the current file, including its reasoning profile, before proposing changes.

Start a new file with these roles:

- implementation
- bug investigation
- performance investigation
- judgment and prose
- design candidates
- architect candidates
- independent judge
- review lenses
- synthesis
- bulk source reading

Do not add a role until a consumer skill documents that role. When a consumer is unavailable, keep its role out of a new file rather than implying the preference is active. Remove a role from an existing file only when it is confirmed retired, not merely because its optional consumer is currently unavailable. List any proposed removals before confirmation.

## 3. Choose reasoning and confirm the mapping

Show the current reasoning profile and offer the profiles the host actually supports, plus `inherit-parent` and `auto`. Use the chosen profile across explicit model entries, including panel entries. Keep existing model choices, lists, and aliases when changing the profile. Do not assume that profile labels, effort ordering, or model families are portable between hosts. A reasoning profile is a preference, not a guaranteed token or spending limit. The configured profile is each role's starting point. A consuming skill may step it up or down per job, only within the profiles the host confirms for that model, and keeps the model family unchanged. When `engineering-mode` is installed, its Delegation rule defines those steps.

Show every role, its model choices, and the effective reasoning profile. Mark unavailable identifiers and unsupported model/profile pairs. Let the user accept the mapping or choose from confirmed models and profiles plus `inherit-parent` and `auto`.

`design candidates`, `architect candidates`, and `review lenses` may contain lists. Panel consumers normally run one internal subagent per entry, including aliases. `adversarial-review` retains at least two review passes. `reflect` always uses its three named lenses: map entries in order, inherit missing entries, and report surplus entries as unused. `independent judge` may be a pool, but its consumer selects one entry. Prefer model-family diversity for design panels and independent review when the host supports it. `architect candidates` overrides `design candidates` for architecture work. Other roles use a single model choice.

## 4. Validate and write

Reject any unconfirmed identifier or unsupported model/profile pair and ask for a supported choice. Write the whole file so repeated runs are idempotent. Use this shape, retaining only the roles with documented consumers:

```markdown
# Agent model preferences

This file configures internal subagent roles. Skills fall back to the parent model when a role is absent.

- reasoning profile: inherit-parent
- implementation: inherit-parent
- bug investigation: inherit-parent
- performance investigation: inherit-parent
- judgment and prose: inherit-parent
- design candidates: inherit-parent
- architect candidates: inherit-parent
- independent judge: inherit-parent
- review lenses: inherit-parent
- synthesis: inherit-parent
- bulk source reading: inherit-parent
```

Keep provider-specific identifiers only in the values. Do not add provider-specific tool calls, task flags, or directory assumptions. Never write role lines into always-loaded agent instruction files such as `AGENTS.md`. Keep them in the documented configuration file or `.agents/agent-models.md`. If the documented configuration lives in such a file, propose `.agents/agent-models.md` and let the user decide.

Consumers read the role they document and the optional `reasoning profile` line. Before each spawn, validate the pair against the current host. For a missing role, or an `auto` or `inherit-parent` model entry, omit both overrides. For a missing, `auto`, or `inherit-parent` reasoning profile, omit only the reasoning override. If the host rejects a consumer's adjusted profile, retry once with the configured pair. If a configured choice is unavailable or the host rejects a configured model/profile pair, report the rejected choice and retry that seat once with both overrides omitted. If the retry fails, record the gap or perform the consumer's documented local fallback. Never rewrite identifiers or silently claim the requested model or profile ran.

## 5. Report

Tell the user which local file changed, which roles and reasoning profile use explicit choices, and which installed skills actually read the file. Re-running this skill updates the same file. Do not claim that non-consumer skills honor it. Do not change global host settings, install models, or contact external services.
