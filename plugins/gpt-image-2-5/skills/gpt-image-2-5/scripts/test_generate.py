"""Exercise the runner CLI with an isolated fake Codex process and real files."""

from __future__ import annotations

import base64
import hashlib
import json
import os
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest
import zlib


RUNNER = Path(__file__).with_name("generate.py")


def png(pixel: bytes) -> bytes:
    def chunk(kind: bytes, data: bytes) -> bytes:
        return (
            struct.pack(">I", len(data))
            + kind
            + data
            + struct.pack(">I", zlib.crc32(kind + data))
        )

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(b"\0" + pixel))
        + chunk(b"IEND", b"")
    )


GOLD = png(b"\xff\xd7\x00\xff")
BLUE = png(b"\x00\x00\xff\xff")
FAKE_CODEX = """import base64, json, os, pathlib, sys, time
if sys.argv[1:] == ['login', 'status']:
    print('Logged in using ChatGPT')
    raise SystemExit(0)
scenario = json.loads(pathlib.Path(os.environ['RUNNER_SCENARIO']).read_text())
pathlib.Path(os.environ['RUNNER_INSTRUCTION']).write_text(sys.stdin.read())
if scenario.get('sleep'):
    time.sleep(scenario['sleep'])
if scenario.get('failure'):
    print('image quota exhausted', file=sys.stderr)
    raise SystemExit(1)
for item in scenario.get('files', []):
    path = pathlib.Path(item['path'])
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(base64.b64decode(item['data']))
for item in scenario.get('symlinks', []):
    pathlib.Path(item['path']).symlink_to(item['target'])
for path in scenario.get('delete', []):
    pathlib.Path(path).unlink()
for event in scenario.get('events', []):
    print(json.dumps(event))
"""


def event(data: bytes, image_id: str = "ig_gold") -> dict:
    return {
        "type": "item.completed",
        "item": {
            "type": "image_generation_call",
            "id": image_id,
            "result": base64.b64encode(data).decode("ascii"),
        },
    }


class RunnerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.generated = self.root / "codex-home" / "generated_images"
        self.generated.mkdir(parents=True)
        self.output = self.root / "result.png"
        self.scenario = self.root / "scenario.json"
        self.instruction = self.root / "instruction.txt"
        binary = self.root / "bin" / "codex"
        binary.parent.mkdir()
        binary.write_text(f"#!{sys.executable}\n{FAKE_CODEX}")
        binary.chmod(0o755)
        self.environment = {
            **os.environ,
            "PATH": f"{binary.parent}{os.pathsep}{os.environ.get('PATH', '')}",
            "CODEX_HOME": str(self.generated.parent),
            "RUNNER_SCENARIO": str(self.scenario),
            "RUNNER_INSTRUCTION": str(self.instruction),
        }

    def file(self, path: Path, data: bytes = BLUE) -> dict:
        return {"path": str(path), "data": base64.b64encode(data).decode("ascii")}

    def run_cli(self, scenario: dict, *options: str) -> subprocess.CompletedProcess:
        self.scenario.write_text(json.dumps(scenario))
        return subprocess.run(
            [sys.executable, str(RUNNER), "--prompt", "gold badge", "--out", str(self.output), *options],
            cwd=self.root,
            env=self.environment,
            capture_output=True,
            text=True,
            timeout=10,
            check=False,
        )

    def test_own_event_payload_wins_over_concurrent_directories(self) -> None:
        for count in (1, 2):
            with self.subTest(unrelated_directories=count):
                result = self.run_cli({
                    "files": [self.file(self.generated / f"other-{n}" / "exec-other.png") for n in range(count)],
                    "events": [event(GOLD)],
                }, "--force")
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual(self.output.read_bytes(), GOLD)
                self.assertIn("artifact tier: event-payload", result.stderr)

    def test_unrelated_new_directory_is_never_selected(self) -> None:
        result = self.run_cli({"files": [self.file(self.generated / "other" / "exec-other.png")]})
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertFalse(self.output.exists())

    def test_duplicate_stream_events_produce_one_image(self) -> None:
        result = self.run_cli({"events": [event(GOLD), event(GOLD)]})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.output.read_bytes(), GOLD)

    def test_distinct_event_images_are_ambiguous(self) -> None:
        result = self.run_cli({"events": [event(GOLD), event(BLUE, "ig_blue")]})
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertIn("multiple", result.stderr.lower())
        self.assertFalse(self.output.exists())

    def test_known_thread_directory_succeeds(self) -> None:
        result = self.run_cli({
            "files": [self.file(self.generated / "own-thread" / "exec-gold.png", GOLD)],
            "events": [{"type": "thread.started", "thread_id": "own-thread"}],
        })
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.output.read_bytes(), GOLD)

    def test_distinct_images_in_own_directory_are_ambiguous(self) -> None:
        result = self.run_cli({
            "files": [
                self.file(self.generated / "own-thread" / "exec-gold.png", GOLD),
                self.file(self.generated / "own-thread" / "exec-blue.png", BLUE),
            ],
            "events": [{"type": "thread.started", "thread_id": "own-thread"}],
        })
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertIn("multiple", result.stderr.lower())

    def test_exact_image_id_succeeds(self) -> None:
        result = self.run_cli({
            "files": [self.file(self.generated / "own-thread" / "ig_gold.png", GOLD)],
            "events": [
                {"type": "thread.started", "thread_id": "own-thread"},
                {"type": "image_generation_call", "id": "ig_gold"},
            ],
        })
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.output.read_bytes(), GOLD)
        self.assertIn("artifact tier: thread-id", result.stderr)

    def test_multiple_exact_image_ids_are_ambiguous(self) -> None:
        result = self.run_cli({
            "files": [
                self.file(self.generated / "own-thread" / "ig_gold.png", GOLD),
                self.file(self.generated / "own-thread" / "ig_blue.png", BLUE),
            ],
            "events": [
                {"type": "thread.started", "thread_id": "own-thread"},
                {"type": "image_generation_call", "id": "ig_gold"},
                {"type": "image_generation_call", "id": "ig_blue"},
            ],
        })
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertIn("multiple", result.stderr.lower())
        self.assertFalse(self.output.exists())

    def test_jpg_destination_is_rejected(self) -> None:
        self.output = self.output.with_suffix(".jpg")
        result = self.run_cli({"events": [event(GOLD)]})
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertIn(".png", result.stderr)
        self.assertFalse(self.output.exists())

    def test_jpeg_payload_is_not_written_as_png(self) -> None:
        result = self.run_cli({"events": [event(b"\xff\xd8\xffjpeg")]})
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertFalse(self.output.exists())

    def test_output_created_mid_run_requires_force(self) -> None:
        scenario = {"files": [self.file(self.output)], "events": [event(GOLD)]}
        result = self.run_cli(scenario)
        self.assertEqual(result.returncode, 8, result.stderr)
        self.assertEqual(self.output.read_bytes(), BLUE)
        result = self.run_cli(scenario, "--force")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.output.read_bytes(), GOLD)

    def test_existing_output_is_preserved_without_generation(self) -> None:
        self.output.write_bytes(BLUE)
        result = self.run_cli({"events": [event(GOLD)]})
        self.assertEqual(result.returncode, 8, result.stderr)
        self.assertEqual(self.output.read_bytes(), BLUE)
        self.assertFalse(self.instruction.exists())

    def test_existing_partial_file_is_untouched(self) -> None:
        partial = Path(f"{self.output}.partial")
        partial.write_bytes(BLUE)
        result = self.run_cli({"events": [event(GOLD)]})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.output.read_bytes(), GOLD)
        self.assertEqual(partial.read_bytes(), BLUE)

    def test_thread_id_cannot_escape_generated_root(self) -> None:
        result = self.run_cli({
            "files": [self.file(self.generated.parent / "outside" / "exec-gold.png", GOLD)],
            "events": [{"type": "thread.started", "thread_id": "../outside"}],
        })
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertFalse(self.output.exists())

    def test_image_id_cannot_escape_thread_directory(self) -> None:
        result = self.run_cli({
            "files": [self.file(self.generated / "other" / "gold.png", GOLD)],
            "events": [
                {"type": "thread.started", "thread_id": "own-thread"},
                {"type": "image_generation_call", "id": "ig_a/../../other/gold"},
            ],
        })
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertFalse(self.output.exists())

    def test_thread_symlink_cannot_escape_generated_root(self) -> None:
        outside = self.root / "outside"
        result = self.run_cli({
            "files": [self.file(outside / "exec-gold.png", GOLD)],
            "symlinks": [{"path": str(self.generated / "own-thread"), "target": str(outside)}],
            "events": [{"type": "thread.started", "thread_id": "own-thread"}],
        })
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertFalse(self.output.exists())

    def test_non_start_thread_id_is_not_an_artifact_source(self) -> None:
        result = self.run_cli({
            "files": [self.file(self.generated / "other" / "exec-gold.png", GOLD)],
            "events": [{"type": "item.completed", "item": {"thread_id": "other"}}],
        })
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertFalse(self.output.exists())

    def test_required_model_fails_before_login_or_generation(self) -> None:
        self.environment["PATH"] = ""
        result = self.run_cli({"events": [event(GOLD)]}, "--require-model", "gpt-image-2.5-sunburst")
        self.assertEqual(result.returncode, 10, result.stderr)
        self.assertIn("cannot pin an image model", result.stderr)
        self.assertFalse(self.output.exists())
        self.assertFalse(self.instruction.exists())

    def test_child_failure_preserves_diagnostic_and_writes_nothing(self) -> None:
        result = self.run_cli({"failure": True})
        self.assertEqual(result.returncode, 5, result.stderr)
        self.assertIn("image quota exhausted", result.stderr)
        self.assertFalse(self.output.exists())

    def test_child_timeout_returns_stable_error(self) -> None:
        result = self.run_cli({"sleep": 10}, "--timeout-sec", "1")
        self.assertEqual(result.returncode, 6, result.stderr)
        self.assertIn("timed out", result.stderr)
        self.assertFalse(self.output.exists())

    def test_thread_directory_enumeration_has_a_limit(self) -> None:
        result = self.run_cli({
            "files": [self.file(self.generated / "own-thread" / f"file-{n}.txt") for n in range(1025)],
            "events": [{"type": "thread.started", "thread_id": "own-thread"}],
        })
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertIn("1024-entry limit", result.stderr)
        self.assertFalse(self.output.exists())

    def test_prompt_file_is_passed_unchanged(self) -> None:
        prompt = "  Gold badge.\nKeep $(literal) `punctuation`.\n"
        prompt_file = self.root / "prompt.txt"
        prompt_file.write_text(prompt)
        self.scenario.write_text(json.dumps({"events": [event(GOLD)]}))
        result = subprocess.run(
            [sys.executable, str(RUNNER), "--prompt-file", str(prompt_file), "--out", str(self.output)],
            cwd=self.root, env=self.environment, capture_output=True, text=True, timeout=10, check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.instruction.read_text().split("Request:\n", 1)[1], prompt)
        self.assertEqual(self.output.read_bytes(), GOLD)

    def test_manifest_records_exact_inputs_and_unverified_evidence(self) -> None:
        prompt = "  Gold badge.\nKeep $(literal) `punctuation`.\n"
        reference = self.root / "reference.png"
        reference.write_bytes(BLUE)
        image_event = event(GOLD)
        image_event["item"]["revised_prompt"] = "A polished gold badge."
        result = self.run_cli(
            {"events": [image_event]}, "--prompt", prompt, "--ref", str(reference)
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.output.read_bytes(), GOLD)
        manifest = json.loads(Path(f"{self.output}.json").read_text())
        self.assertEqual(manifest["submitted_prompt"], prompt)
        self.assertEqual(manifest["revised_prompt"], "A polished gold badge.")
        self.assertEqual(manifest["generation_route"], "codex-cli")
        self.assertEqual(manifest["artifact_source"], "image_generation_call result")
        self.assertEqual(manifest["references"], [{
            "path": str(reference.resolve()), "sha256": hashlib.sha256(BLUE).hexdigest(),
        }])
        self.assertEqual(manifest["output"]["sha256"], hashlib.sha256(GOLD).hexdigest())
        self.assertEqual(manifest["output"]["model_verification"], "unverified")
        self.assertEqual(manifest["output"]["metadata_version_candidates"], [])
        self.assertEqual((manifest["output"]["width"], manifest["output"]["height"]), (1, 1))

    def test_bad_png_crc_is_rejected_before_output(self) -> None:
        invalid = GOLD[:29] + bytes([GOLD[29] ^ 1]) + GOLD[30:]
        result = self.run_cli({"events": [event(invalid)]})
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertIn("checksum mismatch", result.stderr)
        self.assertFalse(self.output.exists())
        self.assertFalse(Path(f"{self.output}.json").exists())

    def test_existing_manifest_blocks_generation_and_image_write(self) -> None:
        manifest = Path(f"{self.output}.json")
        manifest.write_text('{"existing": true}\n')
        result = self.run_cli({"events": [event(GOLD)]})
        self.assertEqual(result.returncode, 8, result.stderr)
        self.assertEqual(manifest.read_text(), '{"existing": true}\n')
        self.assertFalse(self.output.exists())
        self.assertFalse(self.instruction.exists())

    def test_manifest_created_during_generation_blocks_image_write(self) -> None:
        manifest = Path(f"{self.output}.json")
        result = self.run_cli({
            "files": [self.file(manifest, b'{"existing": true}\n')],
            "events": [event(GOLD)],
        })
        self.assertEqual(result.returncode, 8, result.stderr)
        self.assertEqual(manifest.read_text(), '{"existing": true}\n')
        self.assertFalse(self.output.exists())

    def test_force_updates_image_and_manifest_pair(self) -> None:
        first = self.run_cli({"events": [event(BLUE)]}, "--prompt", "A blue badge.")
        self.assertEqual(first.returncode, 0, first.stderr)
        result = self.run_cli({"events": [event(GOLD)]}, "--prompt", "A gold badge.", "--force")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.output.read_bytes(), GOLD)
        manifest = json.loads(Path(f"{self.output}.json").read_text())
        self.assertEqual(manifest["submitted_prompt"], "A gold badge.")
        self.assertEqual(manifest["output"]["sha256"], hashlib.sha256(GOLD).hexdigest())

    def test_output_and_log_collisions_are_rejected_even_with_force(self) -> None:
        for target in (self.output, Path(f"{self.output}.json")):
            for force in (False, True):
                with self.subTest(target=target.name, force=force):
                    options = ("--json-log", str(target)) + (("--force",) if force else ())
                    result = self.run_cli({"events": [event(GOLD)]}, *options)
                    self.assertEqual(result.returncode, 2, result.stderr)
                    self.assertIn("must be distinct", result.stderr)
                    self.assertFalse(self.output.exists())
                    self.assertFalse(self.instruction.exists())

    def test_input_and_destination_collisions_never_modify_the_input(self) -> None:
        for target_name in ("result.png", "result.png.json", "events.jsonl"):
            for force in (False, True):
                with self.subTest(target=target_name, force=force):
                    target = self.root / target_name
                    target.write_bytes(BLUE)
                    options = ("--ref", str(target))
                    if target_name == "events.jsonl":
                        options += ("--json-log", str(target))
                    if force:
                        options += ("--force",)
                    result = self.run_cli({"events": [event(GOLD)]}, *options)
                    expected_code = 8 if target == self.output and not force else 2
                    self.assertEqual(result.returncode, expected_code, result.stderr)
                    self.assertEqual(target.read_bytes(), BLUE)
                    self.assertFalse(self.instruction.exists())
                    target.unlink()

    def test_json_log_records_the_actual_event_stream(self) -> None:
        log = self.root / "events.jsonl"
        image_event = event(GOLD)
        result = self.run_cli({"events": [image_event]}, "--json-log", str(log))
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(log.read_text()), image_event)
        self.assertEqual(self.output.read_bytes(), GOLD)

    def test_changed_reference_does_not_overwrite_existing_pair(self) -> None:
        reference = self.root / "reference.png"
        reference.write_bytes(GOLD)
        manifest = Path(f"{self.output}.json")
        self.output.write_bytes(BLUE)
        manifest.write_bytes(b'{"existing": true}\n')
        result = self.run_cli({
            "files": [self.file(reference, BLUE)], "events": [event(GOLD)],
        }, "--ref", str(reference), "--force")
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertEqual(self.output.read_bytes(), BLUE)
        self.assertEqual(manifest.read_bytes(), b'{"existing": true}\n')

    def test_deleted_reference_fails_before_writing_image(self) -> None:
        reference = self.root / "reference.png"
        reference.write_bytes(BLUE)
        result = self.run_cli({
            "delete": [str(reference)], "events": [event(GOLD)],
        }, "--ref", str(reference))
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertFalse(self.output.exists())
        self.assertFalse(Path(f"{self.output}.json").exists())

    def test_oversized_revised_prompt_does_not_overwrite_existing_pair(self) -> None:
        manifest = Path(f"{self.output}.json")
        self.output.write_bytes(BLUE)
        manifest.write_bytes(b'{"existing": true}\n')
        image_event = event(GOLD)
        image_event["item"]["revised_prompt"] = "A" * (1024 * 1024 + 1)
        result = self.run_cli({"events": [image_event]}, "--force")
        self.assertEqual(result.returncode, 7, result.stderr)
        self.assertEqual(self.output.read_bytes(), BLUE)
        self.assertEqual(manifest.read_bytes(), b'{"existing": true}\n')


if __name__ == "__main__":
    unittest.main()
