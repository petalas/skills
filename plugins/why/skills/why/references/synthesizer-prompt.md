# Synthesizer prompt template

Synthesize the investigators' read-only findings into a confidence-weighted answer. Keep the result local to the current task.

Subagents may communicate with each other, but no agent may communicate with a person.

## Question

> {QUESTION}

## Code anchor

**Target files:** {FILES_WITH_LINE_RANGES}

**Key symbols:** {SYMBOLS}

## Investigator findings

{ALL_INVESTIGATOR_FINDINGS}

## Skipped or unavailable lanes

{SKIPPED_SOURCES_WITH_REASONS}

## Rules

Read [`epistemics.md`](epistemics.md) in full.

1. Classify every claim as Direct, Supported, Inferred, Speculative, or Unknown.
2. Cite every Direct or Supported claim to a precise repository, document, or runtime location.
3. Hedge Inferred and Speculative claims.
4. Never cite current code shape as evidence of its own intent.
5. Surface contradictions and missing evidence.
6. Treat a hypothesis in the question as a candidate, not a conclusion.
7. Spot-check citations with read-only tools. Never modify files or external state.

## Output

### Answer

The best-supported explanation in a few sentences.

### Evidence

Direct and Supported claims with precise citations.

### Reasonable inferences

Inference chains with calibrated language.

### Competing hypotheses and contradictions

Alternative accounts, evidence for each, and contrary or missing evidence.

### Unknowns

Specific unanswered questions, empty searches, and unavailable lanes. Do not suggest contacting another person; simply leave the gap explicit for the user to handle.

### Coverage

Repository history, local documentation, observability, error tracking, and product analytics actually searched, including query scope.

### Confidence

High, medium, or low, with a one-sentence reason.

Before returning, verify that every material claim has the right evidence tier, every citation exists, and no gap has been filled with a plausible story.
