# gpt-image-2-5

Generate and edit images with ChatGPT Images 2.5 through the local Codex CLI and the user's existing ChatGPT subscription, with no API key and no per-image billing.

## Install

```bash
bunx skills@latest add petalas/skills --skill gpt-image-2-5 -y
```

## Usage

Ask for GPT Image 2.5 or ChatGPT Images 2.5, or ask to generate or edit an image through your ChatGPT plan.

## Prerequisites

- `codex` on `PATH`, logged in with the ChatGPT option through `codex login`.
- A ChatGPT plan with image generation access.
- `python3` on `PATH`.

The skill does not grant image-generation entitlement and has no API-key fallback.

## Source map

```text
plugins/gpt-image-2-5/
  .codex-plugin/plugin.json
  commands/gpt-image-2-5.md
  README.md
  skills/gpt-image-2-5/SKILL.md
  skills/gpt-image-2-5/agents/openai.yaml
  skills/gpt-image-2-5/scripts/generate.py
```
