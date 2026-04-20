# $fix-all-issues

Review the target pull request or current branch in parallel and fix the accepted findings until validation, cleanup, and a fresh re-review are all clean. Default mode is **quality-first** (exhaustive); pass `review_mode=quick` for the leaner prior pipeline.

## Arguments

- `pr`: PR URL or number. If omitted, use the current branch against `main`.
- `num_agents`: Ceiling on parallel background agents. Optional. Default `8` (exhaustive) or `5` (quick).
- `max_rounds`: Maximum review/fix rounds before stopping. Optional. Default `8` (exhaustive) or `5` (quick).
- `review_mode`: `exhaustive` (default) or `quick`. Treat legacy `normal` as `quick`.

## Workflow

1. Use the `fix-all-issues` skill.
2. Treat this command as explicit approval to spawn subagents and parallel worker batches.
3. Repository `AGENTS.md`, `CLAUDE.md`, local docs, and user instructions override the skill's default tool, validation, and git preferences.
4. Resolve the target PR or current branch. Flag unusual base branches (`dev`, release, integration). In exhaustive mode, audit `main..<base>` drift and inject the load-bearing notes into reviewer prompts.
5. Build a per-repo conformance checklist by scanning `CLAUDE.md`, `AGENTS.md`, formatter/linter config, and style docs. Inject the checklist into every reviewer prompt.
6. Budget thread capacity. Reserve slots for the verification pass, fix workers, cleanup workers, and the final cold reviewer. Scale reviewer fanout to PR size (4 small, 6 medium, up to 8 large/multi-subsystem in exhaustive; capped at 4 in quick).
7. Run one independent review batch using lens reviewers plus (exhaustive only) red-team, coverage, and conformance reviewers. Every reviewer tags each finding `verified ✓` or `speculative ⚠` and lists categories considered-but-ruled-out.
8. Run a verification subagent on every `⚠` finding before triage. Refuted findings are dropped; needs-runtime-check findings enter triage as defer candidates.
9. Triage. Accept verified findings with concrete failure modes. Apply the scope-expansion rule: never silently land behavior/UX/analytics changes the PR body did not promise. In exhaustive mode, spawn an independent second triager with only the merged findings list and the base diff; investigate every disagreement.
10. Spawn fix workers per disjoint file batch. Workers must produce failing-test-first then green evidence for any bug fix, run autofix on owned files, and report `considered-but-not-changed` items.
11. Validate: autofix → targeted tests → strict lint → full test suite → typecheck/build. In exhaustive mode, also exercise the changed feature live (boot dev server / hit endpoint / run the CLI). If live exercise is impossible, log it in the residual-risk report rather than silently skipping.
12. In exhaustive mode, run a dedicated cleanup round (no behavior changes) for dead code, conformance violations, comment/doc rot, and adjacent missing tests. Re-validate.
13. Run a narrow re-review (1–2 reviewers on the final diff). In exhaustive mode, also run a "would I block this PR?" cold reviewer with no prior context — any blocker re-enters bug-fix triage.
14. Keep frequent overall progress visible: round counter, reviewer/verifier/fixer/cleanup completion, validation status. Use structured phase tracking when the client supports it; concise textual counters otherwise.
15. Repeat until bug-fix re-review is zero, cleanup yields zero edits, the cold reviewer has no blockers, and validation is clean — or `max_rounds` is hit (then summarize residuals).
16. Before pushing, fold review fixes into the existing PR description sections (do not append a separate "Additional fixes" block — it goes stale on squash). Always fetch the existing PR body before editing.
17. Default to a normal commit and regular push. Rewrite history only when the user asked or repo workflow requires it. After any rewrite, rerun the full validation suite against the new tip.

## Output

One-paragraph summary: PR/branch, mode, round count, validation result, push status, base-branch note. Findings ledger table (`id | status | severity | verified | note`). Validation block including live-exercise outcome. In exhaustive mode, a residual-risk inventory of what was NOT checked, the cleanup-round summary, and a follow-up PR list of `scope-expansion` deferrals.
