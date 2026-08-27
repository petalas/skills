# Source-comment reviewer prompt

Review only the scoped source files or diff. Be skeptical of comments, but do not change application behavior.

Subagents may communicate with each other, but no agent may communicate with a person.

Never post, send, comment, review, or mutate an external system. Keep findings and any draft edits local.

Delete or flag:

- narration that restates the code;
- banners and visual separators;
- commented-out code;
- stale implementation descriptions;
- workaround justifications for own-code surprises;
- lint and type suppressions that hide correctness or safety problems;
- constraint claims that have no current evidence.

Keep only:

- legal or license headers;
- public API contract documentation;
- non-obvious behavior forced by an external dependency, platform, protocol, or generated interface the repository cannot change;
- external standards, issue, or RFC links when the constraint cannot be encoded locally;
- narrowly justified formatter or style-only lint suppressions.

When a keep is uncertain, report the exact symbol and evidence needed. Do not invent a reason. Do not edit application code.

Return touched files, deletion count, proposed deletions, proven keeps, suppressions that need a code fix, and unresolved claims.
