import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(
  new URL("../plugins/show-me-your-work/skills/show-me-your-work/scripts/log.sh", import.meta.url)
);
const header = "ts\tphase\tdecision\twhy\tevidence\tresult";
const cells = ["verify", "keep fix", "header restored", "test output", "passed"];

function runLog(args, env = process.env) {
  const result = spawnSync("bash", [script, ...args], {
    encoding: "utf8",
    env,
    timeout: 5000,
    maxBuffer: 64 * 1024
  });
  if (result.error) throw result.error;
  return result;
}

function verifyNewLog(path) {
  const result = runLog([path, ...cells]);
  assert.equal(result.status, 0, result.stderr);
  const lines = readFileSync(path, "utf8").trimEnd().split("\n");
  assert.equal(lines[0], header);
  assert.equal(lines.length, 2);
  const [timestamp, ...writtenCells] = lines[1].split("\t");
  assert.match(timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  assert.deepEqual(writtenCells, cells);
}

const directory = mkdtempSync(join(tmpdir(), "decision-log-test-"));
try {
  verifyNewLog(join(directory, "new", "decisions.tsv"));
  const empty = join(directory, "empty.tsv");
  writeFileSync(empty, "");
  verifyNewLog(empty);

  const existing = readFileSync(empty, "utf8");
  const result = runLog([empty, "=phase", "+decision", "-why", "@evidence\tline\nbreak\r", "ok"]);
  assert.equal(result.status, 0, result.stderr);
  const appended = readFileSync(empty, "utf8");
  assert.equal(appended.slice(0, existing.length), existing);
  const row = appended.slice(existing.length).trimEnd().split("\t");
  assert.deepEqual(row.slice(1), [
    "'=phase",
    "'+decision",
    "'-why",
    "'@evidence line break ",
    "ok"
  ]);

  const fault = join(directory, "failed-file-check.bash");
  writeFileSync(
    fault,
    'function [ { case "$1:$2" in !:-s|!:-f) return 0 ;; esac; builtin [ "$@"; }\n'
  );
  const retry = runLog([empty, ...cells], { ...process.env, BASH_ENV: fault });
  assert.equal(retry.status, 0, retry.stderr);
  const recovered = readFileSync(empty, "utf8");
  assert.equal(recovered.slice(0, appended.length), appended);
  assert.equal(recovered.slice(appended.length).split("\n")[0], header);

  const invalid = runLog([empty]);
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /^usage: log\.sh /);
  assert.equal(readFileSync(empty, "utf8"), recovered);

  const failedWrite = runLog([directory, ...cells]);
  assert.notEqual(failedWrite.status, 0);
  assert.match(failedWrite.stderr, /directory/i);
} finally {
  rmSync(directory, { recursive: true, force: true });
}

console.log(
  "decision log: new, empty, append, failed file check, sanitization, argument and write failures passed"
);
