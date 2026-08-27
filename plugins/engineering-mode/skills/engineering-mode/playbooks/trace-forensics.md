# Trace forensics

Use when the user provides a captured profile, trace, spindump, heap snapshot, or similar artifact.

1. Identify the format and choose a local parser that preserves the raw artifact.
2. Transform large structured data into a queryable form such as SQLite or a compact table.
3. Find the dominant frames, call paths, wait reasons, or retainer chain.
4. Resolve symbols to a source file, function, and line. If the artifact lacks symbols, say so.
5. Compare with a paired capture when available. Without one, label the result as the strongest supported hypothesis rather than a confirmed regression.
6. Keep queries and reduced outputs beside the analysis artifacts.

Return the format, reduced finding, source attribution, artifact paths, paired comparison, and confidence. Do not implement a correction unless asked.
