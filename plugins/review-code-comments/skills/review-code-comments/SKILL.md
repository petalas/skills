---
name: review-code-comments
version: 0.1.0
disable-model-invocation: true
description: "Review source-code comments for noise, stale explanations, suppressions, and constraints that should be encoded in code, then apply only authorized local cleanups."
---

# Review code comments

Review comments in the scoped code with a skeptical independent pass. Remove narration, stale explanations, commented-out code, workaround sermons, and suppressions that hide fixable problems. Preserve comments that carry information code cannot express.

This skill concerns comments in source files. It never reads or writes human review threads, issue comments, chat messages, or other correspondence. It must never post findings or contact anyone.

Use a host-available general subagent with [`references/reviewer-prompt.md`](references/reviewer-prompt.md) rather than a named custom agent. Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. If delegation is unavailable, run the same prompt as a separate local review pass before editing.

Model preferences are optional. Read repository-documented model configuration or `.agents/agent-models.md` when present, and map roles only to models the current host confirms are available. Otherwise omit model selection and inherit the parent or host defaults. Never require the file or hard-code unconfirmed model identifiers.

## Scope and authority

Use the files or diff named by the caller. Otherwise use the smallest current diff implied by context. Local comment edits are allowed only when the user's request authorizes changes. When installed, `safe-refactor` is authoritative for broader behavior-preserving restructuring and `fix-all-issues` is authoritative for exhaustive review and remediation. Without them, keep this skill inside comment cleanup and small obvious encodings; report any broader work as a local follow-up instead of expanding scope.

## Keep only proven exceptions

Keep:

- legal and license headers;
- public API documentation that defines a contract;
- non-obvious behavior forced by an external dependency, platform, protocol, or generated interface the repository cannot reshape;
- issue, RFC, or standards links when the constraint cannot be encoded locally;
- narrowly justified formatter or style-only lint suppressions.

Treat correctness and safety suppressions as actionable. Look up the rule and determine whether the code can satisfy it. Treat `IMPORTANT`, `do not remove`, and long justifications as claims that need evidence, not automatic keep markers.

## Steps

1. Run the independent comment review. The reviewer may delete comments in an isolated local copy or report proposed deletions, but it must not change application behavior.
2. Inspect every deletion and flag. Restore anything covered by a proven exception. Reject invented constraints, scope escapes, application-code edits, and deletions that remove a public contract.
3. Use `how`, `why`, or both when installed and a constraint claim is ambiguous. Without them, trace the symbol, callers, tests, git history, and relevant dependency or protocol source directly. Only read-only evidence may justify the keep.
4. Delete accepted comment noise. For an own-code surprise, prefer a small rename, type, test, or extraction that makes the comment unnecessary when that fix is clearly in scope.
5. If the required structural fix is non-trivial, stop and hand it to `safe-refactor` when installed. Otherwise write a bounded local refactor proposal with the behavior to preserve, compatibility constraints, and validation seam; do not smuggle the refactor into comment cleanup.
6. Run the narrow relevant formatter, linter, typecheck, and tests. Inspect the final diff.

## Output

Report files reviewed, comments removed, comments restored with evidence, suppressions fixed or left open, local code encodings applied, delegated refactors, validation, and unresolved constraints. Keep the report local to the current task.
