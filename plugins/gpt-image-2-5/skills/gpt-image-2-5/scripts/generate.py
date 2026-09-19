#!/usr/bin/env python3
"""Generate one image through a subscription-authenticated Codex CLI session."""

from __future__ import annotations

import argparse
import base64
import binascii
import hashlib
import json
import os
from pathlib import Path
import re
import shlex
import shutil
import signal
import subprocess
import sys
import tempfile
import time

from inspect_image import (
    MAX_PROMPT_BYTES, MAX_REFERENCES, inspect_png, read_bounded, record_manifest,
)

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
MAX_EVENT_NODES = 100_000
MAX_EVENT_BYTES = 128 * 1024 * 1024
MAX_IMAGE_BYTES = 64 * 1024 * 1024
MAX_ARTIFACT_IDS = 64
MAX_DIRECTORY_ENTRIES = 1024


class RunnerError(Exception):
    """A user-facing runner failure with a stable exit code."""

    def __init__(self, message: str, exit_code: int) -> None:
        super().__init__(message)
        self.exit_code = exit_code


def image_format(data: bytes) -> str | None:
    """Return the recognized image format for bytes supported by the runner."""
    if data.startswith(PNG_SIGNATURE):
        return "png"
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
    parser.add_argument("--require-model")
    return parser.parse_args(argv)


def read_prompt(args: argparse.Namespace) -> str:
    if args.prompt is not None:
        prompt = args.prompt
    elif args.prompt_file is not None:
        try:
            prompt = read_bounded(Path(os.path.expanduser(args.prompt_file)), MAX_PROMPT_BYTES).decode("utf-8")
        except (OSError, ValueError) as error:
            raise RunnerError(f"Cannot read prompt file: {error}", 2) from error
    else:
        raise RunnerError("Missing --prompt", 2)
    if not prompt.strip() or len(prompt.encode("utf-8")) > MAX_PROMPT_BYTES:
        raise RunnerError("Prompt must be nonempty and no larger than 1 MiB", 2)
    return prompt


def resolve_inputs(args: argparse.Namespace) -> tuple[int, Path, list[Path]]:
    if args.require_model is not None:
        raise RunnerError(
            "This subscription route cannot pin an image model. Exact image-model slugs "
            "are API-only in the examined Codex CLI; no generation was started.",
            10,
        )
    try:
        timeout = int(args.timeout_sec)
    except ValueError as error:
        raise RunnerError("--timeout-sec must be an integer greater than zero", 2) from error
    if timeout <= 0:
        raise RunnerError("--timeout-sec must be an integer greater than zero", 2)

    out_arg = args.out or f"image-{time.strftime('%Y%m%d-%H%M%S', time.gmtime())}.png"
    output = Path(os.path.abspath(os.path.expanduser(out_arg)))
    if output.suffix.lower() != ".png":
        raise RunnerError("--out must end in .png; the runner does not convert formats", 2)
    if os.path.lexists(output) and not args.force:
        raise RunnerError(f"Output already exists: {output}", 8)

    if len(args.ref) > MAX_REFERENCES:
        raise RunnerError(f"At most {MAX_REFERENCES} reference images are supported", 2)
    references = [Path(os.path.abspath(os.path.expanduser(value))) for value in args.ref]
    for reference in references:
        if not reference.is_file() or not os.access(reference, os.R_OK):
            raise RunnerError(f"Reference image is not a readable file: {reference}", 4)
        if reference.stat().st_size > MAX_IMAGE_BYTES:
            raise RunnerError(f"Reference image exceeds 64 MiB: {reference}", 4)
    validate_destinations(args, output, references)
    return timeout, output, references


def validate_destinations(args: argparse.Namespace, output: Path, references: list[Path]) -> None:
    destinations = [output, output.with_name(output.name + ".json")]
    if args.json_log:
        destinations.append(Path(os.path.abspath(os.path.expanduser(args.json_log))))
    inputs = references + ([Path(args.prompt_file).expanduser()] if args.prompt_file else [])
    input_paths = {path.resolve() for path in inputs}
    resolved = [path.resolve() for path in destinations]
    if len(set(resolved)) != len(resolved) or input_paths.intersection(resolved):
        raise RunnerError("Output, manifest and log must be distinct from each other and input files", 2)
    ensure_available(destinations, args.force)


def ensure_available(destinations: list[Path], force: bool) -> None:
    for path in destinations:
        if path.is_dir():
            raise RunnerError(f"Destination is a directory: {path}", 2)
        if os.path.lexists(path) and not force:
            raise RunnerError(f"Output already exists: {path}", 8)


def require_chatgpt_login() -> str:
    codex = shutil.which("codex")
    if codex is None:
        raise RunnerError("codex CLI not found on PATH", 3)
    try:
        status = subprocess.run(
            [codex, "login", "status"], capture_output=True, text=True, check=False, timeout=15
        )
    except subprocess.TimeoutExpired as error:
        raise RunnerError("codex login status timed out", 6) from error
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
    # Spool process output so a verbose child cannot grow Python's pipe buffers.
    with tempfile.TemporaryFile() as events, tempfile.TemporaryFile() as errors:
        process = subprocess.Popen(
            argv,
            stdin=subprocess.PIPE,
            stdout=events,
            stderr=errors,
            text=True,
            start_new_session=True,
        )
        try:
            process.communicate(input=instruction, timeout=timeout)
        except subprocess.TimeoutExpired as error:
            os.killpg(os.getpgid(process.pid), signal.SIGKILL)
            process.communicate()
            raise RunnerError("codex exec timed out", 6) from error
        if process.returncode != 0:
            errors.seek(max(0, errors.tell() - 16_384))
            stderr = errors.read(16_384).decode("utf-8", errors="replace")
            stderr_tail = "\n".join(stderr.splitlines()[-20:])
            raise RunnerError(f"codex exec failed:\n{stderr_tail}", 5)
        if events.tell() > MAX_EVENT_BYTES:
            raise RunnerError("codex event stream is too large", 7)
        events.seek(0)
        return events.read(MAX_EVENT_BYTES).decode("utf-8", errors="replace")


def collect_events(stdout: str) -> tuple[list[str], list[str], list[str], str | None]:
    if len(stdout) > MAX_EVENT_BYTES:
        raise RunnerError("codex event stream is too large", 7)
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
        except RecursionError as error:
            raise RunnerError("codex event nesting is too deep", 7) from error
        stack = [root]
        while stack:
            nodes_seen += 1
            if nodes_seen > MAX_EVENT_NODES:
                raise RunnerError("codex event stream is too large", 7)
            node = stack.pop()
            if isinstance(node, dict):
                if node is root and node.get("type") == "thread.started":
                    add_artifact_id(thread_ids, node.get("thread_id"))
                if node.get("type") == "image_generation_call":
                    image_id = node.get("id")
                    if isinstance(image_id, str) and image_id.startswith("ig_"):
                        add_artifact_id(image_ids, image_id)
                    result = node.get("result")
                    if isinstance(result, str) and result and result not in payloads:
                        if len(payloads) >= MAX_ARTIFACT_IDS:
                            raise RunnerError("Too many image payloads in codex events", 7)
                        payloads.append(result)
                    candidate = node.get("revised_prompt")
                    if isinstance(candidate, str) and candidate:
                        revised_prompt = candidate
                stack.extend(node.values())
            elif isinstance(node, list):
                stack.extend(node)
    return thread_ids, image_ids, payloads, revised_prompt


def add_artifact_id(identifiers: list[str], value: object) -> None:
    if not isinstance(value, str) or re.fullmatch(r"[A-Za-z0-9_-]{1,128}", value) is None:
        raise RunnerError("Invalid artifact identifier in codex events", 7)
    if value not in identifiers:
        if len(identifiers) >= MAX_ARTIFACT_IDS:
            raise RunnerError("Too many artifact identifiers in codex events", 7)
        identifiers.append(value)


def owned_path(root: Path, *parts: str) -> Path:
    candidate = root.joinpath(*parts)
    if candidate.is_symlink() or not candidate.resolve().is_relative_to(root.resolve()):
        raise RunnerError("Image artifact path escapes its owned directory", 7)
    return candidate


def read_valid_image(path: Path) -> bytes | None:
    try:
        if path.stat().st_size > MAX_IMAGE_BYTES:
            raise RunnerError("Image artifact exceeds the 64 MiB limit", 7)
        with path.open("rb") as stream:
            data = stream.read(MAX_IMAGE_BYTES + 1)
    except OSError:
        return None
    if len(data) > MAX_IMAGE_BYTES:
        raise RunnerError("Image artifact exceeds the 64 MiB limit", 7)
    return data if data and image_format(data) is not None else None


def recent_images(directory: Path, run_start: float) -> list[Path]:
    """Inspect only the current invocation's bounded thread directory."""
    candidates: list[Path] = []
    try:
        with os.scandir(directory) as entries:
            for index, entry in enumerate(entries):
                if index >= MAX_DIRECTORY_ENTRIES:
                    raise RunnerError("Image thread directory exceeds the 1024-entry limit", 7)
                if (
                    entry.name.endswith(".png")
                    and entry.name.startswith(("ig_", "exec-"))
                    and entry.is_file()
                    and entry.stat().st_mtime >= run_start - 5
                ):
                    candidates.append(owned_path(directory, entry.name))
        return candidates
    except OSError:
        return []


def unique_artifact(
    selected: tuple[bytes, str, str] | None, candidate: tuple[bytes, str, str]
) -> tuple[bytes, str, str]:
    if selected is not None and selected[0] != candidate[0]:
        raise RunnerError("Multiple distinct image artifacts found; refusing to choose", 7)
    return candidate if selected is None else selected


def resolve_artifact(
    generated_root: Path,
    run_start: float,
    thread_ids: list[str],
    image_ids: list[str],
    payloads: list[str],
) -> tuple[bytes, str, str]:
    selected: tuple[bytes, str, str] | None = None
    for payload in payloads:
        if len(payload) > 4 * ((MAX_IMAGE_BYTES + 2) // 3):
            raise RunnerError("Image payload exceeds the 64 MiB limit", 7)
        try:
            data = base64.b64decode(payload, validate=True)
        except (binascii.Error, ValueError):
            continue
        if len(data) <= MAX_IMAGE_BYTES and image_format(data) is not None:
            selected = unique_artifact(
                selected, (data, "event-payload", "image_generation_call result")
            )
    if selected is not None:
        return selected
    if len(thread_ids) > 1:
        raise RunnerError("Multiple thread.started identifiers found; refusing to choose", 7)
    for thread_id in thread_ids:
        directory = owned_path(generated_root, thread_id)
        for image_id in image_ids:
            candidate = owned_path(directory, f"{image_id}.png")
            data = read_valid_image(candidate)
            if data is not None:
                selected = unique_artifact(selected, (data, "thread-id", str(candidate)))
    if selected is not None:
        return selected
    for thread_id in thread_ids:
        directory = owned_path(generated_root, thread_id)
        for candidate in recent_images(directory, run_start):
            data = read_valid_image(candidate)
            if data is not None:
                selected = unique_artifact(selected, (data, "thread-directory", str(candidate)))
    if selected is not None:
        return selected
    raise RunnerError("No image artifact found (check image entitlement, quota, or refusal).", 7)


def write_output(data: bytes, output: Path, force: bool = False) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    partial: Path | None = None
    try:
        with tempfile.NamedTemporaryFile(
            dir=output.parent, prefix=f".{output.name}.", suffix=".partial", delete=False
        ) as stream:
            partial = Path(stream.name)
            if stream.write(data) != len(data):
                raise RunnerError("Incomplete image write", 5)
        if force:
            os.replace(partial, output)
        else:
            os.link(partial, output)
    except FileExistsError as error:
        raise RunnerError(f"Output already exists: {output}", 8) from error
    except OSError as error:
        raise RunnerError(f"Cannot write output image: {error}", 5) from error
    finally:
        if partial is not None:
            partial.unlink(missing_ok=True)


def snapshot_references(references: list[Path]) -> dict[Path, str]:
    try:
        return {path: hashlib.sha256(read_bounded(path)).hexdigest() for path in references}
    except (OSError, ValueError) as error:
        raise RunnerError(f"Cannot snapshot generation references: {error}", 7) from error


def save_artifact(data: bytes, output: Path, prompt: str, references: list[Path],
                  source: str, revised_prompt: str | None, force: bool,
                  reference_hashes: dict[Path, str]) -> None:
    if revised_prompt is not None and len(revised_prompt.encode("utf-8")) > MAX_PROMPT_BYTES:
        raise RunnerError("Revised prompt exceeds 1 MiB", 7)
    if snapshot_references(references) != reference_hashes:
        raise RunnerError("Reference files changed during generation; output was not saved", 7)
    try:
        info = inspect_png(data)
    except ValueError as error:
        raise RunnerError(f"Invalid PNG artifact: {error}", 7) from error
    ensure_available([output, output.with_name(output.name + ".json")], force)
    print("model verification: unverified (subscription selection not pinned)", file=sys.stderr)
    print(f"metadata model mentions: {info['metadata_model_mentions']}", file=sys.stderr)
    write_output(data, output, force)
    try:
        manifest = record_manifest(output, prompt, references, "codex-cli", source,
                                   revised_prompt=revised_prompt, force=force)
    except FileExistsError as error:
        raise RunnerError(f"Manifest already exists: {output}.json", 8) from error
    print(f"manifest: {manifest}", file=sys.stderr)


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
        reference_hashes = snapshot_references(references)
        run_start = time.time()
        stdout = run_codex(command, build_instruction(prompt, bool(references)), timeout)
        if args.json_log:
            log_path = Path(os.path.abspath(os.path.expanduser(args.json_log)))
            write_output(stdout.encode("utf-8"), log_path, args.force)
        thread_ids, image_ids, payloads, revised_prompt = collect_events(stdout)
        data, tier, source = resolve_artifact(
            generated_root, run_start, thread_ids, image_ids, payloads
        )
        print(f"artifact tier: {tier} ({source})", file=sys.stderr)
        save_artifact(data, output, prompt, references, source, revised_prompt, args.force, reference_hashes)
        print(output)
        return 0
    except RunnerError as error:
        print(error, file=sys.stderr)
        return error.exit_code
    except (OSError, ValueError) as error:
        print(f"Runner I/O or recording failure: {error}", file=sys.stderr)
        return 5


if __name__ == "__main__":
    raise SystemExit(main())
