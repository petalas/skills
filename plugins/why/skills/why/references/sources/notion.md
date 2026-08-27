# Document evidence

This playbook uses Notion as an example of user-scoped external documents. Apply the same read-only method to local docs or any document capability the host exposes.

## What to inspect

- ADRs, RFCs, and design notes;
- product or technical specifications;
- personal project notes the user has placed in scope;
- incident reviews and migration plans;
- explicit alternatives, constraints, and decision records.

## Method

1. Search the exact feature name, symbol, error text, commit reference, and historical aliases.
2. Open likely documents and read the full relevant section, not only the title or preview.
3. Check version dates and whether the document describes a proposal or the final shipped shape.
4. Follow links only within the user's authorized document scope.
5. Record the title, section, date, short excerpt, and stable read-only location.

A document may describe an abandoned plan. Cross-check it against repository history and current behavior before treating it as rationale for the shipped code.

Never create, edit, share, comment on, or publish a document. Never search workplace chat, shared correspondence, or another person's private space. If read-only access is unavailable, record the gap and continue.
