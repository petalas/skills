---
name: principle-replace-internal-apis-atomically
version: 0.2.0
disable-model-invocation: true
description: "Apply when introducing a new internal API while old callers still exist. Migrate callers and delete the old API in the same wave instead of preserving compatibility layers."
---

# Replace Internal APIs Atomically

- Update tests to assert the new contract, and delete tests that only protect pre-refactor implementation details

**When this applies:**

- No external users depend on backward compatibility
- The project can absorb coordinated breaking changes
- The new API is part of a simplification or refactor initiative
