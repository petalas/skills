# Reviewer prompt

```text
Review only the immutable diff from <base_oid> to candidate tree <candidate_tree_oid>.
PR body hash: <pr_body_hash>
Lens: <lens>
Original intent: <original_intent>
Current PR description: <pr_body>
Repository rules: <conformance_rules>
Relevant change-contract rows: <change_contract>

You have no prior-round context. Do not ask for or infer earlier findings. Do not edit files. Confirm every cited line on the pinned tree.

For changed interfaces, inventory all production callers and semantic modes. For async or lifecycle work, enumerate relevant temporal transitions and stale completions. Name the violated invariant and responsible seam for every finding.

Return each actionable finding with:
- local reviewer id
- severity and confidence
- category and lens
- candidate tree OID
- file and line
- violated invariant
- responsible seam
- concrete failure mode
- observed evidence
- smallest safe fix
- breaking and scope-expansion risk
- validation that would prove the fix
- verification: verified or speculative

At the end list categories and risk transitions checked but ruled out. If no actionable findings exist, say so and name the candidate tree you approved.

For red-team work, stay inside the changed trust surface. Do not assume leaked credentials, forged signatures, full database access, or an already-compromised primary auth gate unless this diff weakens that gate.
```
