---
name: gpt-image-2-5
version: 0.1.0
description: "Generate and edit images with ChatGPT Images 2.5 through the local codex CLI and the user's ChatGPT subscription, with no API key and no per-image billing. Use when the user asks for GPT Image 2.5, ChatGPT Images 2.5, or to generate or edit an image through their ChatGPT plan."
---

# GPT Image 2.5

Generate or edit one image through the local Codex CLI and the user's existing ChatGPT subscription. The user must already have a ChatGPT plan with image generation access.

## When to trigger

Use this skill when the user:

- Explicitly names GPT Image 2.5 or ChatGPT Images 2.5.
- Asks to generate or edit an image through their ChatGPT plan.

Do not use this skill for a generic image request that names no route. Do not use it for a request to call the billed `gpt-image-2.5-flare` or `gpt-image-2.5-sunburst` API models.

## Prerequisites

- `codex` on `PATH`.
- `codex login` completed with the ChatGPT option and an eligible ChatGPT plan.
- `python3` on `PATH`.

This skill grants no image-generation entitlement of its own.

## Invoke the runner

Resolve `<skill-dir>` from the directory containing this loaded `SKILL.md`.

Text to image:

```bash
python3 <skill-dir>/scripts/generate.py \
  --prompt "<user's prompt>" \
  --out /absolute/path/to/output.png
```

Single-reference edit:

```bash
python3 <skill-dir>/scripts/generate.py \
  --prompt "<user's prompt>" \
  --ref /absolute/path/to/input.png \
  --out /absolute/path/to/output.png
```

Multi-reference composition:

```bash
python3 <skill-dir>/scripts/generate.py \
  --prompt "<user's prompt>" \
  --ref /absolute/path/to/first.png \
  --ref /absolute/path/to/second.png \
  --out /absolute/path/to/output.png
```

Use `--prompt-file <path>` instead of `--prompt` when the prompt is already in a file. Optional controls are `--timeout-sec <seconds>`, `--force`, `--dry-run`, and `--json-log <path>`.

## Default behavior

- Pass the user's prompt through verbatim. Do not translate it or add style modifiers unless asked.
- When the user names no output path, let the runner create `./image-<YYYYMMDD-HHMMSS>.png` in the current directory.
- After success, display or attach the produced file. Do not stop after printing its path.
- Copy every project deliverable to the requested output path. Never leave it only under `<codex-home>/generated_images`.

## Hard constraints

- Do not substitute DALL-E, another image model, HTML, SVG, or a screenshot.
- Do not rewrite the prompt unless the user asks.
- Do not add or use an API-key route.
- Do not claim a model version that the artifact does not report.

## Model version

The image model served to a ChatGPT subscription session is selected server-side and cannot be selected by the Codex CLI. OpenAI made Images 2.5 available to ChatGPT and Codex accounts on 2026-09-08. Treat the runner's `provenance:` stderr line as the artifact evidence: report its exact value, or say `not reported` when the artifact carries none. Never infer 2.5 from the skill name.

## Exit codes

| Code | Meaning                               |
| ---: | ------------------------------------- |
|    0 | Success                               |
|    2 | Bad arguments                         |
|    3 | `codex` missing                       |
|    4 | Reference image missing or unreadable |
|    5 | `codex exec` or output I/O failed     |
|    6 | Timed out                             |
|    7 | No unambiguous image artifact found   |
|    8 | Output exists without `--force`       |
|    9 | No ChatGPT subscription login         |

## How it works

The runner validates inputs and the ChatGPT login, then calls `codex exec --json` in a read-only sandbox. It sends the unchanged user prompt through stdin and attaches each reference with `-i`. Codex stores the image under `<codex-home>/generated_images/<thread-id>/`.

The runner resolves the artifact in strict order: an exact `<ig-id>.png` from `thread_id` and `image_generation_call` events when both are present, a recent `ig_*.png` or `exec-*.png` in a directory named by its own `thread.started` event, exactly one newly created thread directory, then a valid base64 `result` from its own `image_generation_call`. It refuses to guess when multiple new directories exist. A live codex-cli 0.155.0 run emitted `thread.started`, stored `exec-<id>.png`, and resolved through the `thread-directory` tier. Use the tier named in stderr as the observed mechanism for each invocation.

## Data handling

The script reads only the JSONL event stream from its own `codex exec` process and paths under `<codex-home>/generated_images`. It never reads `auth.json`. It writes the requested output image through a same-directory `.partial` sibling and writes the optional JSONL log only when requested. The only network traffic is the `codex` process talking to OpenAI with the user's existing ChatGPT login.

When the current host already exposes its own subscription-backed image tool, use that tool instead of nesting `codex exec` inside `codex exec`.
