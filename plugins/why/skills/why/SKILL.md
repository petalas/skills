---
name: why
version: 0.1.0
disable-model-invocation: true
description: "Investigate why code has its current shape using read-only repository history, issue tracking, user-scoped documents, observability, error tracking, and product data."
---

# Why

Investigate the motivation and constraints behind code. Use `how` for runtime mechanics; use this skill for rationale, tradeoffs, regressions, defensive checks, thresholds, and historical intent.

This is a read-only investigation. Agents may inspect repository state, version-control history, local documentation, and user-authorized observability or analytics sources. They must never create or edit an issue, change a pull request, reply to a review, send a message, post a comment, or mutate an external system. Keep findings and drafts local to the task.

When subagents are available, assign one evidence lane to each investigator. Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. If delegation is unavailable, run the same lanes sequentially and identify any lane the host could not inspect.

Model preferences are optional. Read repository-documented model configuration or `.agents/agent-models.md` when present, and map roles only to models the current host confirms are available. Otherwise omit model selection and inherit the parent or host defaults. Never require the file or hard-code unconfirmed model identifiers.

## Investigative posture

- Collect evidence before choosing a narrative.
- Cite claims about intent to a commit, local document, code comment, test, runtime event, or other exact source.
- Mark inferences as inferences. Use confident language only for direct evidence.
- Surface contradictions and missing records.
- Treat an empty search as evidence only when the searched scope is explicit.
- Do not infer motivation from the current code shape alone.

Read [`references/epistemics.md`](references/epistemics.md) before synthesis.

## 1. Frame the target

Identify the code, behavior, or decision being investigated and the precise question. If the referent is ambiguous, state the best interpretation and continue.

## 2. Establish a code anchor

Gather:

- relevant paths, line ranges, and symbols;
- recent commits touching the target;
- blame for the most relevant lines;
- rename-aware file history and patches;
- references in commit messages to local documents or repository-hosted discussions.

Useful read-only commands include:

```bash
git blame -L <start>,<end> <file>
git log --follow -p -- <file>
git log --oneline -20 -- <file>
git show <commit>
```

If a repository CLI can read a linked change or discussion without mutating it, that read is allowed. Never use commands that comment, approve, assign, label, close, merge, or otherwise update remote state.

## 3. Cover the available evidence lanes

Discover capabilities at runtime. Do not rely on a particular connector name or host filesystem layout. Search every relevant available lane in parallel when possible:

1. **Repository archaeology:** commits, diffs, tests, code comments, and read-only change discussions. Always run this lane. Use [`references/sources/code-archaeology.md`](references/sources/code-archaeology.md).
2. **Issue tracking:** read-only repository issues or a user-scoped tracker. Inspect only issues, history, and links already placed in scope; never create, edit, assign, label, comment on, or close anything. Use [`references/sources/linear.md`](references/sources/linear.md) as a host-neutral example.
3. **Documents:** local ADRs, RFCs, product notes, and postmortems, plus user-scoped external documents the user has authorized. Use [`references/sources/notion.md`](references/sources/notion.md) as a host-neutral example. Do not search workplace chat, shared correspondence, or other people's private spaces.
4. **Infrastructure observability:** read-only metrics, logs, traces, dashboards, monitors, and incident records that the user has placed in scope. Use [`references/sources/datadog.md`](references/sources/datadog.md) as a vendor-specific example when relevant.
5. **Error tracking:** read-only issues, events, stack traces, and release correlations. Use [`references/sources/sentry.md`](references/sources/sentry.md) when relevant.
6. **Product analytics:** read-only event or warehouse data. Use [`references/sources/databricks.md`](references/sources/databricks.md) when relevant.

For defensive code, add the cross-cutting checks in [`references/sources/incident-postmortem.md`](references/sources/incident-postmortem.md).

Skip an unavailable or irrelevant lane explicitly. Never add workplace chat, other people's correspondence, private notebooks, or cross-workspace transcript searches as evidence lanes, even when those tools are available and authenticated.

Build each delegated investigation from [`references/investigator-prompt.md`](references/investigator-prompt.md). Give it one lane, the code anchor, and the original question. Read-only capability is a behavioral requirement even when the host cannot enforce it as a sandbox.

## 4. Follow leads once

After the first pass, route concrete cross-lane leads to the appropriate investigator or inspect them locally. Do one focused follow-up wave, not an unbounded search. Record inaccessible or missing sources as gaps.

## 5. Synthesize

Use [`references/synthesizer-prompt.md`](references/synthesizer-prompt.md). Separate:

- directly supported conclusions;
- evidence-supported inferences;
- competing hypotheses;
- contradictions;
- unresolved gaps.

For each conclusion, cite the precise source and state the confidence level from the epistemics guide. Do not turn correlation into causation.

## Output

Return:

- **Answer:** the best supported explanation in a few sentences.
- **Evidence:** the source trail behind each material claim.
- **Alternatives and contradictions:** plausible competing accounts and contrary evidence.
- **Confidence:** high, medium, or low, with a reason.
- **Coverage and gaps:** lanes searched, null results, skipped lanes, and unavailable evidence.

Do not publish the report anywhere. Return it only in the current task.
