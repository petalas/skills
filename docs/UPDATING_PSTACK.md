# Update skills from pstack

Use this guide to inspect a newer pstack revision and port useful changes into
`petalas/skills`. The update is a review and adaptation process. Do not replace
the current skills with the upstream tree.

## Know which files are authoritative

Use these sources in this order:

1. [`docs/SOLO_AGENT_POLICY.md`](SOLO_AGENT_POLICY.md) defines the permanent
   safety and authority boundary. An upstream update cannot weaken it.
2. [`docs/pstack-imports.json`](pstack-imports.json) records the pinned source
   revision and exact source-to-installed-file mappings.
3. [`docs/research/pstack-component-inventory.md`](research/pstack-component-inventory.md)
   records the baseline decision to copy, adapt, extract, or exclude each
   upstream component.
4. Each installed `SKILL.md` defines current behavior. Keep existing
   `petalas/skills` behavior when upstream guidance conflicts with a stronger
   local contract.
5. `scripts/validate-pstack-imports.mjs` defines the mechanical provenance,
   packaging, host-neutrality, and communication checks.

The component inventory is a baseline, not a live installed-skill snapshot.
Update an inventory row when a new upstream revision changes the classification
or destination.

## Preserve the suite rules

Apply these rules to every upstream change:

- Keep one behavioral owner for each job. Merge useful guidance into an
  existing authoritative skill instead of creating a competing workflow.
- Keep `commit-guidelines`, `safe-refactor`, and `fix-all-issues` authoritative
  for their existing scopes.
- Preserve the current renamed concepts. For example, `poteto-mode` maps to
  `engineering-mode`, `setup-pstack` maps to `configure-agent-models`, and
  pstack `tdd` maps to the narrower `regression-test` skill.
- Use optional cross-skill calls only with an installed check or a complete
  local fallback. The repository does not install named skill dependencies
  automatically.
- Replace Cursor paths, tools, task schemas, fixed model identifiers, and
  cloud-agent assumptions with host capabilities discovered at runtime.
- Allow internal agents to coordinate. Never let a main agent or subagent
  communicate with another person.
- Exclude Slack, Benny, Bugbot, Graphite shipping, automated pull-request
  comments, review replies, issue filing, and other human-directed external
  communication.
- Keep remote mutation, Git history changes, pushes, merges, deploys, and issue
  changes behind their existing explicit authority gates.

## Prepare the source trees

1. Start with a clean `petalas/skills` worktree.
2. Install dependencies and prove the current baseline:

   ```bash
   bun install
   bun run check
   ```

3. Clone or update `cursor/plugins`. The default source path is
   `../plugins/pstack` relative to this repository. Set `PSTACK_SOURCE_ROOT` if
   the clone lives elsewhere.
4. Fetch the candidate upstream revision without changing the checked-out
   pstack files:

   ```bash
   git -C /path/to/plugins fetch origin
   ```

5. Choose an immutable candidate commit. Do not pin a moving branch name in the
   import manifest.

## Report the upstream changes

Run the report against the candidate commit:

```bash
PSTACK_SOURCE_ROOT=/path/to/plugins/pstack \
  bun run report:pstack-updates -- <candidate-commit>
```

The report compares the candidate with `sourceCommit` in
`docs/pstack-imports.json`. It reads Git objects, not the pstack working tree.
Each changed path receives one classification:

- `imported`: an existing manifest mapping names the path;
- `excluded`: a manifest exclusion pattern matches the path;
- `review`: no current rule covers the path.

For every changed mapped source that still exists at the candidate commit, the
report also prints its candidate `sourceSha256` and
`sourceNormalizedSha256`. It uses the same normalization implementation as the
provenance validator.

Review every line. A classified path still requires judgment. An imported file
may contain a change that conflicts with local policy, and an excluded area may
contain a newly portable idea worth extracting without copying its workflow.

## Classify each changed component

For every changed path, choose one result:

- **Copy.** Keep the semantics unchanged. Packaging-only changes such as the
  local `version` field are allowed by `pstack-markdown-v1` normalization.
- **Adapt.** Preserve useful behavior while changing host assumptions,
  authority, communication, dependencies, or naming.
- **Extract concept.** Reimplement the useful idea without copying substantial
  expression. Record the destination as `adapt` if the result keeps an
  authoritative source mapping.
- **Exclude.** Do not port the component. Add or update a specific exclusion
  reason in `docs/pstack-imports.json` and the component inventory.

When a change overlaps an existing skill, use this order:

1. Keep the existing local safety and authorization rules.
2. Keep the existing behavioral owner.
3. Merge useful upstream detail into that owner.
4. Rename only when the upstream workflow has a distinct solo purpose.
5. Exclude the change when it depends on team communication or automated
   external publication.

## Update an existing import

1. Read the complete upstream file at the candidate commit:

   ```bash
   git -C /path/to/plugins show \
     <candidate-commit>:pstack/<source-path>
   ```

2. Compare it with the current installed destination and its local callers,
   references, and fallbacks.
3. Apply the useful change to
   `plugins/<name>/skills/<name>/<destination>`.
4. Update the corresponding mapping in `docs/pstack-imports.json`:
   - change `source` or `destination` when the path moved;
   - replace `sourceSha256` with the candidate source blob hash;
   - replace `sourceNormalizedSha256` with the candidate normalized hash;
   - keep `inventorySource` mapped to one authoritative source path;
   - set `coordinatesSubagents` and `automaticInvocation` only when the current
     behavior requires them.
5. Update the plugin and skill versions together when behavior changed.
6. Update the component inventory when the disposition, destination, or
   dependency decision changed.

Do not run the notice generator until every mapping hash matches the candidate
source tree. The generator refuses mismatched source blobs.

## Add a new imported skill

1. Add the component and its classification to the component inventory.
2. Add an exact import entry and mappings to `docs/pstack-imports.json`.
3. Run the scaffold against the source directory:

   ```bash
   PSTACK_SOURCE_ROOT=/path/to/plugins/pstack \
     bun scripts/scaffold-pstack-plugin.mjs \
     <destination-name> <pstack-source-directory>
   ```

4. Adapt the generated files to the solo policy.
5. Add complete inline fallbacks for optional sibling skills.
6. Regenerate the public catalog after the plugin metadata is final.

The scaffold copies only mappings already declared in the manifest. It reads
the pinned Git commit, verifies source hashes, preserves executable bits, adds
the plugin wrapper files, and generates the nested notice.

## Move the pinned baseline

After all selected changes are present:

1. Set `sourceCommit` and `sourcePluginVersion` in
   `docs/pstack-imports.json` to the candidate revision and version.
2. Update the approved commit constant in:
   - `scripts/validate-pstack-imports.mjs`;
   - `scripts/sync-pstack-notices.mjs`;
   - `scripts/scaffold-pstack-plugin.mjs`.
3. Update source and normalized hashes for every mapping whose upstream blob
   changed. Copy the candidate values from the update report.
4. Update `licenseSourceSha256` and the expected licence text in
   `scripts/validate-pstack-imports.mjs` if the upstream licence bytes changed.
   Review a licence change before copying any new material.
5. Update the pinned pstack version and commit in repository documentation and
   guide notices.
6. Regenerate all per-skill notices:

   ```bash
   PSTACK_SOURCE_ROOT=/path/to/plugins/pstack bun run notices:sync
   ```

7. Regenerate the catalog when plugin membership or public metadata changed:

   ```bash
   bun run catalog:sync
   ```

8. Search for the previous commit across the repository. Any remaining match
   must be intentionally historical:

   ```bash
   rg -n '<previous-source-commit>' .
   ```

## Verify the port

Run the full repository gate with the candidate source checkout available:

```bash
PSTACK_SOURCE_ROOT=/path/to/plugins/pstack bun run check
```

Then verify these facts in the diff:

- Every changed upstream component has a copy, adapt, extract, or exclude
  decision.
- Every copied or adapted source file has one exact manifest mapping.
- Every mapped destination exists inside its installed skill directory.
- Every derived skill carries the updated notice and full MIT text.
- Copy-class destinations pass normalized equality.
- Adapted coordinators remain host-neutral and repeat the communication rule in
  every child prompt.
- Named sibling skills have an installed check or a complete fallback.
- Removed or renamed upstream paths no longer appear in mappings.
- The generated marketplace, catalog, and root README are current.
- Behavior scenarios cover new safety, routing, or fallback decisions.

Finally, run the update report again with the same candidate commit. Every
`review` path must have a recorded decision in the component inventory or a new
manifest rule.

## Know the validation boundary

The repository checks provenance and selected behavior. It does not prove all
semantic decisions:

- `adapt` records ancestry but does not require textual similarity.
- Named cross-skill references do not form a package dependency graph.
- The manifest exclusion list documents policy, but the validator does not
  currently prove that it covers every upstream file.
- Validation without a pstack checkout cannot reread upstream Git objects.
- The installation fixture covers one representative derived skill rather than
  every imported skill.

Treat those limits as review duties during every upstream port.
