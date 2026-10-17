# Verify the real result

A green build proves that the code passed a build. It does not prove that the changed behavior works. [`principle-prove-it-works`](../../plugins/principle-prove-it-works/README.md) requires evidence from the real artifact before an agent reports success.

Verification is the slowest step in most agent work, because it is the step that usually waits on you. Make the agent able to do it, and you stop being the bottleneck. Skip it, and running more agents only gets you more unchecked work to review.

## Make done executable

```text
Add JSON output. Done means the text form is byte-identical, the JSON parses, and both commands run successfully against the sample project. Show the commands and the relevant output.
```

Match the check to the change:

- Run a CLI change through the real command.
- Drive a UI change through the changed flow in the running app. When it must match a reference pixel for pixel, the visual parity playbook in `engineering-mode` diffs screenshots against a frozen baseline instead of judging by eye.
- Replay a saved input through a parser or migration.
- Compare before and after profiles for a performance change.
- Read back the written value for a storage change.

Report a check that could not run as inconclusive. Do not replace it with a confident proxy.

Ask for the proof as an artifact you can inspect yourself: the failing test and then the passing one, a before-and-after recording, the trace, or the screenshot. An artifact beats a plausible explanation, because you can challenge it without replaying the whole run.

## Check what the diff could break

Use [`blast-radius`](../../plugins/blast-radius/README.md) when a small edit relies on a fact outside its own files:

```text
Use blast-radius on this diff. Identify its load-bearing safety claim and prove that claim by running the narrowest executable checks.
```

This is especially useful after renames, shared type changes, parser edits, and compatibility removals.

## Vet a measured number with `benchmark-checklist`

A before-and-after number is the easiest evidence to get wrong by accident. A warm cache, a debug build on one side, or work that never ran inside the timed region can each produce a convincing speedup. Before you report or act on a number, ask:

```text
Use benchmark-checklist to vet the export speedup before I rely on it.
```

[`benchmark-checklist`](../../plugins/benchmark-checklist/README.md) asks seven questions and wants evidence from a run for each:

1. What limits the number, and why is it not double?
2. Did every side run tuned the way production runs?
3. Does the result break a physical limit, like disk bandwidth or core count?
4. Did anything error or return wrong output?
5. Does it reproduce over alternating runs, with a median and a range?
6. Does it matter end to end, on the path a user waits on?
7. Did the work actually happen inside the timed region?

The verdict comes back as faster, slower, no measurable difference, or inconclusive, with the run count, range, and limiter. It says inconclusive when it cannot name the limiter or a side ran untuned. `engineering-mode` already applies the checklist inside its perf issue and hillclimb playbooks, so ask for it yourself when you measured something outside them, or when a number looks too good. It is the working form of [`principle-explain-the-number`](../../plugins/principle-explain-the-number/README.md).

## Create a reusable app driver

If agents repeatedly need to drive an app, use [`create-verification-skill`](../../plugins/create-verification-skill/README.md). It inspects the repository, chooses an available local driver, writes exact launch and cleanup steps, maps features to evidence, and proves one flow before handing over the skill.

Of everything in this guide, a verification skill pays off the most. An agent that can check its own work keeps going until the check passes. An agent that cannot hands every result back to you to check by hand.

From then on, "verify it in the app" is a step any agent can run in this repository. Name the skill in the prompt when you want the proof in a specific form:

```text
Use engineering-mode. Build the bulk-archive action. Use the project's verify skill to check your changes, and show me a recording and screenshots as proof.
```

Once it works, [`swarm`](../../plugins/swarm/README.md) can split a full pass by feature-map entry and aggregate the results. A swarm of verifiers can also confirm a performance win over a large enough sample, or exercise the app for regressions before you hand off a change.

Treat the verification skill as infrastructure, not a one-off. Keep it in the repository so every agent drives the app the same way. Then apply [`principle-build-the-lever`](../../plugins/principle-build-the-lever/README.md). When agents keep writing throwaway scripts to click through the app, ask for a small control CLI that the skill calls instead. Agents spend fewer tokens, and every run becomes repeatable. A CLI that agents use well has these traits:

- A few composable commands, each doing real work, rather than many thin ones.
- A `--dry-run` option on anything destructive.
- Subcommands that reveal features gradually instead of all at once.
- Error messages that say what to do instead.
- Rich `--help` text.
- Machine-readable output, such as JSON.

Make the dev setup repeatable too: seeded data, local test users, and one command that brings the environment up the same way every time.

Use [`maintain-verification-skill`](../../plugins/maintain-verification-skill/README.md) when the app or feature map changes. It compares the skill with source, drives mapped features, and confines documentation fixes to the verification skill. A product regression remains a reported regression.

Apps change and feature maps rot, so run it regularly. If the host offers a scheduler, you can run it on a schedule, for example once a day. A scheduled run follows the same rules: it keeps its report local for you and sends no notification or message.

Verification drivers must use local fixtures, fake accounts, or local sinks. They must not send email, chat, notifications, review comments, or other human-directed messages. The ban applies even when a real account is signed in.

## Hand back evidence, not ceremony

A useful verification report contains:

- the exact check;
- the result;
- the artifact or output that proves it;
- the checks that could not run; and
- the remaining risk.

Leave remote publication and communication to the user. The agent can prepare a local summary or draft, but it does not post it.

Next: [Run long work safely](./06-long-running-work.md).
