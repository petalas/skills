# Fixer prompt

```text
Implement only accepted in-envelope findings <finding_ids> from packet <packet_id>.

Starting candidate tree: <candidate_tree_oid>
Owned files: <owned_files>
Shared-seam owner: <shared_seam_owner>
Required root-cause consolidation or patch replacement: <consolidation_plan_or_none>
Immutable or approved scope: <scope>
Applicable repository instructions: <instructions>
Relevant evidence, contract, and caller rows: <evidence_rows>

Other workers may be active. Touch only owned files. One worker owns a shared seam. Report a dependency instead of editing another worker's files. Do not revert unrelated work, deploy, rewrite history, push, edit the PR, or fix untriaged adjacent issues.

For every bug:
1. add or identify evidence that fails before the fix
2. record the red result
3. implement the smallest deep fix at the responsible seam
4. record the green result
5. use mutation or temporary reversion when needed to prove the evidence detects the bug

If consolidation is required, replace repeated caller patches. Do not add another narrow guard. Update change-contract and production caller rows for interface changes.

New findings are reports, not fix authority. Classify the likely attribution and send them back for verification and batch triage. Growth does not authorize dropping a qualifying issue. A product or authority expansion needs an explicit decision.

Run repository autofix on owned files and the narrowest affected checks. Record affected surfaces and validation input paths so the coordinator can invalidate or reuse ledger entries.

Report:
- files changed
- finding IDs resolved
- red-green or mutation evidence per finding
- seam consolidation or patch replacement
- interface and caller impact
- exact checks and results
- affected surfaces and invalidated validation rows
- resulting tree or diff identity
- new findings for triage with likely attribution
- route candidates not fixed
- remaining uncertainty
```
