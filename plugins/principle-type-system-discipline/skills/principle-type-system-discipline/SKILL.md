---
name: principle-type-system-discipline
version: 0.2.0
disable-model-invocation: true
description: "Apply when designing types, reviewing a function signature, or writing code in any statically-typed language. Make illegal states unrepresentable, brand semantic primitives, parse external data at boundaries, exhaust variants, derive from authoritative schemas."
---

# Type System Discipline

Make the compiler reject impossible states, mismatched primitives, and unhandled variants. Prefer defining errors and special cases out of existence over proliferating handlers. For TypeScript syntax, if `$typescript-best-practices` is available, apply it; otherwise use the language's native sum types, narrowing, branding, parsing, and exhaustiveness checks.

- **Brand semantic primitives.** `UserId` and `OrderId` are strings underneath but should not be interchangeable. Give each its own type, such as a branded intersection in TypeScript or a newtype elsewhere. Validate once at creation, trust the type downstream. If two arguments share a primitive type but mean different things, brand them.
- **External data is untyped until parsed.** RPC payloads, JSON, IPC messages, CLI args, config files, environment variables, database rows. Have a parse function at every boundary that turns unstructured input into the typed model. If `$principle-boundary-discipline` is available, apply it for where to put validation; otherwise validate once where data enters and trust the parsed type inside.
- **Derive types from authoritative schemas.** When a protocol buffer, OpenAPI spec, GraphQL schema, database migration, design-token file, or another file owns a shape, derive from it instead of hand-rolling a parallel type. If `$principle-encode-lessons-in-structure` is available, apply it; otherwise prefer generated types, lint rules, or canonical helpers over repeated textual instructions.
