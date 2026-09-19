# Implementation and verification

## Artifact ownership

The runner considers completed image payloads from its own Codex event stream first, then exact image IDs under its `thread.started` directory, then recent generated PNGs in that same directory. It rejects distinct competing images. Repeated identical streaming payloads resolve to one image. A new directory belonging to an unrelated session is never a source.

Image bytes and manifests use unique temporary files in the destination directory. Without `--force`, an atomic hard link reserves the final filename and refuses competing writers. With `--force`, replacement uses `os.replace`. Image and manifest are separate filesystem operations, not a transaction; if recording fails after the image is saved, the CLI returns failure and preserves the image for inspection. Do not treat that partial result as a completed generation record.

Destinations must differ from reference and prompt files. An optional event log must also differ from the image and its manifest. Existing destinations are checked before starting generation; writes enforce the same no-overwrite rule at completion. Reference hashes are captured before generation and checked again before saving. A changed or removed reference fails the run before image replacement. Keep reference files stable for the duration of a run; the local filesystem is not snapshotted.

## Limits and deliberate boundaries

| Resource                                        | Bound                                          |
| ----------------------------------------------- | ---------------------------------------------- |
| Image/reference file                            | 64 MiB                                         |
| Prompt or revised prompt                        | 1 MiB                                          |
| Recorded references                             | 16                                             |
| Event stream loaded into Python                 | 128 MiB                                        |
| Traversed event nodes                           | 100,000                                        |
| Thread IDs, image IDs, distinct event payloads  | 64 each                                        |
| Entries inspected in the owned thread directory | 1,024                                          |
| PNG chunks                                      | 4,096                                          |
| One PNG metadata chunk                          | 4 MiB                                          |
| Model mentions                                  | 128                                            |
| PNG dimensions                                  | At most 32,768 per side and 100 million pixels |

PNG inspection checks structure, lengths, CRCs, and key ordering constraints. It does not decode pixel data or validate C2PA signatures. It reports alpha-channel support separately from actual transparent pixels, which remain unknown. Model mentions are unverified metadata candidates and may refer to ingredients.

## Power of Ten deviations

- Rules 2 and 3, process and runtime resources: Python, JSON parsing, regex matching, and filesystem libraries allocate dynamically. Fixed allocation would require replacing these standard runtime services. The runner limits input sizes, traversal, image count, and process duration. Child output spools to temporary disk before the 128 MiB read check; disk use during the child process is bounded by available storage and its timeout, not a byte quota. Temporary handles close on success and failure. Tests exercise timeout, directory limits, malformed images, and oversized inputs. If this runner becomes an unattended service or accepts untrusted executable providers, add an enforced streaming disk quota before that deployment.
- Rule 5, invariants: argument and artifact contracts use normal errors because they validate external input. Tests check observable results and failed writes. Additional runtime assertions would duplicate those boundary checks; no assertion-density quota is used to justify redundant conditions.
- Rules 8 and 9, test dispatch: `unittest` discovers test methods and subprocesses execute the configured Codex binary. These are required standard interfaces with explicit entrypoints and bounded test subprocess timeouts. Production helper calls are direct; no dynamic code evaluation is used.
- Rule 10, diagnostics: the repository's recurring `bun run check` runs the Python suite with warnings promoted to errors, alongside its existing packaging and formatting checks. There is no Python type checker or dedicated Python linter dependency. Adding a mandatory toolchain is deferred to a repository-wide Python policy; syntax is compiled when each test imports or launches the script.

## Verification

Run `bun run test:gpt-image-2-5`. The suite invokes the actual runner CLI with an isolated fake Codex executable and real filesystem operations. It exercises event payloads, scoped thread artifacts, concurrent unrelated generation, ambiguous images, format rejection, overwrite races, prompts, model guards, manifests, child failure, and timeout. The inspector tests cover its standalone CLI and manifest behavior.

A local check against the existing 2026-09-19 badge trial found a 1254 by 1254 RGBA PNG. Its only model mention was `gpt-image`, with no numeric version candidate. That validates the inspector against an actual native-tool artifact; it does not establish 2.5 or constitute a new CLI generation test.
