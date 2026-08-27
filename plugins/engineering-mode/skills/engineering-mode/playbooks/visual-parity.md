# Visual parity

Use for pixel-exact matching or a styling-system migration where appearance must not change.

1. Capture immutable baseline images across representative states, viewports, themes, and platforms before changing code.
2. Keep the baseline and comparison harness outside the implementation edit set.
3. Migrate shared primitives first. Then handle components independently when their files do not overlap.
4. Capture the same states from the changed build through the available UI control capability.
5. Run an image diff. Investigate every nonzero delta. Do not alter the harness or baseline to make the result pass.
6. Run interaction checks so a visually identical result also behaves correctly.

Return the migrated components, per-state diff results, baseline and output paths, interaction evidence, and remaining work.
