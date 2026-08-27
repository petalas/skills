# Worktree cleanup

Use for local disk reclamation involving git worktrees or development caches.

1. Invoke the standalone `worktree-cleanup` skill when installed. Otherwise continue with this complete local fallback.
2. Derive candidates from `git worktree list --porcelain`. Inventory tracked, untracked, and ignored entries with `git status --ignored --short --untracked-files=all` in every worktree.
3. Hold any worktree with tracked or untracked changes, an active process, ambiguous ownership, unrecoverable detached work, or ignored credentials and application state. Other ignored files require an exact user decision.
4. Show exact paths and ignored-file evidence. Obtain the required deletion authority before removal.
5. Re-run the ignored-file and process checks immediately before removing an authorized path without force.
6. Verify the worktree list and free space afterward.

Return removed paths, held paths and reasons, and space before and after.
