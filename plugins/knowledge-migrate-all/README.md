# knowledge-migrate-all

Scan a chosen directory tree for projects with agent instructions files, run the knowledge-audit quick check on each, and report which are current, need an update, or need setup. Read-only discovery across projects; it never edits any project without a separate explicit instruction.

The skill is the machine-wide companion to `knowledge-audit`. Where that skill audits and can fix one project, this one only answers the question "which of my projects still need attention?":

- It asks which directory trees to scan (or uses the ones named in the request) instead of assuming a fixed location, and it never scans the whole home directory by default.
- Under each root it finds version-controlled project roots that contain an agent instructions file (`AGENTS.md`, or `CLAUDE.md` where that is what the project uses), skipping dependency and build directories.
- For each project it runs the same two quick checks as `knowledge-audit`: a "Required Reading" routing table mapping file patterns to docs, and a "When You Struggle" capture process. It also flags cheap-to-detect legacy artifacts such as `LEARNINGS_ARCHIVE.md`.
- It reports a status table (Current, Needs update, Setup needed), the `knowledge-audit` action that applies to each project, and summary counts.

It changes nothing. Fixing a project means running `knowledge-audit` inside that project, where edits go through an explicit approval step. The skill never messages anyone and never commits.

## Install

Install this skill into the project you use as your working directory for machine-wide maintenance, not globally:

```bash
bunx skills@latest add petalas/skills --skill knowledge-migrate-all -y
```

It is deliberately a per-project install. It is an occasional maintenance task, not something every repository should advertise to its agents. Pair it with `knowledge-audit` installed in the projects you intend to fix.

## Usage

```text
Run $knowledge-migrate-all. Ask me which directory trees to scan, find every project with an agent instructions file under them, run the knowledge system quick check on each, and report a status table without editing anything.
```

## Source map

```text
plugins/knowledge-migrate-all/
  .codex-plugin/plugin.json
  commands/knowledge-migrate-all.md
  skills/knowledge-migrate-all/SKILL.md
  skills/knowledge-migrate-all/agents/openai.yaml
```
