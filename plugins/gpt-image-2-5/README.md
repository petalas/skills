# gpt-image-2-5

Generate and edit images through your ChatGPT subscription. The skill prepares reusable image prompts, keeps reference images, and records the output and model evidence beside each PNG.

## Model selection

The subscription-backed native tool and examined Codex CLI do not expose an image-model selector. This skill cannot guarantee that their output used 2.5. It stops before generation when an exact model is required and cannot be selected.

OpenAI documents pinned API snapshots `gpt-image-2.5-sunburst-2026-09-08` and `gpt-image-2.5-flare-2026-09-08`. Those belong to the separately billed API, which this skill does not call. See [model selection and official sources](skills/gpt-image-2-5/references/model-selection.md).

## Install or update

```bash
bunx skills@latest add petalas/skills --skill gpt-image-2-5 -g -y
# Refresh only this global skill after an update:
bunx skills@latest update gpt-image-2-5 -g -y
```

Restart an existing agent session to reload changed skill instructions.

## Usage

Ask to generate or edit an image through your ChatGPT plan, or invoke `gpt-image-2-5`. Supply an exact image prompt when you have one. For a request such as "regenerate one badge," the skill locates the original prompt or reconstructs it from the artwork and saves the prepared prompt.

It prefers the host's native subscription-backed image tool. The CLI fallback requires `python3` and `codex` logged in through ChatGPT, plus image-generation access on your plan. There is no API-key fallback or additional entitlement supplied by the skill.

The runner writes a PNG and a `.png.json` manifest containing the prompt, reference hashes, dimensions, route, and unverified metadata. Native-tool results use the same inspector and manifest format. PNG metadata is evidence to inspect, not a model-selection control or a verified C2PA signature.

For collections, the skill prepares a queue and measures completed images per minute before increasing concurrency. It records request timings and rate-limit responses, coordinates retries, and checks every saved asset. See [batch generation](skills/gpt-image-2-5/references/batch-generation.md) for the procedure and measured results. This guidance does not add a batch scheduler to the CLI runner.

## Version 0.3.0

- Adds collection generation with measured concurrency, shared rate-limit backoff, and resumable artifact records.
- Records observed request serialization and distinguishes the fastest tested setup from a service limit.
- Covers decoded alpha, low-opacity edge pixels, approximate padding, and collection review.
- Keeps the existing model-selection checks and one-sample limit. Installation and runner defaults are unchanged.

## Version 0.2.0

- Separates task requests from explicit image prompts and preserves reproducible generation records.
- Documents exact API model identifiers and the subscription route's selection limit.
- Inspects native and CLI outputs consistently and compares replacement artwork at equal display sizes.
- Rejects ambiguous artifacts, protects existing outputs, and restricts the runner to PNG.
- Adds local regression tests to the repository checks.

## Development checks

```bash
bun run test:gpt-image-2-5
bun run check
```

The tests use local fixtures and a fake generation boundary; they do not consume image quota. The [implementation notes](skills/gpt-image-2-5/references/implementation.md) record resource limits and verification boundaries.
