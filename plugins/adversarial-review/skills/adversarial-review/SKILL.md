---
name: adversarial-review
version: 0.1.0
disable-model-invocation: true
description: "Run independent read-only reviewers against the same code and intent, then apply lead judgment to surface high-confidence blind spots without changing the code."
---

# Adversarial review

Stress-test code with independent reviewers, then synthesize their findings into a pragmatic verdict. The deliverable is analysis, not automatic remediation.

This skill is read-only. Reviewers may inspect the scoped diff, surrounding repository code, tests, and local history. They must never edit code, submit a review, post a comment, change a pull request, create an issue, or message anyone. Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. Keep all findings and drafts local.

Model preferences are optional. Read repository-documented model configuration or `.agents/agent-models.md` when present, and map roles only to models the current host confirms are available. Otherwise omit model selection and inherit the parent or host defaults. Never require the file or hard-code unconfirmed model identifiers.

`code-review` remains authoritative for standards and specification review. `fix-all-issues` remains authoritative for bounded exhaustive review and remediation. Use this skill only as an additional independent-opinion pass; it must not weaken their scope, evidence, attribution, exact-tree, or authorization rules.

If the host cannot create multiple subagents, perform two explicitly separate review passes with different lenses, then disclose the lack of independent workers.

## 1. Determine scope

Use the files, diff, or fixed comparison point named by the user. Otherwise use the smallest diff implied by current context. Include surrounding code needed to trace reachable paths, and record the exact repository state reviewed.

## 2. State intent

Write one paragraph describing what the code is meant to accomplish. Derive it from the user's request, local spec, commit history, and code. If uncertainty would materially change the verdict, ask the user; otherwise state the assumption.

## 3. Run independent reviewers

Launch two or more available general review subagents concurrently. Do not require fixed model names or host-specific task fields. Use read-only isolation when the host supports it.

Give every reviewer the same:

1. intent;
2. exact diff or files;
3. [`references/reviewer-prompt.md`](references/reviewer-prompt.md);
4. [`references/rubric.md`](references/rubric.md);
5. [`references/code-quality-review.md`](references/code-quality-review.md).

Reviewers may explore surrounding code to prove reachability. They return structured findings with exact locations and evidence. Empty reviews are valid.

## 4. Synthesize

Deduplicate common root causes. Treat agreement as a confidence signal, not a vote. Preserve useful lone-reviewer findings, explicit disagreements, and reviewers that lacked necessary context.

## 5. Apply lead judgment

Use [`references/lead-judgment.md`](references/lead-judgment.md). Classify each finding:

- **Act on:** demonstrated correctness, security, or material maintainability issues.
- **Consider:** legitimate concerns with uncertain tradeoffs.
- **Noted:** valid but low-priority observations.
- **Dismissed:** wrong, unreachable, preference-only, or missing known context.

For every finding, name the reviewers that raised it, the category, the exact evidence, and the reason for the judgment.

## Output

Return the reviewed intent and repository state, reviewer coverage, categorized findings, and an agreement map. Do not apply fixes or publish the verdict.
