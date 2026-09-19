"""Behavior tests for local PNG inspection and generation records."""

from concurrent.futures import ThreadPoolExecutor
import binascii
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest
import zlib

from inspect_image import inspect_png, read_bounded, record_manifest


def chunk(kind, payload):
    return struct.pack(">I", len(payload)) + kind + payload + struct.pack(">I", binascii.crc32(kind + payload) & 0xFFFFFFFF)


def png(color=6, metadata=None, transparency=None):
    channels = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[color]
    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, color, 0, 0, 0))
    if color == 3:
        data += chunk(b"PLTE", b"\xff\xff\xff")
    if transparency is not None:
        data += chunk(b"tRNS", transparency)
    if metadata is not None:
        data += chunk(b"caBX", metadata)
    return data + chunk(b"IDAT", zlib.compress(b"\0" + b"\xff" * channels)) + chunk(b"IEND", b"")


class ImageInspectionTests(unittest.TestCase):
    def test_dimensions_and_hash(self):
        data = png()
        result = inspect_png(data)
        self.assertEqual((result["width"], result["height"], result["bit_depth"], result["color_type"]), (1, 1, 8, 6))
        self.assertEqual(result["sha256"], hashlib.sha256(data).hexdigest())
        self.assertEqual(result["structure_validation"], "passed")
        self.assertEqual(result["pixel_validation"], "not performed")

    def test_alpha_support_is_not_proof_of_transparent_pixels(self):
        rgba = inspect_png(png(6))
        rgb = inspect_png(png(2))
        indexed = inspect_png(png(3, transparency=b"\0"))
        self.assertEqual([rgba["alpha_channel"], rgb["alpha_channel"], indexed["alpha_channel"]], [True, False, False])
        self.assertEqual([rgba["transparency_chunk"], rgb["transparency_chunk"], indexed["transparency_chunk"]], [False, False, True])
        self.assertEqual([rgba["transparency_supported"], rgb["transparency_supported"], indexed["transparency_supported"]], [True, False, True])
        self.assertIsNone(rgba["actual_transparent_pixels"])
        self.assertIsNone(indexed["actual_transparent_pixels"])

    def test_generic_model_does_not_borrow_nearby_version(self):
        result = inspect_png(png(metadata=b"ChatGPT gpt-image version 2.5 claim generator version 1.2"))
        self.assertEqual(result["metadata_model_mentions"], ["gpt-image"])
        self.assertEqual(result["metadata_version_candidates"], [])
        self.assertEqual(result["model_verification"], "unverified")

    def test_explicit_models_remain_unverified_mentions(self):
        result = inspect_png(png(metadata=b"ingredient gpt-image-2 prompt gpt-image-2.5-sunburst-2026-09-08"))
        self.assertEqual(result["metadata_model_mentions"], ["gpt-image-2", "gpt-image-2.5-sunburst-2026-09-08"])
        self.assertEqual(result["metadata_version_candidates"], ["2", "2.5"])
        self.assertEqual(result["model_verification"], "unverified")
        self.assertEqual(result["signature_verification"], "not performed")

    def test_cbor_text_lengths_do_not_hide_or_extend_identifiers(self):
        generic = b"dnamegChatGPTgversionigpt-imageqdigitalSourceType"
        identifier = b"gpt-image-2.5-sunburst-2026-09-08"
        specific = b"\x78" + bytes([len(identifier)]) + identifier + b"qdigitalSourceType"
        self.assertEqual(inspect_png(png(metadata=generic))["metadata_model_mentions"], ["gpt-image"])
        self.assertEqual(inspect_png(png(metadata=generic))["metadata_version_candidates"], [])
        self.assertEqual(inspect_png(png(metadata=specific))["metadata_model_mentions"], [identifier.decode()])
        self.assertEqual(inspect_png(png(metadata=specific))["metadata_version_candidates"], ["2.5"])

    def test_unrelated_text_is_not_model_evidence(self):
        data = png().replace(chunk(b"IEND", b""), chunk(b"tEXt", b"prompt\0gpt-image-2.5") + chunk(b"IEND", b""))
        self.assertEqual(inspect_png(data)["metadata_model_mentions"], [])
        self.assertEqual(inspect_png(png(metadata=b"gpt-image-2"))["metadata_model_mentions"], ["gpt-image-2"])

    def test_malformed_images_are_rejected(self):
        cases = [b"not a PNG", png()[:-1], png() + b"trailing", png()[:40] + b"broken" + png()[46:],
                 png(6, transparency=b"\0"), png().replace(chunk(b"IEND", b""), b"")]
        for data in cases:
            with self.subTest(data=data[:20]), self.assertRaises(ValueError):
                inspect_png(data)

    def test_zero_dimensions_are_rejected(self):
        data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", 0, 1, 8, 6, 0, 0, 0))
        with self.assertRaisesRegex(ValueError, "dimensions"):
            inspect_png(data)

    def test_bounded_file_read(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "data"
            path.write_bytes(b"12345")
            self.assertEqual(read_bounded(path, 5), b"12345")
            with self.assertRaisesRegex(ValueError, "exceeds 4 bytes"):
                read_bounded(path, 4)


class ManifestTests(unittest.TestCase):
    def test_manifest_preserves_exact_prompt_and_reference_hash(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "badge.png"
            reference = Path(directory) / "old.png"
            output.write_bytes(png())
            reference.write_bytes(png(2))
            prompt = "  Badge\r\nKeep this exact.\n"
            path = record_manifest(output, prompt, [reference], "native", "image tool", revised_prompt="Badge")
            result = json.loads(path.read_text())
            self.assertEqual(path.name, "badge.png.json")
            self.assertEqual(result["submitted_prompt"], prompt)
            self.assertEqual(result["revised_prompt"], "Badge")
            self.assertEqual(result["generation_route"], "native")
            self.assertEqual(result["references"], [{"path": str(reference.resolve()), "sha256": hashlib.sha256(png(2)).hexdigest()}])
            self.assertEqual(result["output"]["model_verification"], "unverified")

    def test_overwrite_requires_force(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "badge.png"
            output.write_bytes(png())
            path = record_manifest(output, "first", [], "native", "tool")
            with self.assertRaises(FileExistsError):
                record_manifest(output, "second", [], "native", "tool")
            self.assertEqual(json.loads(path.read_text())["submitted_prompt"], "first")
            record_manifest(output, "second", [], "native", "tool", force=True)
            self.assertEqual(json.loads(path.read_text())["submitted_prompt"], "second")
            self.assertEqual(sorted(item.name for item in Path(directory).iterdir()), ["badge.png", "badge.png.json"])

    def test_competing_writers_cannot_replace_manifest(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "badge.png"
            output.write_bytes(png())
            with ThreadPoolExecutor(max_workers=2) as executor:
                jobs = [executor.submit(record_manifest, output, prompt, [], "native", "tool") for prompt in ("first", "second")]
            self.assertEqual(sum(job.exception() is None for job in jobs), 1)
            self.assertEqual(sum(isinstance(job.exception(), FileExistsError) for job in jobs), 1)
            winner = "first" if jobs[0].exception() is None else "second"
            self.assertEqual(json.loads(output.with_suffix(".png.json").read_text())["submitted_prompt"], winner)

    def test_invalid_output_leaves_no_manifest(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "badge.png"
            output.write_bytes(b"invalid")
            with self.assertRaises(ValueError):
                record_manifest(output, "prompt", [], "native", "tool")
            self.assertEqual([item.name for item in Path(directory).iterdir()], ["badge.png"])

    def test_cli_inspection_is_read_only_and_record_preserves_newlines(self):
        script = Path(__file__).with_name("inspect_image.py")
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "badge.png"
            output.write_bytes(png())
            completed = subprocess.run([sys.executable, str(script), str(output)], capture_output=True, text=True, timeout=10)
            self.assertEqual(completed.returncode, 0, completed.stderr)
            self.assertEqual(json.loads(completed.stdout)["width"], 1)
            self.assertEqual([item.name for item in Path(directory).iterdir()], ["badge.png"])
            prompt = Path(directory) / "prompt.txt"
            prompt.write_bytes(b"badge\r\nexact\n")
            recorded = subprocess.run([sys.executable, str(script), str(output), "--record", "--prompt-file", str(prompt),
                                       "--route", "native", "--source", "tool"], capture_output=True, text=True, timeout=10)
            self.assertEqual(recorded.returncode, 0, recorded.stderr)
            self.assertEqual(json.loads(output.with_suffix(".png.json").read_text())["submitted_prompt"], "badge\r\nexact\n")


if __name__ == "__main__":
    unittest.main()
