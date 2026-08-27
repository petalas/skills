# principle-guard-the-context-window

Apply when context is filling up: large outputs, long files, repeated reads, fan-out planning. Route bulk to subagents; keep summaries in the main thread, not raw payloads.

## Install

```bash
bunx skills@latest add petalas/skills --skill principle-guard-the-context-window -g -y
```

## Usage

```text
Use $principle-guard-the-context-window for this task.
```

This plugin adapts material from pstack. The installed skill includes the full upstream notice and exact provenance.
