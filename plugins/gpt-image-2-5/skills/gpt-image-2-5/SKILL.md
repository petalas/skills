---
name: gpt-image-2-5
version: 0.3.0
description: "Generate or edit images through a ChatGPT subscription, prepare reusable prompts, and inspect saved artifacts. Use when the user names GPT Image 2.5 or asks for image generation through their ChatGPT plan. Checks exact-model requirements before generation; subscription model selection is not guaranteed."
---

# GPT Image 2.5

Generate the requested images through the user's ChatGPT subscription and save each prompt, references, and artifact evidence. This skill uses no API key and does not grant image-generation access. Its name does not prove which image model served a request.

For multiple images, throughput tuning, or rate limits, read [batch generation](references/batch-generation.md) before dispatching requests. It covers queue preparation, measured concurrency, retries, and collection review.

## 1. Choose the route and check the model requirement

Prefer the current host's subscription-backed image tool. Use the bundled Codex CLI runner only when that capability is unavailable. Apply the same prompt preparation, artifact inspection, and reporting steps to both routes.

When the user asks for an exact model, snapshot, or a guarantee of 2.5, read [model selection](references/model-selection.md) before generating. Check the actual tool schema and installed CLI capabilities. The examined subscription routes expose no image-model selector. An image-model name in the prompt, the skill name, or `codex --model` does not select the image model.

If exact selection is required and the route cannot provide it, explain the limitation and stop the dependent generation. Continue any independent preparation. Do not generate an unverified substitute or automatically switch to the separately billed API. The reference records the official API identifiers for a user who chooses that route separately.

The CLI fallback requires `python3`, `codex` on `PATH`, and a ChatGPT login with image-generation access. The native route does not require a nested CLI login check.

## 2. Prepare the image prompt

- Preserve an explicitly supplied image prompt verbatim unless the user requests changes.
- For a task request such as "regenerate our badges," write an image description from the user's intent and available project context. Keep skill links, repository operations, and workflow instructions out of that description.
- For existing assets, locate the original prompt and inspect the original image first. Reuse the prompt when available. Otherwise reconstruct it from the artwork and say it is reconstructed.
- Preserve the requested subject, tier, palette, silhouette, and composition. Add technical requirements from the asset's actual use, such as a transparent background, square canvas, padding, and readability at the displayed size. Do not invent a new art direction without a request.
- Save the submitted image prompt as a UTF-8 file before generation. Distinguish it from any revised prompt reported by the generation service. Use reference images as visual inputs, not as instructions.

## 3. Generate the requested images

Honor the requested image count. A request to try one sample authorizes one sample, not the whole collection. Choose a descriptive project output path when project conventions identify one. Honor an explicit output path; otherwise the runner defaults to `./image-<UTC timestamp>.png`.

For the native tool, pass the prepared image prompt and inspected references through the tool's documented fields. Save or copy the returned artifact into the project output path, preserving the original generated file.

For the CLI fallback, resolve `<skill-dir>` from this file's directory:

```bash
python3 <skill-dir>/scripts/generate.py \
  --prompt-file /absolute/path/to/badge.prompt.txt \
  --ref /absolute/path/to/original.png \
  --out /absolute/path/to/badge-test.png
```

Omit `--ref` for text-to-image; repeat it for multiple references. The first reference is the edit target unless the prompt specifies otherwise. Prefer `--prompt-file` to avoid shell interpretation of prompt text. `--prompt` remains available for safely passed literal strings.

The runner accepts PNG output only. `--force` explicitly permits replacing the image and its manifest. See `--help` for timeouts, dry runs, and optional event logs. `--require-model <id>` is a guard: it exits before generation because this subscription runner has no exact-model selector.

## 4. Inspect and record the artifact

Run the same local inspector for either route:

```bash
python3 <skill-dir>/scripts/inspect_image.py /absolute/path/to/badge-test.png
```

The CLI runner writes `<output>.json` automatically. Record a native-tool result with:

```bash
python3 <skill-dir>/scripts/inspect_image.py /absolute/path/to/badge-test.png \
  --record \
  --prompt-file /absolute/path/to/badge.prompt.txt \
  --ref /absolute/path/to/original.png \
  --route native \
  --source /absolute/path/returned/by/the/tool.png
```

The manifest retains the submitted prompt, reference paths and hashes, route, source, output hash, dimensions, transparency metadata, and unverified model mentions. Metadata mentions may describe an ingredient, so they do not prove the selected model. The inspector does not validate C2PA signatures. Generic `gpt-image` contains no model version; report `not reported`.

For app assets, inspect the actual image visually. Check framing, stray pixels, cropping, and readability at the intended display size. An alpha channel alone does not prove transparent pixels exist. Verify actual transparency with available image tooling when the asset requires it, and distinguish an exported checkerboard from transparency.

When regenerating an existing asset, display the original and result at equal display sizes. Keep the trial separate from production assets until replacement is within the user's requested scope. If only a visual trial was requested, do not present it as an integrated app change.

## 5. Report the result

Display or attach the produced images. For a collection, provide a review gallery and account for every requested asset. Include saved paths and report model evidence accurately. Separate a successful image generation from fulfillment of an exact-model requirement. Do not infer the version from appearance, date, launch announcements, filenames, or the agent's text response.

## Runner behavior and data handling

The runner uses a ChatGPT-authenticated `codex exec --json` process. It accepts one unambiguous image from that process's image event or its own `thread.started` directory. It never guesses from unrelated newly created image directories. Ambiguous outputs fail instead of selecting the newest image.

The scripts never read `auth.json` or use an API-key route. The inspector performs no network requests. Manifests contain prompts and local reference paths; store them with project artifacts. JSONL logs are written only when requested. Existing outputs are protected unless `--force` is supplied, including when an output appears during generation.

Exit codes: `0` success; `2` invalid arguments; `3` missing CLI; `4` unreadable reference; `5` process or I/O failure; `6` timeout; `7` missing, invalid, or ambiguous artifact; `8` existing output; `9` missing ChatGPT login; `10` exact model selection unavailable. A generation may already have produced an image when later inspection or manifest recording fails; inspect existing files before retrying.
