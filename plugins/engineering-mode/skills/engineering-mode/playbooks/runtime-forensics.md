# Runtime forensics

Use to diagnose a leak, CPU spin, intermittent glitch, or other live runtime symptom. The deliverable is a diagnosis.

1. Capture the live signal through an available local control or instrumentation capability.
2. Reduce the artifact to a hot function, retainer chain, unexpected event loop, or other concrete mechanism. Use a read-only subagent for large artifacts when useful.
3. Confirm the mechanism with temporary local instrumentation or a reversible live probe.
4. Map the finding to a source file, symbol, and line.
5. Preserve the artifact and commands needed to reproduce the analysis.

Return the captured signal, reduced finding, confirmation method, source location, artifact paths, and confidence. Do not implement a correction unless the user asks.
