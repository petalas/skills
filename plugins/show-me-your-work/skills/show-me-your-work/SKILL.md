---
name: show-me-your-work
version: 0.4.0
disable-model-invocation: true
description: Keep a local, reviewable TSV decision trail for long-running, unattended, or multi-phase work.
---

# Show me your work

Keep one append-only decision log for work the user will review later.

## Start the trail

For a new log, copy `references/decision-log-template.tsv` to `decisions.tsv` in the work directory. Reuse an existing log without overwriting it. When several runs overlap, use `.audit/<task-slug>.tsv`. Keep the file local unless the user explicitly asks to place it elsewhere.

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

Never rewrite history. Add a later row that supersedes a wrong call.

A run is one agent conversation, including its later turns and any summary of it. A pickup, a replacement agent, or a new chat starts a new run. When a run adds to a log that already has rows, its first row has phase `start`, and so does its first row after another run's `start` row. Read the log's last rows before resuming in a later turn to check whether another run wrote since. A `start` row names the `ts` range of preceding rows this run did not write. Its evidence identifies this run, such as an agent or task id. Use phase `start` for nothing else.

## Audit the trail

Before handoff, compare this run's rows with the actual run. Use the active conversation transcript when the host exposes one. Otherwise use the command history, changed files, and evidence artifacts available in the workspace. Each stretch begins at this run's `start` row, or at the first row if this run created the log, and ends at another run's next `start` row.

- Check that every row maps to a real decision or action.
- Resolve every evidence pointer and confirm it proves the claim.
- Add missing pivots, abandoned approaches, or failed checks that shaped the result.

The audit never edits or removes a row, even an invented one. Correct a false claim or unresolved evidence by appending a row that supersedes it with what happened and a resolvable pointer. The audit does not check other runs' stretches. If this run's work proves an earlier row wrong, supersede it like any wrong call.

Ask an independent subagent to inspect the trail and the available run record. The reviewer flags weak evidence, skipped verification, risky choices, and gaps. Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. Agents must not post, send, reply, or comment through any external service. The parent agent owns the final report and presents the findings only to the user in the current conversation. When `engineering-mode` is installed, match each subagent's reasoning profile to the job by its Delegation rule; otherwise use the configured profile.

End the handoff with an `Attention` section. Name the review capability used, then list specific rows or moments that deserve scrutiny. `No flags` is valid.

## Reading the trail

Read it top to bottom and follow the evidence pointers. In a shell, `column -s$'\t' -t decisions.tsv` renders it as a table.

Other skills should route audit logging here instead of duplicating this format.
