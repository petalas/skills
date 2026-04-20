# Fix All Issues

`fix-all-issues` is a quality-first review-and-remediation skill for pull requests and active branches.

It is designed for workflows where the agent should:

- fan out independent review passes in parallel (lens + red-team + coverage + conformance)
- verify every speculative finding against the actual code before triage
- triage with an independent second agent so the main agent does not rubber-stamp itself
- fix accepted findings with delegated workers that produce failing-test-first then green evidence
- run a dedicated cleanup round after bug fixes are green
- validate with autofix + lint + tests + typecheck **and** a live feature exercise
- run a "would I block this PR?" cold reviewer on the final diff
- report a residual-risk inventory of what was NOT checked

## Example Prompts

```text
Use $fix-all-issues on this PR
Use $fix-all-issues pr=123
Review my current branch against main and fix every issue you find
Use $fix-all-issues pr=123 review_mode=quick
Use $fix-all-issues pr=123 num_agents=8 max_rounds=8
```

## Modes

- `exhaustive` (default): full quality pipeline. Defaults to `num_agents=8`, `max_rounds=8`. Adds red-team / coverage / conformance reviewer lenses, per-finding verification gate, independent second triager, mutation-style fix evidence, dedicated cleanup round, live-feature validation, cold final reviewer, residual-risk inventory.
- `quick`: leaner prior pipeline. Defaults to `num_agents=5`, `max_rounds=5`. 4 lens reviewers, no second triager, no red-team or coverage agent, no separate cleanup round, lint/test/typecheck only for validation.

## Source Map

```text
plugins/fix-all-issues/
  .codex-plugin/plugin.json
  commands/fix-all-issues.md
  skills/fix-all-issues/SKILL.md
  skills/fix-all-issues/agents/openai.yaml
```

## Notes

- repository instructions (`CLAUDE.md`, `AGENTS.md`) override the skill's defaults
- the skill auto-extracts a per-repo conformance checklist before reviewer fanout and injects it into every reviewer prompt
- every reviewer finding is tagged `verified ✓` or `speculative ⚠`; the verification pass refutes or upgrades each `⚠` before triage
- reviewer count scales with PR size (4 small, 6 medium, up to 8 large/multi-subsystem in exhaustive; capped at 4 in quick)
- validation runs autofix before strict lint and tests, so the canonical pass always runs against already-formatted code
- exhaustive mode requires live-feature exercise where applicable (boot dev server, hit endpoint, run CLI); skips are logged in the residual-risk report
- the cleanup round runs separately from bug-fix rounds and forbids behavior changes
- the scope-expansion rule prevents the skill from silently landing behavior, UX, or analytics changes the PR body did not promise — it confirms with the user or defers as a follow-up
- after any history rewrite (squash, amend, force-push-with-lease) the skill reruns the full validation suite against the new tip
- when editing a PR body via `gh`, the skill always fetches the existing body first instead of clobbering
- review fixes are folded into existing PR-body sections, not appended as "Additional fixes" blocks (which go stale on squash)
- use `$fix-all-issues` consistently in prompts and examples
- see [../../LEARNINGS.md](../../LEARNINGS.md) for design notes including the v0.5.0 quality-first revision rationale
