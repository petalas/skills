---
name: arena
version: 0.1.0
disable-model-invocation: true
description: "Generate several independent candidates for the same non-trivial artifact, judge them against a concrete rubric, and synthesize one verified result."
---

# Arena

Produce several independent attempts at the same artifact, select the strongest base, and deliberately graft useful ideas from the others into one coherent result.

Arena never grants authority beyond the caller's task. Candidate agents may make only the local changes the user already authorized. They must never publish, push, comment, review, message, or mutate an external system. Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt.

Model preferences are optional. Read repository-documented model configuration or `.agents/agent-models.md` when present, and map roles only to models the current host confirms are available. Otherwise omit model selection and inherit the parent or host defaults. Never require the file or hard-code unconfirmed model identifiers.

If the host cannot run parallel subagents, produce the candidate attempts sequentially in isolated local paths. If isolation is also unavailable, keep candidates as clearly separated drafts and do not let one candidate see another before it is complete.

## 1. Frame

State:

- the exact artifact each candidate must produce;
- the shared grounding and scope;
- three to six concrete, gradeable criteria;
- the number of candidates;
- the selection rule: first passing result, rank all, or best overall.

Use host-available general workers without fixed model names. Diversity can come from different available models, reasoning settings, or explicitly different solution directions. The prompt and rubric remain identical unless different directions are the declared experiment.

Give every candidate an isolated task-specific temporary directory or artifact path by default. Use a worktree only when the user or repository workflow calls for one. Never allow concurrent writers to share mutable output.

## 2. Generate

Launch all candidates concurrently when possible. Every brief must stand alone and include the task, grounding, output path, verification requirement, and this skill's communication prohibition.

Each candidate returns the artifact and a short rationale naming alternatives considered and rejected. If one drops out, continue when enough candidates remain to compare and record the gap.

## 3. Cross-judge

After every candidate has finished writing, ask one independent read-only judge to score all candidates against the rubric, or perform a separate judgment pass locally. Do not let the judge edit candidates.

## 4. Pick

Read every candidate end to end. Score criterion by criterion. Prefer the base a future maintainer can extend without violating its invariants. When the judge and lead disagree, resolve the disagreement from evidence rather than averaging scores.

Stop when the remaining difference is a subjective preference owned by the user, such as visual taste, product voice, workflow feel, or an unrecorded scope tradeoff. Present the viable options and evidence in the current task and ask the user to choose. Do not let agent votes, model diversity, or the cross-judge settle a preference that only the user can own.

## 5. Graft

Inspect each losing candidate for one or two ideas worth adapting. Integrate those ideas by hand so the result retains one mental model. Record what was borrowed and what was rejected.

If candidates converge, record the agreement and keep the simplest coherent shape. If they diverge because the brief was underspecified, refine the rubric and rerun instead of blending incompatible designs.

## 6. Verify

Run the checks appropriate to the synthesized artifact. A candidate report is not proof; inspect the actual output. When verification fails, decide whether the frame was wrong or a useful candidate idea was missed, then revisit that phase.

Return one synthesized local artifact and a compact synthesis note. Do not publish either one.
