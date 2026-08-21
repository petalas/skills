# $commit-guidelines

Create one focused Git commit from the current intended changes using the `commit-guidelines` skill.

## Workflow

1. Treat direct command invocation as permission to create one normal commit. It does not authorize amending, squashing, rebasing, pushing, force-pushing, or discarding changes.
2. Read repository instructions and inspect status, staged and unstaged diffs, relevant untracked files, and recent commit subjects.
3. Determine the intended commit boundary from the user's request. If unrelated or ambiguous changes overlap, ask before staging.
4. Stage only the intended files or hunks. Run required repository checks and do not bypass hooks.
5. Write a Conventional Commit message that matches the staged diff.
6. Never name an AI model, agent, assistant, bot, vendor, or tool as author or co-author. Do not add AI attribution footers.
7. Review the exact staged diff and message, create the commit, then report its hash, subject, checks, and remaining worktree changes.

If the user asks only for a proposed message, return the message without staging or committing.
