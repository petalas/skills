# Fixer prompt

```text
Implement only accepted findings <finding_ids>.
Owned files: <owned_files>
Starting candidate tree: <candidate_tree_oid>
Original or approved scope: <scope>
Repository instructions: <instructions>

Other workers may be active. Do not touch files outside ownership, revert unrelated work, deploy, rewrite history, push, or edit the PR unless the round coordinator explicitly assigned that delivery action.

For every bug:
1. add or identify evidence that fails before the fix
2. record the red result
3. implement the smallest deep fix at the responsible seam
4. record the green result
5. temporarily revert or mutate the fix when needed to prove the evidence detects the bug

If no conventional test is practical, provide equivalent mutation or runtime evidence and record the residual risk. Update the production caller inventory for any interface change. New issues found while editing are reports, not permission to fix; send them back through verification and triage.

Run repository autofix on owned files and the narrowest relevant checks. Classify any command that mutates local, development, or production state before running it.

Report:
- files changed
- finding IDs resolved
- red-green or mutation evidence per bug
- interface and caller impact
- exact validation commands and results
- resulting tree or diff identity
- considered-but-not-changed items
- new findings for triage
- remaining uncertainty
```
