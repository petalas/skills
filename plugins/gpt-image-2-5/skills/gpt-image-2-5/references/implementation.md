# Implementation and verification

## Artifact ownership

The runner considers completed image payloads from its own Codex event stream first, then exact image IDs under its `thread.started` directory, then recent generated PNGs in that same directory. It rejects distinct competing images. Repeated identical streaming payloads resolve to one image. A new directory belonging to an unrelated session is never a source.

Image bytes and manifests use unique temporary files in the destination directory. Without `--force`, an atomic hard link reserves the final filename and refuses competing writers. With `--force`, replacement uses `os.replace`. Image and manifest are separate filesystem operations, not a transaction; if recording fails after the image is saved, the CLI returns failure and preserves the image for inspection. Do not treat that partial result as a completed generation record.

Destinations must differ from reference and prompt files. An optional event log must also differ from the image and its manifest. Existing destinations are checked before starting generation; writes enforce the same no-overwrite rule at completion. Reference hashes are captured before generation and checked again before saving. A changed or removed reference fails the run before image replacement. Keep reference files stable for the duration of a run; the local filesystem is not snapshotted.

## Limits and deliberate boundaries

| Resource                                        | Bound                                                   |
| ----------------------------------------------- | ------------------------------------------------------- |
| Image/reference file                            | 64 MiB                                                  |
| Prompt or revised prompt                        | 1 MiB                                                   |
| Recorded references                             | 16                                                      |
| Event stream loaded into Python                 | 128 MiB                                                 |
| Traversed event nodes                           | 100,000                                                 |
| Thread IDs, image IDs, distinct event payloads  | 64 each                                                 |
| Entries inspected in the owned thread directory | 1,024                                                   |
| PNG chunks                                      | 4,096                                                   |
| One PNG metadata chunk                          | 4 MiB                                                   |
| Model mentions                                  | 128                                                     |
| PNG dimensions                                  | At most 32,768 per side and 100 million pixels          |
| Optional pixel decoding                         | 16,777,216 pixels, at most 8 bits per sample, one frame |

Default PNG inspection checks structure, lengths, CRCs, and key ordering constraints with only the standard library. Pixel data remains undecoded, so actual transparent pixels remain unknown. Model mentions are unverified metadata candidates and may refer to ingredients. Neither inspection mode validates C2PA signatures.

## Pixel evidence

`--pixels` requires Pillow. Use `uv run --with Pillow python <skill-dir>/scripts/inspect_image.py IMAGE --pixels`, or an environment where Pillow is already installed. The same flag on `--record` adds evidence under `output` in the manifest. Hashing, structural checks, and pixel decoding use one bounded read of the image, so the evidence describes the same bytes. The inspector never changes or normalizes the image.

The decoder accepts single-frame PNGs with sample depths up to 8, including indexed PNGs with `tRNS`. It refuses 16-bit samples rather than silently reducing precision. It enforces the decoded-pixel limit before opening Pillow, and reports a clear failure for a missing dependency, malformed pixel stream, unsupported format, or exceeded limit. A failed inspection writes no manifest. The original image remains available for diagnosis.

With successful decoding, `pixel_validation` is `passed` and `actual_transparent_pixels` counts every pixel with alpha below 255. `pixel_evidence` contains:

- `pixel_count` for the canvas size, and `alpha_min` and `alpha_max` on a 0-255 scale.
- `fully_transparent_pixels` for alpha 0, `partially_transparent_pixels` for alpha 1-254, `near_opaque_pixels` for alpha 250-255, and `fully_opaque_pixels` for alpha 255. Near-opaque counts overlap the other groups and must not be added to them.
- `raw_bbox` for alpha greater than 0, and `visible_bbox` for alpha greater than `visible_alpha_threshold`. The default threshold is 8. `--alpha-threshold` accepts integers 0-254.
- Bounding boxes use `[left, top, right, bottom]` pixel coordinates with exclusive right and bottom bounds. Each corresponding padding-ratio object divides left/right padding by width and top/bottom padding by height. Empty boxes and their padding ratios are `null`.

These measurements describe samples and framing. They do not establish perceptual quality, exclude a painted checkerboard, or determine which model generated the image.

## Power of Ten deviations

- Rules 2 and 3, process and runtime resources: Python, JSON parsing, regex matching, and filesystem libraries allocate dynamically. Fixed allocation would require replacing these standard runtime services. The runner limits input sizes, traversal, image count, and process duration. Child output spools to temporary disk before the 128 MiB read check; disk use during the child process is bounded by available storage and its timeout, not a byte quota. Temporary handles close on success and failure. Tests exercise timeout, directory limits, malformed images, and oversized inputs. If this runner becomes an unattended service or accepts untrusted executable providers, add an enforced streaming disk quota before that deployment.
- Rules 2 and 3, optional pixel decoder: Pillow and its native codecs allocate during decoding. Decoding accepts at most 16,777,216 pixels after the 64 MiB file and structural checks, followed by one RGBA conversion and single-channel masks. Each RGBA pixel buffer is at most 64 MiB; each alpha/mask buffer is at most 16 MiB. Histogram and lookup tables have 256 entries. Image contexts close on success and failure. Native codec overhead is not a measured process-memory cap. Tests exercise the pixel limit and malformed streams. Before exposing this inspector to untrusted uploads in a service, isolate decoding in a process with enforced memory and time limits.
- Rule 5, invariants: argument and artifact contracts use normal errors because they validate external input. Tests check observable results and failed writes. Additional runtime assertions would duplicate those boundary checks; no assertion-density quota is used to justify redundant conditions.
- Rules 8 and 9, library dispatch: `unittest` discovers test methods and subprocesses execute the configured Codex binary. These are required standard interfaces with explicit entrypoints and bounded test subprocess timeouts. Optional Pillow inspection restricts plugin selection to PNG. Production helper calls are direct; no dynamic code evaluation is used.
- Rule 10, diagnostics: the repository's recurring `bun run check` runs the Python suite with warnings promoted to errors, alongside its existing packaging and formatting checks. There is no Python type checker or dedicated Python linter dependency. Adding a mandatory toolchain is deferred to a repository-wide Python policy; syntax is compiled when each test imports or launches the script.

## Verification

Run `bun run test:gpt-image-2-5`. The suite invokes the actual runner CLI with an isolated fake Codex executable and real filesystem operations. It exercises event payloads, scoped thread artifacts, concurrent unrelated generation, ambiguous images, format rejection, overwrite races, prompts, model guards, manifests, child failure, and timeout. The inspector tests cover its standalone CLI and manifest behavior. Run the same suite through `uv run --with Pillow python -B -W error -m unittest discover -s plugins/gpt-image-2-5/skills/gpt-image-2-5/scripts -p 'test_*.py'` to include optional decoding tests. CI installs Pillow so those tests cannot be skipped there; a separate interpreter without site packages checks the missing-dependency path.

A local check against the existing 2026-09-19 badge trial found a 1254 by 1254 RGBA PNG. Its only model mention was `gpt-image`, with no numeric version candidate. That validates the inspector against an actual native-tool artifact; it does not establish 2.5 or constitute a new CLI generation test.

The optional decoder was also run read-only against that session's `explorer_ai_measurement.png`. It found 783,226 fully transparent pixels and 767,920 near-opaque pixels, of which only 267 were fully opaque. The raw alpha box began at `[0, 0]`; the alpha-greater-than-8 box was `[147, 196, 1138, 1077]`. This confirms the need to distinguish faint edge pixels from visible framing and near-opacity from exact alpha 255.
