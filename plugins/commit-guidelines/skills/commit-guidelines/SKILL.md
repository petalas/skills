---
name: commit-guidelines
version: 0.1.0
disable-model-invocation: false
description: Create focused Git commits in the user's preferred style. Use whenever an agent is about to create, amend, squash, or propose a commit or commit message. Require Conventional Commits, inspect the exact diff, preserve unrelated work, run repository checks, and never attribute authorship or co-authorship to an AI model, agent, assistant, bot, vendor, or tool.
---

# Commit guidelines

Apply these rules before creating, amending, squashing, or proposing a Git commit. Loading this skill does not itself grant permission to commit, amend, rewrite history, or push.

## Read the repository first

1. Read the applicable `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, and commit or release documentation.
2. Inspect `git status --short`, the unstaged diff, the staged diff, and relevant untracked files.
3. Inspect recent commit subjects with `git log -5 --format=%s` to learn local scope and wording conventions.
4. Identify which changes belong to the current task. If ownership is ambiguous or the worktree contains overlapping user changes, ask before staging or committing.

Repository rules may narrow the allowed types, scopes, validation, or commit boundaries. Keep the Conventional Commit format unless a higher-priority instruction explicitly requires another format. The ban on AI authorship and co-authorship always applies.

## Keep the commit focused

- Put one coherent change in each commit.
- Stage only files and hunks that belong to that change. Do not sweep unrelated work into the commit.
- Prefer explicit paths or patch staging when the worktree contains unrelated changes. Do not use `git add -A` as a shortcut in a mixed worktree.
- Never discard, reset, overwrite, or reformat unrelated changes to make the commit cleaner.
- Run repository-required formatting, tests, lint, typecheck, build, or generated-file checks before committing.
- Do not bypass hooks with `--no-verify` unless the user explicitly directs it and accepts the failed check.

## Write a Conventional Commit

Use this shape:

```text
type(scope)!: description

optional body

optional footer
```

Rules:

- Choose the type that describes the commit's primary purpose: `feat`, `fix`, `refactor`, `chore`, `perf`, `docs`, `style`, `test`, `build`, `ci`, `revert`, or `release`. Use a repository-specific allowed type when its instructions are stricter.
- Add a short scope when it helps locate the change. Follow repository scope conventions. Omit it when the change is genuinely cross-cutting or no useful scope exists.
- Write the description in imperative, present-tense language. Start lowercase, omit the final period, and keep the subject under 72 characters when practical.
- Describe the change, not the work session. Avoid subjects such as `update files`, `address feedback`, or `misc fixes`.
- Use the body only when the reason, tradeoff, migration, or non-obvious behavior needs explanation. Wrap it according to repository convention.
- Mark a breaking change with `!` and add a `BREAKING CHANGE:` footer that states what callers must change.
- Add issue references only when they are known. Never invent an issue number.

Examples:

```text
feat(auth): add passkey sign-in
fix(api): reject expired refresh tokens
refactor(cache): centralize eviction policy
docs(commit-guidelines): document commit attribution rules
```

## Never attribute a commit to AI

- Use the human's existing Git author configuration. Never set an AI model, agent, assistant, bot, vendor, or tool as the author or committer.
- Never add a `Co-Authored-By` footer for AI, including Claude, Anthropic, Codex, OpenAI, ChatGPT, Copilot, Gemini, or the agent executing the task.
- Do not add equivalent AI attribution such as `Generated-By`, `Assisted-By`, or prose claiming AI authorship.
- Add a human `Co-Authored-By` footer only when the user requests it or repository policy requires it.
- When amending or squashing, inspect the full resulting message and remove any existing AI authorship or co-authorship attribution from that resulting commit.

## Verify and commit

1. Review `git diff --cached --stat`, `git diff --cached`, and `git diff --cached --check` before committing.
2. Confirm the staged diff contains the whole intended change and no unrelated edits, secrets, generated junk, or debug artifacts.
3. Re-read the exact commit message. Confirm its type, scope, subject, body, and footers match the staged diff and contain no AI attribution.
4. Create the commit only when the user or calling workflow authorized it.
5. Do not amend, squash, reset, rebase, force-push, or push unless separately authorized.
6. After committing, report the commit hash and subject, checks run, and remaining worktree changes. Do not claim the worktree is clean without checking it.
