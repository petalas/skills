# Model selection

Checked against official documentation and Codex CLI 0.155.0 on 2026-09-19. Recheck the installed tool schema and current official documentation when they change. Availability in a product and the ability to pin an individual request are separate facts.

## Documented API identifiers

| Purpose           | Model alias              | Pinned snapshot                     |
| ----------------- | ------------------------ | ----------------------------------- |
| Precise editing   | `gpt-image-2.5-sunburst` | `gpt-image-2.5-sunburst-2026-09-08` |
| Faster generation | `gpt-image-2.5-flare`    | `gpt-image-2.5-flare-2026-09-08`    |

The [Sunburst model page](https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst) and [Flare model page](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare) document these aliases and snapshots. They do not list bare `gpt-image-2.5` as an API model identifier.

For an explicitly chosen API workflow, the Images API accepts the snapshot in its `model` field. The Responses API accepts the image model in the `model` field of its `image_generation` tool; its top-level `model` is the language model. See the [image generation guide](https://developers.openai.com/api/docs/guides/image-generation) and [Responses image tool guide](https://developers.openai.com/api/docs/guides/tools-image-generation).

This skill does not execute those API routes. Pinning an API snapshot does not prove a subscription tool accepts the same parameter, and a ChatGPT login is not an API key.

## Examined subscription routes

The current native image tool exposes a prompt and reference-image arguments, with no model argument. Local `codex exec --help` describes `--model` as selecting the agent. It is not an image-tool model selector.

The official source matching the installed CLI, [Codex 0.155.0](https://github.com/openai/codex/blob/f0a1b8f0849d90960bc406b848f32e5a129b0457/codex-rs/ext/image-generation/src/tool.rs#L58), sets its image request model to `gpt-image-2`. Its strict argument structure has no image-model override. The [specific product documentation](https://learn.chatgpt.com/docs/image-generation) also names `gpt-image-2` for built-in generation.

The [September 8 launch announcement](https://openai.com/index/introducing-chatgpt-images-2-5/) says Images 2.5 is available in Codex. That broader availability statement does not resolve the discrepancy with the integration docs and released client source. Server routing is not established by those client-side facts. Do not conclude that a particular output used either 2.0 or 2.5 from the client slug alone.

## Decision rule

1. If the actual subscription tool later exposes a documented image-model selector, use only supported values and record the selected value separately from reported output evidence.
2. If the user requires a guaranteed version or snapshot and the current route cannot select it, stop the dependent generation and explain the route limitation. Do independent prompt or asset preparation without consuming another image request.
3. For ordinary subscription generation, record that selection was not pinned. Inspect the output's metadata and report missing version information as `not reported`.

The inspector reports literal model mentions from PNG metadata without claiming a verified C2PA signature or identifying the active manifest. Those mentions can belong to source images. A regex match, generic `gpt-image`, or a language-model self-report cannot establish an exact model guarantee.
