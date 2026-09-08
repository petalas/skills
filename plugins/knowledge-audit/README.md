# knowledge-audit

Audit one project's knowledge system on request: check for a routing table that maps file patterns to docs, a When You Struggle capture process, and a project-specific LEARNINGS.md; report pass or fail, then set the system up or migrate an older layout only with approval. Never runs proactively.

The skill audits the project in the current working directory against a small convention for agent-facing documentation:

- The project's agent instructions file (`AGENTS.md`, or `CLAUDE.md` where that is what the project uses) acts as an index. It carries a **routing table** that maps file-pattern globs to the docs an agent must read before editing those files, ending with a catch-all row that points bug hunts at LEARNINGS.md.
- A **When You Struggle** section tells agents what to do when a fix takes more than one attempt: check existing docs, improve or add an entry, add a routing row, consider code prevention, and prune stale entries nearby. Its quality bar admits only project-specific knowledge or facts that contradict reasonable assumptions, never general programming knowledge.
- A **LEARNINGS.md** (or equivalent) holds those captures in a short Context/Gotcha/Fix format.
- An optional temporary **Active Warnings** section flags cross-cutting concerns such as broken CI until they are resolved.

The audit starts with a two-item quick check and stops early when both pass. Otherwise it runs the full checklist, rates the project as Compliant, Partially compliant, or Not set up, and asks before changing anything. With approval it can set the system up in a new project (analyze the codebase, add the sections from its templates, create `docs/LEARNINGS.md` if nothing equivalent exists) or migrate older layouts (retire `LEARNINGS_ARCHIVE.md`, simplify a verbose Knowledge System section, drop code-breadcrumb layers, keep or remove an ownership table based on doc count, move inline content out of an oversized instructions file).

The skill is on demand only. It never runs on session start or because a project looks unfamiliar, it edits only the local project the user asked about, it never messages anyone, and it never commits.

## Install

Install this skill into the project you want audited, not globally:

```bash
bunx skills@latest add petalas/skills --skill knowledge-audit -y
```

It is deliberately a per-project install. A global install would invite audits in every repository, and the convention it checks is one a project has to opt into. Use `knowledge-migrate-all` when you want a read-only overview of which projects on a machine still need attention.

## Usage

```text
Run $knowledge-audit on this project. Do the quick check first, run the full audit only if it fails, report a pass/fail checklist with an overall rating, and ask before setting up or migrating anything.
```

## Source map

```text
plugins/knowledge-audit/
  .codex-plugin/plugin.json
  commands/knowledge-audit.md
  skills/knowledge-audit/SKILL.md
  skills/knowledge-audit/agents/openai.yaml
```
