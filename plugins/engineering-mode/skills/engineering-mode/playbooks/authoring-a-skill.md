# Authoring or modifying a skill

Use for a `SKILL.md`, supporting prompt, or reusable agent workflow.

1. Read the target repository's skill conventions and invoke its skill-authoring capability when available.
2. Define the trigger, intended decision change, inputs, outputs, and safety boundary.
3. Write direct operational instructions. Reference sibling skills instead of copying them.
4. Remove host-specific tool names when a capability description and local fallback can express the rule.
5. Validate frontmatter, referenced files, cross-skill names, ASCII requirements, and repository formatting.
6. Run structural test cases when behavior can be checked. For subjective prose, get user feedback instead of inventing a score.

Return the skill's purpose, key design choices, validation, and known host assumptions.
