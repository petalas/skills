# Pstack license and provenance for individually installed skills

## Decision summary

Use a `THIRD_PARTY_NOTICES.md` file inside every installed skill directory that
copies or adapts a substantial portion of pstack. The file should contain:

1. the complete pstack MIT license text, including Lauren Tan's 2026 copyright
   notice;
2. the source repository and exact source commit
   `799151d91b6e12ee7dbd09f708eec108d7de9b3b`;
3. a source-to-destination path table for every copied or adapted file; and
4. whether each destination is copied unchanged or modified.

This is the clearest dedicated placement that satisfies both requirements at
the individual-install boundary. The pstack license requires its copyright and
permission notice to accompany copies or substantial portions, while Skills
CLI 1.5.23 installs the selected skill directory recursively rather than the
repository or plugin root. A root license, plugin README acknowledgement, or
manifest license string can supplement the nested file, but cannot replace it.

This is a conservative implementation reading of the supplied license, not
legal advice.

## Sources and fixed revisions

This note uses these immutable primary-source revisions:

- pstack at
  [`799151d91b6e12ee7dbd09f708eec108d7de9b3b`](https://github.com/cursor/plugins/tree/799151d91b6e12ee7dbd09f708eec108d7de9b3b/pstack).
  Its root `LICENSE` is MIT, names `Copyright (c) 2026 Lauren Tan`, and requires
  the copyright and permission notice in copies or substantial portions
  ([license text](https://github.com/cursor/plugins/blob/799151d91b6e12ee7dbd09f708eec108d7de9b3b/pstack/LICENSE)).
  Its plugin manifest also declares `MIT` and Lauren Tan as author
  ([manifest](https://github.com/cursor/plugins/blob/799151d91b6e12ee7dbd09f708eec108d7de9b3b/pstack/.cursor-plugin/plugin.json)).
- `petalas/skills` at
  [`ff2cfb9b4540b0691fa0165b9fd4895bc34eb4dd`](https://github.com/petalas/skills/tree/ff2cfb9b4540b0691fa0165b9fd4895bc34eb4dd).
- the official Skills CLI 1.5.23 source at tag
  [`v1.5.23`](https://github.com/vercel-labs/skills/tree/435076e78988e1e6ec40d00b0b1d76bdbbc5419a),
  peeled to commit `435076e78988e1e6ec40d00b0b1d76bdbbc5419a`.

## What must travel

The pstack MIT condition is tied to copies and substantial portions of the
software. For this extraction, apply the following conservative rule:

| Destination content                                                                        | Traveling material                                                                         |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Unchanged pstack skill or supporting file                                                  | Complete pstack MIT license and original copyright notice                                  |
| Modified or host-neutral adaptation of a pstack skill                                      | Complete pstack MIT license and original copyright notice                                  |
| A newly written skill that merely uses an abstract idea and copies no protected expression | No conclusion is needed from the pstack license alone; record an acknowledgement if useful |

Include the complete license, not only `MIT` or a link. The source license's
condition expressly names the copyright and permission notice. Keeping the
complete short license also preserves its warranty and liability disclaimer
without requiring installers to retrieve another repository
([pstack `LICENSE`](https://github.com/cursor/plugins/blob/799151d91b6e12ee7dbd09f708eec108d7de9b3b/pstack/LICENSE)).

The exact source commit, path mapping, and modification labels are provenance,
not additional conditions stated by the MIT text. They are nevertheless worth
shipping because they make later audits reproducible and prevent an adapted
file from being mistaken for an original `petalas/skills` work.

## Why the notice must live inside each skill

Skills CLI identifies a skill from `SKILL.md` and sets the install source path
to that file's containing directory
([`skills.ts` lines 64-72 and 124-129](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/skills.ts#L64-L129)).
For both copy and symlink installation modes, the installer recursively copies
that skill directory into the canonical or agent-specific destination
([`installer.ts` lines 336-360](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/installer.ts#L336-L360)).
The recursive copier excludes only `metadata.json`, `.git`, `__pycache__`, and
`__pypackages__`; a Markdown notice inside the directory is copied
([`installer.ts` lines 423-513](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/installer.ts#L423-L513)).

Therefore:

- `plugins/<plugin>/skills/<skill>/THIRD_PARTY_NOTICES.md` travels with an
  individual install;
- `plugins/<plugin>/LICENSE`, the repository root `LICENSE`, plugin `README.md`,
  `commands/`, and `.codex-plugin/plugin.json` are outside the selected skill
  directory and are not guaranteed to travel; and
- a root notice may still be useful for repository browsers and source
  archives, but it is not the install-boundary control.

Pstack's own license is at `pstack/LICENSE`, and the fixed source tree has no
license file inside each `pstack/skills/<name>/` directory
([pstack tree](https://github.com/cursor/plugins/tree/799151d91b6e12ee7dbd09f708eec108d7de9b3b/pstack)).
That root-only placement sits outside the directory Skills CLI copies for an
individually selected skill. Do not carry it over unchanged.

## Why CLI lock metadata is not upstream provenance

Project lock entries record the immediate source, optional source URL and ref,
source type, skill path, and a computed folder hash
([`local-lock.ts` lines 15-46](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/local-lock.ts#L15-L46)).
Global lock entries similarly record the immediate source, ref, skill path,
folder hash, timestamps, and optional plugin name
([`skill-lock.ts` lines 13-38](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/skill-lock.ts#L13-L38)).
The add workflow populates those fields from the repository currently being
installed
([`add.ts` lines 1854-1937](https://github.com/vercel-labs/skills/blob/435076e78988e1e6ec40d00b0b1d76bdbbc5419a/src/add.ts#L1854-L1937)).

An install from `petalas/skills` can therefore identify `petalas/skills`, its
selected skill path, and the installed folder contents. It has no field for
"this file originally came from pstack commit 799151d...". A nested provenance
file is required if that ancestry must survive installation, copying, and
later inspection without access to the source repository.

## Required notice versus optional acknowledgement

| Information                                               | Status for copied or substantially adapted pstack content                     | Recommended location                                        |
| --------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Lauren Tan copyright notice                               | Required by the supplied MIT text                                             | Nested `THIRD_PARTY_NOTICES.md`                             |
| MIT permission notice                                     | Required by the supplied MIT text                                             | Nested `THIRD_PARTY_NOTICES.md`                             |
| Warranty and liability disclaimer                         | Include as part of the complete license                                       | Nested `THIRD_PARTY_NOTICES.md`                             |
| Source repository                                         | Not stated as an MIT condition; strongly recommended provenance               | Nested `THIRD_PARTY_NOTICES.md`                             |
| Exact source commit                                       | Not stated as an MIT condition; strongly recommended provenance               | Nested `THIRD_PARTY_NOTICES.md`                             |
| Original-to-destination file mapping                      | Not stated as an MIT condition; strongly recommended provenance               | Nested `THIRD_PARTY_NOTICES.md`                             |
| "Copied unchanged" or "modified" label                    | Not stated as an MIT condition; strongly recommended provenance               | Nested `THIRD_PARTY_NOTICES.md`                             |
| Lauren Tan or pstack acknowledgement in public README     | Optional acknowledgement                                                      | Plugin README and optional root acknowledgement section     |
| pstack author in the destination plugin's publisher field | Not required; avoid if it would misstate who publishes the destination plugin | Keep publisher metadata separate from third-party copyright |

Do not use the destination manifest's `author` field as a substitute for the
original copyright notice. The pstack manifest's author metadata and its
license notice are separate source artifacts
([pstack manifest](https://github.com/cursor/plugins/blob/799151d91b6e12ee7dbd09f708eec108d7de9b3b/pstack/.cursor-plugin/plugin.json),
[pstack license](https://github.com/cursor/plugins/blob/799151d91b6e12ee7dbd09f708eec108d7de9b3b/pstack/LICENSE)).

## Proposed per-skill file shape

Use one self-contained file per derived skill:

```markdown
# Third-Party Notices

## pstack

This skill includes material copied or adapted from pstack.

- Repository: https://github.com/cursor/plugins
- Source commit: 799151d91b6e12ee7dbd09f708eec108d7de9b3b
- Source paths:
  - `pstack/skills/example/SKILL.md` -> `SKILL.md` (modified)
  - `pstack/skills/example/references/rule.md` -> `references/rule.md` (unchanged)

MIT License

<the complete text of pstack/LICENSE, unchanged>
```

The extraction should generate or verify the path table from the actual copy
plan. Do not use a generic statement such as "based on pstack" when exact file
ancestry is known.

## Resolved license and manifest decision

The target repository has no root `LICENSE`, `COPYING`, `NOTICE`, or
third-party notice file at the fixed commit. Its current plugin manifests all
declare `"license": "UNLICENSED"`:

- [`commit-guidelines` line 13](https://github.com/petalas/skills/blob/ff2cfb9b4540b0691fa0165b9fd4895bc34eb4dd/plugins/commit-guidelines/.codex-plugin/plugin.json#L13)
- [`fix-all-issues` line 13](https://github.com/petalas/skills/blob/ff2cfb9b4540b0691fa0165b9fd4895bc34eb4dd/plugins/fix-all-issues/.codex-plugin/plugin.json#L13)
- [`safe-refactor` line 13](https://github.com/petalas/skills/blob/ff2cfb9b4540b0691fa0165b9fd4895bc34eb4dd/plugins/safe-refactor/.codex-plugin/plugin.json#L13)

The extraction resolves that ambiguity by MIT-licensing each pstack-derived
plugin. Every derived plugin manifest declares `MIT`, and every installed skill
directory preserves pstack's complete MIT text, copyright notice, exact source
commit, and file mappings in `THIRD_PARTY_NOTICES.md`. This licenses the
destination contributions in those derived plugins under MIT without changing
the license policy of the pre-existing plugins or selecting a repository-wide
license.

The MIT grant permits use, modification, distribution, and sublicensing when
its notice condition is met
([pstack license](https://github.com/cursor/plugins/blob/799151d91b6e12ee7dbd09f708eec108d7de9b3b/pstack/LICENSE)).
The choice to declare the derived plugin manifests `MIT` is deliberate: it
licenses the destination plugin's own contributions under MIT as well as
preserving pstack's third-party notice. Existing `UNLICENSED` plugin manifests
remain separate and do not describe the newly added derived plugins.

## Acceptance checks for the later extraction

Before a pstack-derived skill is considered publishable:

1. Confirm whether it copies or substantially adapts pstack content. When in
   doubt, follow the conservative notice path.
2. Verify `THIRD_PARTY_NOTICES.md` is inside the exact directory containing the
   installed `SKILL.md`.
3. Compare the embedded MIT text byte-for-byte, apart from line endings, with
   pstack's fixed `LICENSE`.
4. Verify every copied or adapted file appears in the provenance table with its
   original path and modification status.
5. Run an installation fixture and assert that the notice exists in the
   installed skill while root-only files do not form part of the assertion.
6. Verify each derived plugin manifest declares the documented `MIT` license;
   do not infer a repository-wide license from those per-plugin declarations.
7. Treat README credit as an acknowledgement layer, not the compliance layer.
