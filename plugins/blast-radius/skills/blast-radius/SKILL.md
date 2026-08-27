---
name: blast-radius
version: 0.1.0
disable-model-invocation: true
description: "Find what a change could break outside its diff, identify the safety facts it depends on, and prove those facts with executable evidence when practical."
---

# Blast radius

Find what a change could break somewhere else. Caller lists are an input, not the result. Look for contracts, timing, formats, persisted data, generated code, and downstream assumptions that textual search misses.

The default output is a read-only risk assessment. Local throwaway probes and tests are allowed when the user's requested scope authorizes local edits. Do not mutate remote state, open or update issues, change pull requests, submit reviews, or send findings to anyone.

For a wide change, use `arena` when installed or independent read-only subagents to inspect distinct failure surfaces. Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. If `arena` or delegation is unavailable, define the failure surfaces up front, inspect each sequentially, compare the results, and state the limitation.

Model preferences are optional. Read repository-documented model configuration or `.agents/agent-models.md` when present, and map roles only to models the current host confirms are available. Otherwise omit model selection and inherit the parent or host defaults. Never require the file or hard-code unconfirmed model identifiers.

## Evidence ladder

For each safety fact, get as far down this ladder as practical and report where it stopped:

1. hypothesis only;
2. supported by an exact source location;
3. failure path traced and shown unreachable;
4. exercised by a focused script or test against the real code;
5. reproduced in the running artifact.

Do not describe a fact as settled below level 4 unless the higher level is impractical and the remaining uncertainty is explicit.

## Steps

1. **Read the change.** Inspect the requested diff, changed symbols, surrounding code, and local repository history. Use `why` when installed and historical intent is material. Without it, inspect read-only git history, tests, comments, and available runtime evidence directly, separating sourced intent from inference.
2. **State the behavioral delta.** Explain what now behaves differently, including effects not obvious from the diff.
3. **Find the load-bearing safety facts.** Most changes depend on one or two propositions. Name them precisely before producing a long risk list.
4. **Look beyond symbol search.** Check pinned dependency behavior, local patches, lifecycle timing, concurrency, wire formats, persisted data, generated artifacts, feature flags, other languages or services reading the same data, and callers several hops downstream.
5. **Rank confirmed risks.** For each, give the reachable failure path, exact evidence, likelihood, impact, and cheapest check. Separate cleared hypotheses from remaining risks.
6. **Prove the safety facts.** Prefer the smallest focused executable check that imports and exercises the real shipped code. Keep any probe local. Do not claim production certainty from a mocked proxy.

When installed, `code-review` remains authoritative for standards/spec review and `fix-all-issues` remains authoritative for exhaustive remediation. Without them, this skill still completes its scoped risk probe but does not expand into those broader workflows. It does not authorize changes merely because it found a risk.

## Output

- **Behavioral delta**
- **Load-bearing safety facts**, each with evidence level and proof
- **Confirmed risks**
- **Cleared hypotheses**
- **Unproven assumptions**
- **Cheapest next verification**

Write through `unslop` when installed. Otherwise make the same concise evidence-first report locally. Return findings only in the current task.
