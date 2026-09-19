"""Behavior tests for local PNG inspection and generation records."""

from concurrent.futures import ThreadPoolExecutor
import binascii
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest
import zlib

from inspect_image import inspect_png, read_bounded, record_manifest

HAS_PILLOW = importlib.util.find_spec("PIL") is not None


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


def alpha_png(rows, indexed=False):
    height, width = len(rows), len(rows[0])
    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 3 if indexed else 6, 0, 0, 0))
    if indexed:
        data += chunk(b"PLTE", bytes([128, 64, 32]) * 256) + chunk(b"tRNS", bytes(range(256)))
    raw = b"".join(b"\0" + b"".join(bytes([value]) if indexed else bytes([128, 64, 32, value])
                                     for value in row) for row in rows)
    return data + chunk(b"IDAT", zlib.compress(raw)) + chunk(b"IEND", b"")


class ImageInspectionTests(unittest.TestCase):
    def test_missing_optional_decoder_fails_only_when_requested(self):
        script = Path(__file__).with_name("inspect_image.py")
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "badge.png"
            output.write_bytes(png())
            command = [sys.executable, "-S", str(script), str(output)]
            normal = subprocess.run(command, capture_output=True, text=True, timeout=10)
            self.assertEqual(normal.returncode, 0, normal.stderr)
            self.assertEqual(json.loads(normal.stdout)["pixel_validation"], "not performed")
            missing = subprocess.run(command + ["--pixels"], capture_output=True, text=True, timeout=10)
            self.assertEqual(missing.returncode, 1)
            self.assertIn("--pixels requires Pillow", missing.stderr)
            self.assertEqual(list(Path(directory).iterdir()), [output])

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


@unittest.skipUnless(HAS_PILLOW, "Optional pixel inspection requires Pillow")
class PixelInspectionTests(unittest.TestCase):
    def test_opaque_rgba_and_transparent_palette_decode_actual_samples(self):
        opaque = inspect_png(png(), pixels=True)
        self.assertTrue(opaque["alpha_channel"])
        self.assertEqual(opaque["actual_transparent_pixels"], 0)
        self.assertEqual(opaque["pixel_evidence"]["fully_opaque_pixels"], 1)
        palette = inspect_png(alpha_png([[0, 249, 250, 253, 255]], indexed=True), pixels=True)
        self.assertFalse(palette["alpha_channel"])
        self.assertTrue(palette["transparency_chunk"])
        self.assertEqual(palette["actual_transparent_pixels"], 4)
        self.assertEqual(palette["pixel_evidence"]["near_opaque_pixels"], 3)
        self.assertEqual(palette["pixel_evidence"]["fully_transparent_pixels"], 1)
        self.assertEqual(palette["pixel_evidence"]["fully_opaque_pixels"], 1)

    def test_faint_speck_and_near_opaque_body_have_distinct_bounds(self):
        data = alpha_png([[1, 0, 0, 0], [0, 253, 255, 0], [0, 0, 0, 0]])
        result = inspect_png(data, pixels=True)
        self.assertEqual(result["pixel_validation"], "passed")
        self.assertEqual(result["actual_transparent_pixels"], 11)
        self.assertEqual(result["pixel_evidence"], {
            "decoder": "Pillow", "alpha_scale": 255, "visible_alpha_threshold": 8,
            "pixel_count": 12, "alpha_min": 0, "alpha_max": 255,
            "fully_transparent_pixels": 9, "partially_transparent_pixels": 2,
            "near_opaque_pixels": 2, "fully_opaque_pixels": 1,
            "raw_bbox": [0, 0, 3, 2], "visible_bbox": [1, 1, 3, 2],
            "raw_padding_ratios": {"left": 0.0, "top": 0.0, "right": 0.25, "bottom": 1 / 3},
            "visible_padding_ratios": {"left": 0.25, "top": 1 / 3, "right": 0.25, "bottom": 1 / 3},
        })
        strict = inspect_png(data, pixels=True, alpha_threshold=254)
        self.assertEqual(strict["pixel_evidence"]["visible_bbox"], [2, 1, 3, 2])
        self.assertEqual(result["model_verification"], "unverified")

    def test_empty_alpha_has_null_boxes_and_padding(self):
        result = inspect_png(alpha_png([[0, 0], [0, 0]]), pixels=True)
        self.assertEqual(result["actual_transparent_pixels"], 4)
        evidence = result["pixel_evidence"]
        self.assertEqual((evidence["alpha_min"], evidence["alpha_max"]), (0, 0))
        self.assertEqual([evidence[key] for key in ("raw_bbox", "visible_bbox", "raw_padding_ratios", "visible_padding_ratios")],
                         [None, None, None, None])

    def test_malformed_pixel_stream_rejected_despite_valid_structure(self):
        data = png().replace(chunk(b"IDAT", zlib.compress(b"\0" + b"\xff" * 4)), chunk(b"IDAT", b"not zlib"))
        self.assertEqual(inspect_png(data)["structure_validation"], "passed")
        with self.assertRaisesRegex(ValueError, "pixel decoding failed"):
            inspect_png(data, pixels=True)
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "badge.png"
            output.write_bytes(data)
            with self.assertRaisesRegex(ValueError, "pixel decoding failed"):
                record_manifest(output, "badge", [], "native", "tool", pixels=True)
            self.assertEqual(list(Path(directory).iterdir()), [output])
            self.assertEqual(output.read_bytes(), data)

    def test_decode_capacity_and_precision_guards(self):
        old_header = chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 8, 6, 0, 0, 0))
        large = png().replace(old_header, chunk(b"IHDR", struct.pack(">IIBBBBB", 4097, 4096, 8, 6, 0, 0, 0)))
        self.assertEqual(inspect_png(large)["width"], 4097)
        with self.assertRaisesRegex(ValueError, "exceeds 16,777,216 pixels"):
            inspect_png(large, pixels=True)
        deep = png().replace(old_header, chunk(b"IHDR", struct.pack(">IIBBBBB", 1, 1, 16, 6, 0, 0, 0)))
        with self.assertRaisesRegex(ValueError, "16-bit samples would lose precision"):
            inspect_png(deep, pixels=True)
        with self.assertRaisesRegex(ValueError, "Alpha threshold"):
            inspect_png(png(), pixels=True, alpha_threshold=255)

    def test_cli_record_contains_pixels_and_keeps_source_bytes(self):
        script = Path(__file__).with_name("inspect_image.py")
        with tempfile.TemporaryDirectory() as directory:
            output, prompt = Path(directory) / "badge.png", Path(directory) / "prompt.txt"
            data = alpha_png([[0, 253, 255]])
            output.write_bytes(data)
            prompt.write_bytes(b"badge\r\nexact\n")
            command = [sys.executable, str(script), str(output), "--pixels", "--alpha-threshold", "254"]
            read_only = subprocess.run(command, capture_output=True, text=True, timeout=10)
            self.assertEqual(read_only.returncode, 0, read_only.stderr)
            evidence = json.loads(read_only.stdout)
            recorded = subprocess.run(command + ["--record", "--prompt-file", str(prompt), "--route", "native", "--source", "tool"],
                                      capture_output=True, text=True, timeout=10)
            self.assertEqual(recorded.returncode, 0, recorded.stderr)
            manifest = json.loads(output.with_suffix(".png.json").read_text())
            self.assertEqual(manifest["submitted_prompt"], "badge\r\nexact\n")
            self.assertEqual(manifest["output"], {"path": str(output), **evidence})
            self.assertEqual(manifest["output"]["pixel_evidence"]["visible_bbox"], [2, 0, 3, 1])
            self.assertEqual(output.read_bytes(), data)


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
