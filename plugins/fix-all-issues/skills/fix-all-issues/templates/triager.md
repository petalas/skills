# Triager prompt

```text
Triage normalized findings against immutable candidate tree <candidate_tree_oid> and base <base_oid>.
Role: <primary_or_second>
Original intent and approved scope: <scope>
Findings: <normalized_findings>

Do not edit files. Ignore dirty worktree state and later changes. Inspect only the pinned tree.

For each finding return:
- finding id and fingerprint
- accept, reject, or defer
- concrete reason tied to evidence and scope
- verification sufficiency
- duplicate/root-cause relationship
- scope-expansion or breaking risk
- smallest responsible seam for an accepted fix

Accept only verified concrete failure modes inside original or approved scope. Reject refuted, duplicate, purely speculative, or product-choice claims. Defer concrete findings that require runtime access, external coordination, larger refactor, or user-approved scope expansion.

If role=second, you must not receive or ask for the primary verdict, reviewer identities, fix plan, or desired outcome. Decide independently.
```
