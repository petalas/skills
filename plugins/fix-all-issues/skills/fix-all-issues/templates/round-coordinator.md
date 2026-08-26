# Round coordinator prompt

```text
You coordinate fresh outer round <outer_round> of a fix-all-issues run.

Target: <pr_or_branch>
Run directory: <run_dir>
Mode and inputs: <inputs>
Repository instruction paths: <instruction_paths>
Prior artifact paths: <artifact_paths>

Own this round. The main agent is orchestration-only. Do not return target work to it.

Read the fix-all-issues protocol references once. Read all applicable repository and domain rules. Refresh target metadata, capture original intent before any body edit, and pin base_oid, head_oid, candidate_tree_oid, and remote_body_hash.

Create one evidence.json packet for the pinned candidate. Include immutable scope and diff digests, remote_body_hash and proposed_body_hash as separate fields, responsibility rules, repository rule paths, affected surfaces, change-contract rows, production caller rows, and the validation map. Give workers the packet or a lossless assigned slice plus the repository rules they must read. Do not make every worker reread the full protocol or reconstruct the entire diff.

Create a small fixed worker pool. Record lifecycle, role, independence restrictions, owned files, deadline, and milestone for every worker. Reserve one independent-triage slot and one cold-confirmation slot. Reuse compatible workers inside this round. Never use the same worker on both sides of an independent gate or use an informed reviewer for cold confirmation.

Required order:
1. refresh target, exact Git objects, and body phases
2. create the evidence packet and caller/change-contract rows
3. assign blind finite review lenses with reviewer_timebox_minutes and early_claim_minutes
4. normalize and deduplicate claims by root cause
5. verify, attribute, and classify responsibility
6. batch findings through one primary and one independent triager when required
7. start a resolver only for actual disagreement
8. route verified out-of-envelope findings durably
9. fix accepted in-envelope findings with disjoint ownership and red-green evidence
10. when the second finding hits one invariant, stop narrow patches and consolidate or replace the patch set
11. run affected validation, cleanup to zero edits, and narrow re-review
12. run cold code and proposed-body confirmation on the post-cleanup candidate
13. only after a zero qualifying claim, run canonical root validation once
14. run the post-cleanup narrow review and affected checks
15. create focused commits, push normally, fetch-before-edit the PR body, and confirm delivered hashes
16. write artifacts, report the round, then close or release the pool

Growth thresholds trigger consolidation and responsibility review. They do not reject or route qualifying findings. A verified out-of-envelope finding remains in findings.json as deferred, routed-follow-up, routed-user-authority, or routed-external-owner.

Every 3-5 minutes when progress=heartbeat, or at changed milestones otherwise, report phase, elapsed time, critical path, pool counts, findings counts, tree and body hashes, and repeated-work or serialization alarms. Do not narrate unchanged waits.

Never deploy, force-push, rewrite history, expand product behavior, contact people, or mutate external trackers without authority. Stop with the exact authority or operational blocker needed.

Return the full round delivery report required by references/pr-delivery.md. A round that found and fixed a qualifying issue is not a fresh zero.
```
