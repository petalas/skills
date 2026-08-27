# Issue tracker evidence

This playbook uses Linear as an example of a user-scoped issue tracker. Apply the same read-only method to any tracker capability the host exposes.

## What to inspect

- issues linked from commits or repository change records;
- issue descriptions and immutable history;
- parent or related issues that define scope;
- attached specifications and acceptance criteria;
- status changes that line up with implementation dates.

## Method

1. Start with exact issue identifiers found in repository history.
2. Search the target symbol, feature name, error text, and likely historical names.
3. Bound searches around the relevant commit dates when the result set is large.
4. Read each relevant issue in full, including its history and linked artifacts.
5. Follow related issues only when the relationship bears on the question.
6. Record exact issue identifiers, titles, dates, short excerpts, and stable read-only links.

Treat boilerplate rationale, stale scope, and mechanical labels cautiously. Cross-check claims against the code that shipped and the repository timeline.

Never create, edit, assign, label, comment on, close, or otherwise update an issue. Never use the tracker to contact a person. If read-only access is unavailable, record the gap and continue.
