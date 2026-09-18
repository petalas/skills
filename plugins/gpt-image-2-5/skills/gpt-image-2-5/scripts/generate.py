#!/usr/bin/env python3
"""Generate one image through a subscription-authenticated Codex CLI session."""

from __future__ import annotations

import argparse
import base64
import binascii
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import signal
import subprocess
import sys
import time

IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp"}
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
JPEG_SIGNATURE = b"\xff\xd8\xff"
WEBP_SIGNATURE = b"RIFF"
MAX_EVENT_NODES = 100_000


class RunnerError(Exception):
    """A user-facing runner failure with a stable exit code."""

    def __init__(self, message: str, exit_code: int) -> None:
        super().__init__(message)
        self.exit_code = exit_code


def image_format(data: bytes) -> str | None:
    """Return the recognized image format for bytes supported by the runner."""
    if data.startswith(PNG_SIGNATURE):
        return "png"
    if data.startswith(JPEG_SIGNATURE):
        return "jpeg"
    if data.startswith(WEBP_SIGNATURE) and data[8:12] == b"WEBP":
        return "webp"
    return None


def read_provenance(image_bytes: bytes) -> str | None:
    """Read the gpt-image software agent and version from a PNG caBX chunk."""
    try:
        if not image_bytes.startswith(PNG_SIGNATURE):
            return None
        offset = len(PNG_SIGNATURE)
        max_chunks = len(image_bytes) // 12 + 1
        for _ in range(max_chunks):
            if offset + 12 > len(image_bytes):
                break
            length = int.from_bytes(image_bytes[offset : offset + 4], "big")
            chunk_end = offset + 12 + length
            if chunk_end > len(image_bytes):
                return None
            chunk_type = image_bytes[offset + 4 : offset + 8]
            payload = image_bytes[offset + 8 : offset + 8 + length]
            if chunk_type == b"caBX":
                name_at = payload.find(b"gpt-image")
                if name_at < 0:
                    return None
                evidence = payload[name_at : name_at + 128]
                match = re.search(rb"version.{0,64}?([0-9]+\.[0-9]+)", evidence, re.DOTALL)
                return f"gpt-image {match.group(1).decode('ascii')}" if match else None
            offset = chunk_end
    except (OverflowError, ValueError):
        return None
    return None


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    prompt_group = parser.add_mutually_exclusive_group()
    prompt_group.add_argument("--prompt")
    prompt_group.add_argument("--prompt-file")
    parser.add_argument("--out")
    parser.add_argument("--ref", action="append", default=[])
    parser.add_argument("--timeout-sec", default="300")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--json-log")
    return parser.parse_args(argv)


def read_prompt(args: argparse.Namespace) -> str:
    if args.prompt is not None:
        prompt = args.prompt
    elif args.prompt_file is not None:
        try:
            prompt = Path(os.path.expanduser(args.prompt_file)).read_text()
        except OSError as error:
            raise RunnerError(f"Cannot read prompt file: {error}", 2) from error
    else:
        raise RunnerError("Missing --prompt", 2)
    if not prompt.strip():
        raise RunnerError("Missing --prompt", 2)
    return prompt


def resolve_inputs(args: argparse.Namespace) -> tuple[int, Path, list[Path]]:
    try:
        timeout = int(args.timeout_sec)
    except ValueError as error:
        raise RunnerError("--timeout-sec must be an integer greater than zero", 2) from error
    if timeout <= 0:
        raise RunnerError("--timeout-sec must be an integer greater than zero", 2)

    out_arg = args.out or f"image-{time.strftime('%Y%m%d-%H%M%S', time.gmtime())}.png"
    output = Path(os.path.abspath(os.path.expanduser(out_arg)))
    if output.suffix.lower() not in IMAGE_SUFFIXES:
        raise RunnerError("--out must end in .png, .jpg, .jpeg, or .webp", 2)
    if output.exists() and not args.force:
        raise RunnerError(f"Output already exists: {output}", 8)

    references = [Path(os.path.abspath(os.path.expanduser(value))) for value in args.ref]
    for reference in references:
        if not reference.is_file() or not os.access(reference, os.R_OK):
            raise RunnerError(f"Reference image is not a readable file: {reference}", 4)
    return timeout, output, references


def require_chatgpt_login() -> str:
    codex = shutil.which("codex")
    if codex is None:
        raise RunnerError("codex CLI not found on PATH", 3)
    status = subprocess.run(
        [codex, "login", "status"], capture_output=True, text=True, check=False
    )
    status_output = status.stdout + status.stderr
    if status.returncode != 0 or "Logged in using ChatGPT" not in status_output:
        raise RunnerError(
            "No ChatGPT subscription login detected. Run codex login and choose the ChatGPT option.",
            9,
        )
    return codex


def build_instruction(prompt: str, has_references: bool) -> str:
    lines = [
        "Use the built-in image generation tool to create exactly one image that satisfies the request below.",
        "",
        "Rules:",
        "- Generate exactly one image with the built-in image generation tool. Do not produce SVG, HTML, CSS, code, or placeholder files.",
        "- Do not write, move, or copy any files.",
        "- Reply with one short line describing the image.",
    ]
    if has_references:
        lines.append(
            "- The attached image files are inputs for this request. Treat the first one as the edit target unless the request says otherwise, and the rest as references."
        )
    lines.extend(["", "Request:", prompt])
    return "\n".join(lines)


def codex_argv(codex: str, references: list[Path]) -> list[str]:
    argv = [
        codex,
        "exec",
        "--json",
        "--skip-git-repo-check",
        "--sandbox",
        "read-only",
        "--color",
        "never",
    ]
    for reference in references:
        argv.extend(["-i", str(reference)])
    return argv


def run_codex(argv: list[str], instruction: str, timeout: int) -> str:
    process = subprocess.Popen(
        argv,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        start_new_session=True,
    )
    try:
        stdout, stderr = process.communicate(input=instruction, timeout=timeout)
    except subprocess.TimeoutExpired as error:
        os.killpg(os.getpgid(process.pid), signal.SIGKILL)
        process.communicate()
        raise RunnerError("codex exec timed out", 6) from error
    if process.returncode != 0:
        stderr_tail = "\n".join(stderr.splitlines()[-20:])
        message = "codex exec failed"
        if stderr_tail:
            message = f"{message}:\n{stderr_tail}"
        raise RunnerError(message, 5)
    return stdout


def collect_events(stdout: str) -> tuple[list[str], list[str], list[str], str | None]:
    thread_ids: list[str] = []
    image_ids: list[str] = []
    payloads: list[str] = []
    revised_prompt: str | None = None
    nodes_seen = 0
    for line in stdout.splitlines():
        try:
            root = json.loads(line)
        except json.JSONDecodeError:
            continue
        stack = [root]
        while stack:
            nodes_seen += 1
            if nodes_seen > MAX_EVENT_NODES:
                raise RunnerError("codex event stream is too large", 7)
            node = stack.pop()
            if isinstance(node, dict):
                thread_id = node.get("thread_id")
                if isinstance(thread_id, str) and thread_id not in thread_ids:
                    thread_ids.append(thread_id)
                image_id = node.get("id")
                if isinstance(image_id, str) and image_id.startswith("ig_"):
                    image_ids.append(image_id)
                if node.get("type") == "image_generation_call":
                    result = node.get("result")
                    if isinstance(result, str) and result:
                        payloads.append(result)
                    candidate = node.get("revised_prompt")
                    if isinstance(candidate, str) and candidate:
                        revised_prompt = candidate
                stack.extend(node.values())
            elif isinstance(node, list):
                stack.extend(node)
    return thread_ids, image_ids, payloads, revised_prompt


def read_valid_image(path: Path) -> bytes | None:
    try:
        data = path.read_bytes()
    except OSError:
        return None
    return data if data and image_format(data) is not None else None


def recent_images(directory: Path, run_start: float) -> list[Path]:
    """Return recent Codex-generated PNGs in newest-first order."""
    candidates: list[Path] = []
    try:
        for path in directory.glob("*.png"):
            if (
                path.is_file()
                and (path.name.startswith("ig_") or path.name.startswith("exec-"))
                and path.stat().st_mtime >= run_start - 5
            ):
                candidates.append(path)
        return sorted(candidates, key=lambda path: path.stat().st_mtime, reverse=True)
    except OSError:
        return []


def resolve_artifact(
    generated_root: Path,
    old_directories: set[str],
    run_start: float,
    thread_ids: list[str],
    image_ids: list[str],
    payloads: list[str],
) -> tuple[bytes, str, str]:
    for thread_id in thread_ids:
        for image_id in image_ids:
            candidate = generated_root / thread_id / f"{image_id}.png"
            data = read_valid_image(candidate)
            if data is not None:
                return data, "thread-id", str(candidate)
    for thread_id in thread_ids:
        directory = generated_root / thread_id
        for candidate in recent_images(directory, run_start):
            data = read_valid_image(candidate)
            if data is not None:
                return data, "thread-directory", str(candidate)

    current_directories = snapshot_directories(generated_root)
    new_directories = current_directories - old_directories
    if len(new_directories) == 1:
        directory = generated_root / next(iter(new_directories))
        candidates = recent_images(directory, run_start)
        for candidate in candidates:
            data = read_valid_image(candidate)
            if data is not None:
                return data, "new-directory", str(candidate)
    elif len(new_directories) > 1:
        raise RunnerError("No image artifact found: multiple new image directories", 7)

    for payload in payloads:
        try:
            data = base64.b64decode(payload, validate=True)
        except (binascii.Error, ValueError):
            continue
        if image_format(data) is not None:
            return data, "event-payload", "image_generation_call result"
    raise RunnerError("No image artifact found (check image entitlement, quota, or refusal).", 7)


def snapshot_directories(root: Path) -> set[str]:
    try:
        return {entry.name for entry in root.iterdir() if entry.is_dir()}
    except FileNotFoundError:
        return set()
    except OSError as error:
        raise RunnerError(f"Cannot read generated image directory: {error}", 7) from error


def write_output(data: bytes, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    partial = Path(f"{output}.partial")
    try:
        partial.write_bytes(data)
        os.replace(partial, output)
    except OSError as error:
        try:
            partial.unlink(missing_ok=True)
        except OSError:
            pass
        raise RunnerError(f"Cannot write output image: {error}", 5) from error


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    try:
        prompt = read_prompt(args)
        timeout, output, references = resolve_inputs(args)
        codex = require_chatgpt_login()
        command = codex_argv(codex, references)
        if args.dry_run:
            print(f"codex argv: {shlex.join(command)}")
            print(f"output: {output}")
            return 0

        codex_home = Path(os.environ.get("CODEX_HOME") or os.path.expanduser("~/.codex"))
        generated_root = codex_home / "generated_images"
        old_directories = snapshot_directories(generated_root)
        run_start = time.time()
        stdout = run_codex(command, build_instruction(prompt, bool(references)), timeout)
        if args.json_log:
            log_path = Path(os.path.abspath(os.path.expanduser(args.json_log)))
            log_path.parent.mkdir(parents=True, exist_ok=True)
            log_path.write_text(stdout)
        thread_ids, image_ids, payloads, revised_prompt = collect_events(stdout)
        data, tier, source = resolve_artifact(
            generated_root, old_directories, run_start, thread_ids, image_ids, payloads
        )
        print(f"artifact tier: {tier} ({source})", file=sys.stderr)
        provenance = read_provenance(data)
        print(f"provenance: {provenance or 'not reported'}", file=sys.stderr)
        if revised_prompt:
            print(f"revised prompt: {revised_prompt}", file=sys.stderr)
        write_output(data, output)
        print(output)
        return 0
    except RunnerError as error:
        print(error, file=sys.stderr)
        return error.exit_code
    except OSError as error:
        print(f"Runner I/O failure: {error}", file=sys.stderr)
        return 5


if __name__ == "__main__":
    raise SystemExit(main())
