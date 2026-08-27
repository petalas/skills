# Verify the real result

A green build proves that the code passed a build. It does not prove that the changed behavior works. [`principle-prove-it-works`](../../plugins/principle-prove-it-works/README.md) requires evidence from the real artifact before an agent reports success.

## Make done executable

```text
Add JSON output. Done means the text form is byte-identical, the JSON parses, and both commands run successfully against the sample project. Show the commands and the relevant output.
```

Match the check to the change:

- Run a CLI change through the real command.
- Drive a UI change through the changed flow in the running app.
- Replay a saved input through a parser or migration.
- Compare before and after profiles for a performance change.
- Read back the written value for a storage change.

Report a check that could not run as inconclusive. Do not replace it with a confident proxy.

## Check what the diff could break

Use [`blast-radius`](../../plugins/blast-radius/README.md) when a small edit relies on a fact outside its own files:

```text
Use blast-radius on this diff. Identify its load-bearing safety claim and prove that claim by running the narrowest executable checks.
```

This is especially useful after renames, shared type changes, parser edits, and compatibility removals.

## Create a reusable app driver

If agents repeatedly need to drive an app, use [`create-verification-skill`](../../plugins/create-verification-skill/README.md). It inspects the repository, chooses an available local driver, writes exact launch and cleanup steps, maps features to evidence, and proves one flow before handing over the skill.

Use [`maintain-verification-skill`](../../plugins/maintain-verification-skill/README.md) when the app or feature map changes. It compares the skill with source, drives mapped features, and confines documentation fixes to the verification skill. A product regression remains a reported regression.

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
