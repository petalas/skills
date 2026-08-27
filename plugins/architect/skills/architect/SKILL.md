---
name: architect
version: 0.1.0
disable-model-invocation: true
description: "Design non-trivial code from caller usage, types, signatures, and module boundaries before implementation, then implement against the chosen sketch when the request authorizes it."
---

# Architect

Design before implementing. Start from caller usage, sketch types and module boundaries, compare structurally different candidates, and then implement only when the user's request includes implementation.

When installed, `codebase-design` is authoritative for deep-module vocabulary, interface depth, and design tests. Invoke it during grounding and synthesis. Without it, apply the bundled local tests: prefer a small interface that hides meaningful policy, keep representations private, align modules with owned knowledge, reject pass-through layers, and minimize the number of files needed to trace a flow. This skill is an execution workflow, not a competing design doctrine. When installed, use `safe-refactor` instead for a principally behavior-preserving structural change; without it, explicitly pin behavior, compatibility constraints, and verification before restructuring.

When candidates or critics are delegated, Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. All child agents keep artifacts local and may not send, post, comment, review, or mutate external systems. If subagents are unavailable, produce two independent local sketches before comparing them.

Model preferences are optional. Read repository-documented model configuration or `.agents/agent-models.md` when present, and map roles only to models the current host confirms are available. Otherwise omit model selection and inherit the parent or host defaults. Never require the file or hard-code unconfirmed model identifiers.

## 1. Ground

Run `how` over the relevant subsystem when installed. Otherwise trace entry points, call chains, data flow, boundaries, types, and failure paths directly. Use `why` when installed and existing ownership, compatibility, or historical constraints matter. Otherwise inspect read-only git history, local docs, tests, comments, and available runtime evidence, keeping inference separate from sourced intent. Read repository instructions and the smallest relevant tests and contracts.

Skip only for genuinely greenfield work with no surrounding system.

## 2. Sketch from usage

Use `arena` when installed to produce at least two structurally distinct candidates. Without it, create two independent candidates concurrently with available subagents or sequentially when delegation is unavailable, keeping each in an isolated local artifact path and hiding completed candidates from unfinished ones. Give each candidate [`references/runner-prompt.md`](references/runner-prompt.md) and the grounding evidence.

Each candidate follows [`references/rationale-template.md`](references/rationale-template.md):

1. caller-facing usage and realistic call sites;
2. core data types and invariants;
3. public signatures;
4. module map and ownership;
5. data and error flow;
6. tradeoffs and rejected alternatives.

Screen candidates with [`references/design-red-flags.md`](references/design-red-flags.md) and `codebase-design` when installed. Without it, use the bundled deep-module tests above. Reject shallow wrappers, leaked representations, temporal decomposition, and pass-through layers. Prefer the design that hides more policy behind the smaller coherent interface.

## 3. Decide

Synthesize one design package. Record the base, borrowed ideas, rejections, and verification plan. Pause before implementation only when the user asks for a checkpoint or when a required choice would materially change scope or compatibility.

For extra design pressure, use `adversarial-review` when installed. Without it, run a separate read-only pass over correctness, boundary leakage, interface depth, failure modes, and verification gaps. Do not use a review request, public comment, or external discussion as a checkpoint.

## 4. Implement when authorized

If the invocation asks for implementation, replace sketch bodies with working code, run focused checks regularly, and validate the real artifact. Do not commit unless the user or invoking workflow explicitly requires it. When installed, `commit-guidelines` is the sole commit authority; without it, inspect the exact diff, preserve unrelated work, run repository checks, and use the repository's documented commit format. Never push or open a pull request. Prepare only a local draft and handoff for the user. Do not mutate remote state.

Treat deviations as evidence. Revisit the sketch when implementation repeatedly needs parameters, branches, casts, or shared-state coordination that the design did not anticipate.

## 5. Scrap a wrong shape

Redesign when the same workaround appears in multiple places, unrelated edge cases need the same special branch, callers must know internal policy, or types need repeated escape hatches.

Re-run `how` when installed, or repeat the local grounding trace, fold the discovered constraints into the grounding, subtract unnecessary surface area, and return to the sketch phase. Do not preserve a bad design merely because code has already been written.

## Output

Produce one local design package with caller usage, types, signatures, module map, rationale, synthesis decision, and verification plan. If implementation was requested, also produce the validated local implementation. Keep drafts and findings local.
