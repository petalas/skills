---
name: explain-code
version: 0.1.0
disable-model-invocation: true
description: "Explain code plainly by combining how it works with the evidence for why it has that shape. Use for teaching a change, subsystem, or unfamiliar code path."
---

# Explain code

Explain what a body of code is, how it works, and why it has its current shape. The goal is understanding, not modification.

Use `how` for mechanics and `why` for evidence-backed rationale when those skills are installed. Those skills own their investigations; do not redo them by hand when they are available. When the host can run them concurrently, do so. Subagents may communicate with each other, but no agent may communicate with a person. Any child prompt must repeat that sentence verbatim and forbid external messages, posts, comments, and review actions. If concurrent skill execution is unavailable, run the smallest relevant investigation sequentially.

Model preferences are optional. Read repository-documented model configuration or `.agents/agent-models.md` when present, and map roles only to models the current host confirms are available. Otherwise omit model selection and inherit the parent or host defaults. Never require the file or hard-code unconfirmed model identifiers.

If `how` is unavailable, trace the entry point, call chain, data flow, boundaries, and relevant types directly, then cite exact files and symbols. If `why` is unavailable, inspect read-only git history, tests, code comments, and available local or user-scoped evidence; separate direct rationale from inference and name gaps. These local paths are complete fallbacks, not reasons to stop.

1. Infer why the user is asking: preparing to change the code, reviewing it, debugging it, or onboarding. Use that to choose the few ideas they need first.
2. Read enough code to orient the request, then invoke whichever of `how` and `why` are installed and relevant. Use the complete local fallbacks above for any missing skill. A small local mechanism may need only the mechanics pass. A subsystem or historical design question usually needs both mechanics and rationale. Keep the rationale sweep scoped unless historical motivation is the main question.
3. Start with a one- or two-sentence plain definition. Then layer in the runtime flow, the evidence-backed reasons, and the edge cases. Preserve `why`'s confidence language.
4. Reference concrete files and symbols. Show a small code excerpt or diagram only when it makes the mechanism easier to understand.
5. For a system with three or more moving parts, build a visual incrementally when a visual materially helps. Add one concept per step instead of presenting one crowded diagram.
6. Stop at the smallest complete explanation. Offer deeper threads only after the main account is clear.

Write through the `unslop` skill when installed. Otherwise use plain spoken English, cut filler, keep one name per concept, and avoid lecture scaffolding, quizzes, and function-by-function inventories.

Return the explanation itself, not a report about the investigation.
