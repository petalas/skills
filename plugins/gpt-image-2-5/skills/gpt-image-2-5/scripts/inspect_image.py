#!/usr/bin/env python3
"""Inspect PNG structure and record generation inputs without network access."""

from __future__ import annotations

import argparse
import binascii
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import struct
import sys
import tempfile

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
MAX_FILE_BYTES = 64 * 1024 * 1024
MAX_PROMPT_BYTES = 1024 * 1024
MAX_REFERENCES = 16
MAX_CHUNKS = 4096
MODEL_IDENTIFIER = re.compile(rb"gpt-image(?:-[a-z0-9]+(?:[.-][a-z0-9]+)*)?")


def read_bounded(path: Path, limit: int = MAX_FILE_BYTES) -> bytes:
    with path.open("rb") as handle:
        data = handle.read(limit + 1)
    if len(data) > limit:
        raise ValueError(f"File exceeds {limit} bytes: {path}")
    return data


def _chunks(data: bytes):
    if len(data) > MAX_FILE_BYTES or not data.startswith(PNG_SIGNATURE):
        raise ValueError("Expected a PNG no larger than 64 MiB")
    offset = len(PNG_SIGNATURE)
    for index in range(MAX_CHUNKS):
        if offset + 12 > len(data):
            raise ValueError("Truncated PNG or missing IEND")
        size = int.from_bytes(data[offset:offset + 4], "big")
        end = offset + size + 12
        if end > len(data):
            raise ValueError("Truncated PNG chunk")
        kind = data[offset + 4:offset + 8]
        payload = data[offset + 8:end - 4]
        if not re.fullmatch(rb"[A-Za-z]{4}", kind):
            raise ValueError("Invalid PNG chunk type")
        checksum = binascii.crc32(payload, binascii.crc32(kind)) & 0xFFFFFFFF
        if checksum != int.from_bytes(data[end - 4:end], "big"):
            raise ValueError("PNG chunk checksum mismatch")
        if index == 0 and kind != b"IHDR":
            raise ValueError("PNG must start with IHDR")
        if kind[0] < 97 and kind not in (b"IHDR", b"PLTE", b"IDAT", b"IEND"):
            raise ValueError("Unknown critical PNG chunk")
        if kind == b"IEND" and (size != 0 or end != len(data)):
            raise ValueError("Invalid IEND or trailing PNG data")
        yield kind, payload
        offset = end
        if kind == b"IEND":
            return
    raise ValueError("PNG exceeds 4096 chunks")


def _header(payload: bytes) -> dict:
    if len(payload) != 13:
        raise ValueError("Invalid PNG IHDR length")
    width, height, depth, color, compression, filtering, interlace = struct.unpack(">IIBBBBB", payload)
    depths = {0: (1, 2, 4, 8, 16), 2: (8, 16), 3: (1, 2, 4, 8), 4: (8, 16), 6: (8, 16)}
    if not 0 < width <= 32768 or not 0 < height <= 32768 or width * height > 100_000_000:
        raise ValueError("PNG dimensions exceed inspection limits")
    if depth not in depths.get(color, ()) or compression != 0 or filtering != 0 or interlace not in (0, 1):
        raise ValueError("Invalid PNG encoding")
    return {"width": width, "height": height, "bit_depth": depth, "color_type": color,
            "interlaced": bool(interlace), "alpha_channel": color in (4, 6)}


def _metadata_mentions(payload: bytes) -> set[str]:
    mentions = set()
    for match in re.finditer(rb"gpt-image", payload):
        start = match.start()
        # Read only a directly preceding CBOR text length, not claims or signatures.
        for prefix_size in (1, 2, 3, 5):
            prefix = payload[max(0, start - prefix_size):start]
            if len(prefix) != prefix_size:
                continue
            if prefix_size == 1 and 0x60 <= prefix[0] <= 0x77:
                length = prefix[0] - 0x60
            elif prefix_size > 1 and prefix[0] == {2: 0x78, 3: 0x79, 5: 0x7A}[prefix_size]:
                length = int.from_bytes(prefix[1:], "big")
            else:
                continue
            value = payload[start:start + min(length, 129)]
            if len(value) == length <= 128 and MODEL_IDENTIFIER.fullmatch(value):
                mentions.add(value.decode("ascii"))
                break
        else:
            token = MODEL_IDENTIFIER.match(payload, start)
            before, after = payload[max(0, start - 1):start], payload[token.end():token.end() + 1]
            if not re.search(rb"[a-zA-Z0-9_.-]", before + after):
                mentions.add(token.group().decode("ascii"))
        if len(mentions) > 128:
            raise ValueError("Too many PNG metadata model mentions")
    return mentions


def inspect_png(data: bytes) -> dict:
    """Validate PNG structure, without decoding pixels or verifying C2PA signatures."""
    info = {}
    palette_entries = 0
    transparency = False
    image_data = 0
    data_started = False
    data_ended = False
    mentions = set()
    for kind, payload in _chunks(data):
        if kind == b"IHDR":
            if info:
                raise ValueError("Duplicate IHDR")
            info = _header(payload)
        elif kind == b"PLTE":
            if palette_entries or data_started or transparency or info["color_type"] in (0, 4):
                raise ValueError("Invalid PNG palette placement")
            if not len(payload) or len(payload) % 3 or len(payload) > 768:
                raise ValueError("Invalid PNG palette")
            palette_entries = len(payload) // 3
            if info["color_type"] == 3 and palette_entries > 2 ** info["bit_depth"]:
                raise ValueError("PNG palette exceeds bit depth")
        elif kind == b"tRNS":
            color = info["color_type"]
            valid = (color == 0 and len(payload) == 2) or (color == 2 and len(payload) == 6)
            valid = valid or (color == 3 and 0 < len(payload) <= palette_entries)
            if transparency or data_started or not valid:
                raise ValueError("Invalid PNG transparency chunk")
            transparency = True
        elif kind == b"IDAT":
            if data_ended or (info["color_type"] == 3 and not palette_entries):
                raise ValueError("Invalid PNG image data placement")
            data_started = True
            image_data += len(payload)
        elif kind == b"caBX":
            if len(payload) > 4 * 1024 * 1024:
                raise ValueError("PNG caBX metadata exceeds 4 MiB")
            mentions.update(_metadata_mentions(payload))
            if len(mentions) > 128:
                raise ValueError("Too many PNG metadata model mentions")
        if kind != b"IDAT" and data_started:
            data_ended = True
    if not image_data:
        raise ValueError("PNG has no image data")
    candidates = {match.group(1) for value in mentions
                  if (match := re.match(r"gpt-image-(\d+(?:\.\d+)*)(?:-|$)", value))}
    return {**info, "format": "png", "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(),
            "transparency_chunk": transparency, "transparency_supported": info["alpha_channel"] or transparency,
            "actual_transparent_pixels": None, "structure_validation": "passed",
            "pixel_validation": "not performed", "metadata_model_mentions": sorted(mentions),
            "metadata_version_candidates": sorted(candidates), "model_verification": "unverified",
            "signature_verification": "not performed"}


def _write_manifest(path: Path, manifest: dict, force: bool) -> None:
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", encoding="utf-8", dir=path.parent,
                                         prefix=f".{path.name}.", suffix=".partial", delete=False) as handle:
            temporary = Path(handle.name)
            json.dump(manifest, handle, ensure_ascii=True, indent=2)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        if force:
            os.replace(temporary, path)
        else:
            os.link(temporary, path)  # Atomic create fails if any competing writer owns this name.
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def record_manifest(output: Path, prompt: str, references: list[Path], route: str,
                    source: str, revised_prompt: str | None = None, force: bool = False) -> Path:
    """Save exact submitted text and unverified output evidence beside a valid PNG."""
    if not prompt.strip() or len(prompt.encode("utf-8")) > MAX_PROMPT_BYTES:
        raise ValueError("Prompt must be nonempty and no larger than 1 MiB")
    if revised_prompt is not None and len(revised_prompt.encode("utf-8")) > MAX_PROMPT_BYTES:
        raise ValueError("Revised prompt exceeds 1 MiB")
    if len(references) > MAX_REFERENCES:
        raise ValueError("At most 16 references may be recorded")
    if not route.strip() or not source.strip() or len(route) > 128 or len(source) > 4096:
        raise ValueError("Provide a route of at most 128 and a source of at most 4096 characters")
    output = Path(os.path.abspath(output.expanduser()))
    info = inspect_png(read_bounded(output))
    reference_records = []
    for reference in references:
        reference = reference.expanduser().resolve(strict=True)
        data = read_bounded(reference)
        reference_records.append({"path": str(reference), "sha256": hashlib.sha256(data).hexdigest()})
    manifest = {"schema_version": 1, "created_at": datetime.now(timezone.utc).isoformat(),
                "submitted_prompt": prompt, "revised_prompt": revised_prompt,
                "references": reference_records, "generation_route": route, "artifact_source": source,
                "output": {"path": str(output), **info}}
    destination = output.with_name(output.name + ".json")
    _write_manifest(destination, manifest, force)
    return destination


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path)
    parser.add_argument("--record", action="store_true")
    parser.add_argument("--prompt-file", type=Path)
    parser.add_argument("--ref", type=Path, action="append", default=[])
    parser.add_argument("--route")
    parser.add_argument("--source")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args(argv)
    try:
        if args.record:
            if args.prompt_file is None or args.route is None or args.source is None:
                parser.error("--record requires --prompt-file, --route, and --source")
            prompt = read_bounded(args.prompt_file.expanduser(), MAX_PROMPT_BYTES).decode("utf-8")
            result = {"manifest": str(record_manifest(args.image, prompt, args.ref, args.route, args.source, force=args.force))}
        else:
            if args.prompt_file is not None or args.ref or args.route is not None or args.source is not None or args.force:
                parser.error("Recording options require --record")
            result = inspect_png(read_bounded(args.image.expanduser()))
        print(json.dumps(result, indent=2))
        return 0
    except (OSError, ValueError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
