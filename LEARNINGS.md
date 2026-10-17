# Learnings

Repository gotchas that were not obvious from the code or tooling. Add an entry when a fix takes more than one attempt.

## Prettier Renumbers Ordered Lists

Prettier rewrites an ordered Markdown list so its numbers run consecutively. A list that skips a number on purpose, such as `unslop` rules whose numbers are stable ids with gaps for removed rules, loses those gaps on the next `bun run format`. This silently shifted `unslop` rules 5 and 22 to 4 and 21 during an earlier port.

Put `<!-- prettier-ignore -->` on the line before any ordered list whose numbers carry meaning. `tests/pstack-scenarios.json` asserts the `unslop` ids, so `bun run check` fails if the marker is removed.
