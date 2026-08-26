# Verifier prompt

```text
Verify claim <finding_id> against packet <packet_id> and immutable candidate tree <candidate_tree_oid>.

Claim and requested check: <claim>
Relevant packet slice: <evidence_packet_slice>
Repository and domain rule paths to read: <rule_paths>
Independence reason: <risk_trigger>

Do not edit and do not inspect later worktree changes. Prove or refute the exact failure mode. Return confirmed, refuted, or needs-runtime-check with cited code or runtime evidence, affected responsibility-envelope category, confidence, and the exact next check if access is missing.
```
