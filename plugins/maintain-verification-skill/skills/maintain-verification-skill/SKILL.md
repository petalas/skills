---
name: maintain-verification-skill
version: 0.2.0
disable-model-invocation: true
description: Audit a project verification skill against source and every mapped user-facing feature, then apply proven local corrections.
---

# Maintain a verification skill

Keep a project-local verification skill and its feature map honest. Cover every feature from source and exercise every reachable feature through the live app.

Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. Subagents stay read-only. No agent may post, send, reply, or comment through an external service.

## Outcomes

Report one outcome:

- `clean`: every feature received source and live coverage, with no useful correction.
- `changed`: local verification docs, harness code, or feature-map files contain proven corrections.
- `blocked`: coverage could not finish. Name the exact blocker and the unverified features.

## Edit boundary

Edit only the verification skill's directory. Do not edit product code. If the map describes behavior the app no longer has, classify it as documentation drift or a product regression. Fix documentation drift locally. Report product regressions without changing product code.

## Pass

1. Locate the project-local verification skill by its launch, doctor, drive, and feature-map sections. If several match, ask the user which one to maintain. If none match, route to `create-verification-skill`.
2. Reconcile the feature index with its sibling files. Fix missing, extra, duplicate, and dead entries.
3. Spawn one read-only source-review subagent per feature file. Run them concurrently when capacity permits. Each returns a feature summary, source entry points, likely drift with citations, and one live recipe. They do not drive the app or edit files.
4. Verify every returned claim that would cause an edit. Search recent source changes for user-facing features missing from the map. Require a concrete source path before adding one.
5. Drive the live app. The coordinator owns all interaction. Use one health-checked long-lived instance for servers and UIs, or a fresh isolated session for each short-lived CLI run, as the verification skill specifies.
6. Hold three invariants. Run the doctor check before the first drive and after surprises. Keep captured evidence through cleanup. Remove residue as soon as a drive no longer needs it.
7. Classify findings. Fix wrong user-facing descriptions and harness gaps inside the edit boundary. Report broken product behavior as a product gap. Re-drive every harness correction before accepting it.
8. Tear down the run after the last re-proof. Confirm that evidence remains. Run the repository's validator for every changed skill file when available.

Keep concise run notes in scratch storage. Record features covered, unreachable prerequisites, confirmed drift, and the outcome. Do not place these notes in version control unless the user asks.

## Handoff

Report the outcome, source coverage, live coverage, files changed, proof artifacts, unreachable features, and product gaps. Do not commit, push, open review requests, or mutate issue trackers as part of this skill.
