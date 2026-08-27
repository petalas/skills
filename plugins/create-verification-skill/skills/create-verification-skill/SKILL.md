---
name: create-verification-skill
version: 0.2.0
disable-model-invocation: true
description: Create a project-local skill that drives an app through its real user surface and captures proof.
---

# Create a verification skill

Create a project-local skill that launches the real app, drives one user path, records evidence, and cleans up its own state. Tailor it to the repository. Do not leave placeholders.

Subagents may communicate with each other, but no agent may communicate with a person. Repeat that sentence verbatim in every child prompt. Put the same exact sentence in the generated `SKILL.md` and in every child-agent or drive prompt the generated skill creates. The generated skill must forbid agents from sending messages, invitations, email, notifications, comments, replies, or published content to real people. Verify communication features only against isolated local sinks, fake accounts, fixtures, intercepted transports, or disposable test services that cannot reach a person. If no such target exists, mark the path unreachable and stop before the action.

## 1. Interview the repository

Answer these from source and documentation. Ask the user only for facts the workspace cannot reveal.

- What does a user touch: web UI, mobile app, desktop app, CLI, service, or library?
- How does the app start locally? Record the exact command, readiness signal, ports, environment, data, and authentication needs.
- What existing harness can drive it? Prefer repository-owned browser tests, PTY helpers, HTTP clients, mobile automation, or debug interfaces.
- What proof can the run capture? Use screenshots, accessibility snapshots, terminal transcripts, response bodies, logs, exit codes, or stored state.
- Can concurrent runs isolate ports, profiles, and data directories? If not, tell the generated skill to refuse a shared instance.

If the checkout does not start, fix the local baseline only when that is within the user's request. Otherwise report the blocker instead of writing instructions against a broken app.

## 2. Choose a host-neutral location

Inspect repository instructions and the active skill catalog. Use the repository's documented project-local skill root. If none exists, use `.agents/skills/verify-<app>/`. Do not assume a specific editor or agent host.

Write `SKILL.md` with `name`, `description`, and the host's required frontmatter. Include these sections:

- `Launch`: exact start command, readiness check, and teardown.
- `Doctor`: one read-only check that confirms the instance, build, port, data, and authentication are safe to drive.
- `Drive`: real selectors, prompts, routes, or commands from this repository.
- `Evidence`: artifacts that prove both the action and resulting state. Check side effects through a second read-only view.
- `Cleanup`: stop only processes started by the run and remove only its scratch state. Keep proof artifacts.
- `Helpers`: every shipped helper is executable and documented by an exact invocation.

Never kill by process name. Track process IDs, sessions, containers, or handles created by the run.

Every `Drive` recipe must name its safe target. A recipe that exercises messaging, invitations, email, notifications, comments, replies, or publishing must include a preflight assertion that the target is fake or local and cannot deliver to a person. Never use a signed-in production account as a convenient verification target.

## 3. Seed the feature map

Create `features/README.md` and one file for each of the top three to five user-facing features. Use `references/feature-map-example/` as the shape. Each feature file contains these H2 sections in order:

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it with <harness>`
4. `Gotchas`

Cover every user entry point the repository exposes. Do not claim one path verifies another skipped path.

## 4. Prove the generated skill

Run the generated instructions end to end:

1. Launch the app.
2. Run the doctor check.
3. Drive one mapped feature through a real user path against an isolated fake or local target.
4. Capture the named evidence.
5. Clean up.
6. Confirm the evidence still exists.

Clean up after every failed attempt. A generated skill that has never completed this loop is a draft.

## 5. Hand off maintenance

Point the user to `maintain-verification-skill` for periodic source and live checks. Do not create a schedule unless the user asks for one.
