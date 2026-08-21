# Commit guidelines

`commit-guidelines` tells coding agents how to create focused Git commits in Nick Petalas's preferred style.

It requires agents to:

- inspect repository instructions, worktree state, staged content, and recent commit subjects
- keep unrelated files and hunks out of the commit
- run repository-required checks without bypassing hooks
- write Conventional Commit messages with useful types and scopes
- use the existing human Git identity
- never name an AI model, agent, assistant, bot, vendor, or tool as an author or co-author
- avoid amending, rewriting history, or pushing without separate permission

## Agent invocation

The skill sets `disable-model-invocation: false`, so agents can load it automatically whenever they are about to create, amend, squash, or propose a commit or commit message. Loading the skill does not grant permission to perform Git operations.

Direct `$commit-guidelines` invocation authorizes one normal local commit. It does not authorize history rewrites or a push.

## Example prompts

```text
Use $commit-guidelines to commit the current intended changes.
Create a focused Conventional Commit for this work with no AI co-author attribution.
Use $commit-guidelines to propose a commit message for the staged diff.
Commit these changes without staging unrelated work or rewriting history.
```

## Message examples

```text
feat(auth): add passkey sign-in
fix(api): reject expired refresh tokens
refactor(cache): centralize eviction policy
docs(commit-guidelines): document commit attribution rules
```

## Source map

```text
plugins/commit-guidelines/
  .codex-plugin/plugin.json
  commands/commit-guidelines.md
  skills/commit-guidelines/SKILL.md
  skills/commit-guidelines/agents/openai.yaml
```
