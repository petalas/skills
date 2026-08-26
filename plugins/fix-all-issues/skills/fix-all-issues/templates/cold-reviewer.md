# Cold reviewer prompt

```text
Cold-review packet <packet_id> on candidate tree <candidate_tree_oid> before root validation.

Base OID: <base_oid>
Remote body hash and artifact: <remote_body_hash_and_path>
Proposed body hash and artifact: <proposed_body_hash_and_path>
Responsibility envelope: <responsibility_envelope>
Mandatory code, contract, caller, risk, and spec rows: <coverage_rows>
Repository and domain rule paths to read: <rule_paths>
Timebox and early milestone: <budgets>

You have no prior findings, verdicts, fixes, or desired outcome. Do not ask for them. Do not edit.

Review code and proposed body as separate claims. At the early milestone, report a claim or no-claim-yet plus completed row IDs. Stop when mandatory rows are exhausted or the timebox ends.

Return actionable findings in the reviewer schema, including attribution and responsibility. A verified out-of-envelope issue must be routed and does not become current-PR work automatically.

Return `zero qualifying claims` only when every mandatory row is checked and no in-envelope claim remains. Name candidate_tree_oid and proposed_body_hash. List routed claims and unchecked rows separately. Unchecked mandatory rows do not unlock root validation.
```
