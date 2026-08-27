---
name: show-me-your-work
version: 0.1.0
disable-model-invocation: true
description: Keep a local, reviewable TSV decision trail for long-running, unattended, or multi-phase work.
---

# Show me your work

Keep one append-only decision log for work the user will review later. The log must let a cold reader reconstruct what changed, why it changed, what evidence supported it, and what happened next.

## Start the trail

Copy `references/decision-log-template.tsv` to `decisions.tsv` in the work directory. When several runs overlap, use `.audit/<task-slug>.tsv`. Keep the file local unless the user explicitly asks to place it elsewhere.

The columns are:

- `ts`: ISO 8601 timestamp.
- `phase`: phase or workstream.
- `decision`: one concrete choice or checkpoint.
- `why`: the reason in plain words.
- `evidence`: a resolvable path, command output, test result, trace, or screenshot. Use a pointer, not a paragraph.
- `result`: the observed state, such as `tests pass`, `reverted`, `INCONCLUSIVE`, or `open`.

Use `scripts/log.sh <logfile> <phase> <decision> <why> <evidence> <result>` to append a row. The helper writes the header, removes tabs and newlines from cells, and protects spreadsheet readers from formula execution.

## What to log

Log decision points and verification checkpoints. Good rows capture a fork chosen, an experiment kept or reverted, a blocker, a failed gate, or a unit completed with proof. Skip routine commands and self-evident edits.

One row is one decision. If it cannot fit on one line, split the decision. Never rewrite history. Add a later row that supersedes a wrong call.

## Audit the trail

Before handoff, compare every row with the actual run. Use the active conversation transcript when the host exposes one. Otherwise use the command history, changed files, and evidence artifacts available in the workspace.

- Remove invented or aspirational rows.
- Resolve every evidence pointer and confirm it proves the claim.
- Add missing pivots, abandoned approaches, or failed checks that shaped the result.
- Remove padding that does not help the user audit the run.

Ask an independent subagent to inspect the trail and the available run record. The reviewer flags weak evidence, skipped verification, risky choices, and gaps. Subagents may communicate with each other, but no agent may communicate with a person. Agents must not post, send, reply, or comment through any external service. The parent agent owns the final report and presents the findings only to the user in the current conversation.

End the handoff with an `Attention` section. Name the review capability used, then list specific rows or moments that deserve scrutiny. `No flags` is valid.

## Reading the trail

Read it top to bottom and follow the evidence pointers. A row with missing evidence or an unverified result is a surfaced gap, not a pass. In a shell, `column -s$'\t' -t decisions.tsv` renders it as a table.

Other skills should route audit logging here instead of duplicating this format.
