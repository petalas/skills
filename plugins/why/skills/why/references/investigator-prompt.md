# Investigator prompt template

Fill in the placeholders and append the playbook for the assigned evidence lane.

Subagents may communicate with each other, but no agent may communicate with a person.

Never write files, send messages, post comments, submit reviews, or mutate an external system. Keep findings local.

## Question

> {QUESTION}

## Code anchor

**Target files:** {FILES_WITH_LINE_RANGES}

**Key symbols:** {SYMBOLS}

**Initial commits:** {COMMIT_LIST}

**Repository references:** {REPOSITORY_REFERENCES}

## Assigned evidence lane

{SOURCE_NAME}

{SOURCE_PLAYBOOK_SECTION}

## Method

Gather evidence rather than answering the question.

1. Start broad, then narrow to concrete matches.
2. Read each relevant source in full when access permits.
3. Follow links inside the assigned lane. Record cross-lane leads instead of chasing them.
4. Capture short exact excerpts only when wording matters, with a precise location.
5. Record searches that returned nothing.
6. Preserve contradictions.
7. Distinguish mechanics from motivation. The current implementation is not evidence of why it exists.

## Output

### Source and scope

Name the lane, searched scope, and time range.

### What was searched

List queries, commands, files, records, and dashboards inspected.

### Direct evidence

For each item, give the exact claim, location, date when available, and relevance.

### Indirect evidence

For each item, state what it suggests, the inference chain, and plausible alternative readings.

### Contradictions

Show both sides with locations.

### Gaps

Name unavailable evidence and searches with no results.

### Additional leads

Record concrete follow-ups for another read-only lane.
