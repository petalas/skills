---
name: automate-me
version: 0.2.0
disable-model-invocation: true
description: Create or update a personal mode skill from the user's stated preferences and workspace-scoped conversation history.
---

# Automate me

Turn the user's recurring working preferences into one concise `-mode` skill. The output records how agents should work for this user. It does not automate contact with other people.

Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. No agent may post, send, reply, or comment through external chat, email, ticket, review, or social tools. If communication is useful, prepare a local draft for the user.

## 1. Find the existing mode

Inspect repository instructions, the active skill catalog, and documented project and user skill roots for `*-mode/SKILL.md`. Do not assume one host's directory layout. If a matching mode exists, update it unless the user explicitly asks to start again.

For an update, preserve rules that new evidence does not contradict. Mine only history since the file's last meaningful edit when that boundary is available.

## 2. Mine workspace-scoped evidence

Use only the active workspace's conversation history exposed by the host. Never scan unrelated projects or a global transcript store. If no transcript path or conversation-history capability exists, work from the current conversation and ask the user for missing preferences.

When enough history exists, split it into a few time slices and ask parallel read-only subagents to find recurring patterns. Require evidence pointers. Promote patterns repeated across slices. Treat a single occurrence as weak evidence.

Look for response style, autonomy limits, delegation preferences, verification standards, code and prose rules, local process conventions, and skill-authoring habits.

## 3. Ask for intent

Ask no more than two compact structured questions when the host supports them, followed by one optional free-form question. In update mode, ask what changed or remains missing. Do not make the user repeat preferences already supported by evidence.

## 4. Draft the mode skill

Use the available skill-authoring capability or follow the repository's skill conventions directly. Put the new skill in the repository's documented project-local root. If none exists, use `.agents/skills/<handle>-mode/SKILL.md`. Use a user-level root only when the user asks for a personal installation.

The description should trigger on the user's chosen name, the mode name, or an explicit request to work in that style. Disable automatic invocation by default unless the user asks for the mode on every turn.

Add only sections backed by a specific preference. Common sections include response style, autonomy, subagents, verification, code and prose rules, and local process. Reference existing skills by name or path. Do not copy their bodies.

Every generated mode must carry this communication rule exactly: `Subagents may communicate with each other, but no agent may communicate with a person.`

## 5. Edit the prose

Apply the `unslop` skill when installed. Otherwise remove filler, generic claims, decorative formatting, forced symmetry, and host jargon. Use short concrete sentences. A sentence stays only when it changes a future agent's decision.

Show the draft to the user and incorporate their corrections. Run any available skill validator. Leave the result as local files. Version control and external review actions remain outside this skill.

## When not to use

- Use a normal skill-authoring workflow for one task-specific procedure.
- Use a narrow skill for one convention, such as test naming.
- Do not infer personal rules from unrelated projects or other people's conversations.
