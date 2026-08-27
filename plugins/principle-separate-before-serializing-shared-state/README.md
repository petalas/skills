# principle-separate-before-serializing-shared-state

Apply when concurrent actors might write to the same file, branch, key, or state object. Eliminate the sharing first; serialize structurally only when one shared writer is a real invariant.

## Install

```bash
bunx skills@latest add petalas/skills --skill principle-separate-before-serializing-shared-state -g -y
```

## Usage

```text
Use $principle-separate-before-serializing-shared-state for this task.
```

This plugin adapts material from pstack. The installed skill includes the full upstream notice and exact provenance.
