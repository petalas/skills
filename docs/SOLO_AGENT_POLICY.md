# Solo agent policy

The pstack-derived skills in this repository serve one developer. They may use
multiple agents, but they never communicate with another person.

## Internal coordination

Main agents and subagents may:

- create, assign, interrupt, and wait for other agents;
- exchange findings and prompts with other agents;
- use isolated worktrees or branches when the user or repository workflow calls
  for them; and
- combine independent agent results into one local artifact.

Every child prompt inherits this policy. Delegation cannot widen authority.

## External communication

No main agent or subagent may send, post, reply, comment, file, publish, or
otherwise direct a message to another person. This remains forbidden when a
communication service is installed, authenticated, relevant to the task, or
explicitly mentioned in the material under discussion.

When work would normally end with a human-facing message, the agent writes a
local draft or concise handoff for the user. The user sends it manually.

Read-only access is different. An agent may inspect source control, issue
history, documentation, observability, error tracking, and product data that
the user placed in scope. Reading a source does not authorize replying to it or
changing it.

## Repository and Git authority

Agents may inspect Git and make in-scope local edits. Further authority is
specific:

- Create a branch or worktree only when the user or repository workflow calls
  for it.
- Commit only when the user or invoking workflow explicitly authorizes a
  commit, and apply `commit-guidelines`.
- Treat rebase, amend, squash, reset, force operations, push, pull-request
  changes, merge, deploy, issue changes, and review-thread changes as separate
  actions that each require explicit authority.
- External-write authority never overrides the ban on human-directed
  communication.

These rules are defaults for the distributed skills. A repository may narrow
local editing or Git authority further. It cannot silently grant communication
authority to a pstack-derived skill.
