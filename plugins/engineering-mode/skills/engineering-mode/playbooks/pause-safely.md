# Pause safely

Use when the user explicitly asks to pause or when the host is about to compact the session.

1. Finish the current atomic edit or restore it to a known valid state. Start nothing new.
2. Stop or wait for internal subagents. Record any result that has not yet been applied.
3. Run the smallest check that states whether the local tree is currently usable.
4. Write a resume note outside volatile conversation context. Include intent, progress, verified state, changed files, next action, blockers, and evidence paths.
5. Point to an existing `show-me-your-work` trail instead of duplicating it.

Do not create version control history or perform remote actions merely to pause. Return the on-disk state, verification status, resume-note path, and first action on resume.
