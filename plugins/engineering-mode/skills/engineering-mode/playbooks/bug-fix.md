# Bug fix

Use for a reported defect that needs reproduction, diagnosis, correction, and proof.

1. Read repository bug notes and invoke `diagnosing-bugs` when installed. Otherwise use steps 2 through 8 as the complete reproduce, eliminate, confirm, correct, and verify loop.
2. Reproduce the defect on the same user surface. If the normal path does not reproduce it, tighten conditions or add temporary local instrumentation.
3. List competing causes. Run probes that eliminate the largest part of the search space first.
4. Confirm the surviving mechanism with runtime evidence before designing the correction.
5. Choose the smallest change the evidence supports. Use `tdd` when installed and a cheap local failing test can express the defect. Otherwise write the failing test first, run it to confirm the intended failure, make the minimum correction, and rerun it to green before cleanup.
6. Delegate an isolated implementation when review separation adds value. Review the diff yourself.
7. Re-run the original reproduction on the same surface. Run the smallest relevant tests, then the repository's required checks.
8. Remove temporary instrumentation that is not part of the durable proof.

Return the symptom, root cause, correction, failing and passing evidence, changed files, and verification limits.
