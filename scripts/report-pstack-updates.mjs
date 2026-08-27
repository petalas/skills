import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizePstackSemanticBytes, sha256 } from "./lib/pstack-normalization.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const manifestPath = resolve(repositoryRoot, "docs", "pstack-imports.json");
const sourceRoot = resolve(
  process.env.PSTACK_SOURCE_ROOT ?? resolve(repositoryRoot, "..", "plugins", "pstack")
);
const candidateRef = process.argv.slice(2).find((argument) => argument !== "--") ?? "HEAD";
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

function git(args, options = {}) {
  return execFileSync("git", ["-C", options.cwd ?? sourceRoot, ...args], {
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024
  }).trim();
}

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function expandBraces(pattern) {
  const match = pattern.match(/\{([^{}]+)\}/);
  if (!match) return [pattern];
  return match[1]
    .split(",")
    .flatMap((choice) =>
      expandBraces(
        `${pattern.slice(0, match.index)}${choice}${pattern.slice((match.index ?? 0) + match[0].length)}`
      )
    );
}

function globRegex(pattern) {
  let expression = "";
  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === "*" && pattern[index + 1] === "*") {
      expression += ".*";
      index += 1;
    } else if (character === "*") {
      expression += "[^/]*";
    } else if (character === "?") {
      expression += "[^/]";
    } else {
      expression += escapeRegex(character);
    }
  }
  return new RegExp(`^${expression}$`);
}

const exclusionMatchers = (manifest.exclusions ?? []).flatMap((exclusion) =>
  expandBraces(exclusion.source).map((pattern) => ({
    exclusion,
    pattern,
    regex: globRegex(pattern)
  }))
);

const mappedSources = new Map();
for (const imported of manifest.imports ?? []) {
  for (const mapping of imported.mappings ?? []) {
    const owners = mappedSources.get(mapping.source) ?? [];
    owners.push(`${imported.name}:${mapping.destination}`);
    mappedSources.set(mapping.source, owners);
  }
}

const gitRoot = git(["rev-parse", "--show-toplevel"]);
const baselineCommit = git(["rev-parse", "--verify", `${manifest.sourceCommit}^{commit}`], {
  cwd: gitRoot
});
const candidateCommit = git(["rev-parse", "--verify", `${candidateRef}^{commit}`], {
  cwd: gitRoot
});
const treePrefix = relative(gitRoot, sourceRoot).split("\\").join("/");

if (treePrefix === ".." || treePrefix.startsWith("../")) {
  throw new Error(`pstack source root is outside its Git repository: ${sourceRoot}`);
}

function sourcePath(path) {
  const normalized = path.split("\\").join("/");
  if (!treePrefix) return normalized;
  const prefix = `${treePrefix}/`;
  if (!normalized.startsWith(prefix)) {
    throw new Error(`changed path is outside the pstack source root: ${normalized}`);
  }
  return normalized.slice(prefix.length);
}

function treePath(source) {
  return treePrefix ? `${treePrefix}/${source}` : source;
}

function candidateBlob(source) {
  try {
    return execFileSync("git", ["-C", gitRoot, "show", `${candidateCommit}:${treePath(source)}`], {
      encoding: null,
      maxBuffer: 16 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"]
    });
  } catch {
    return null;
  }
}

const diff = git(
  ["diff", "--name-status", "--find-renames", baselineCommit, candidateCommit, "--", treePrefix],
  { cwd: gitRoot }
);
const changes = diff
  ? diff.split("\n").map((line) => {
      const fields = line.split("\t");
      const status = fields[0];
      const paths = fields.slice(1).map(sourcePath);
      return { status, paths };
    })
  : [];

function classify(paths) {
  const imports = [...new Set(paths.flatMap((path) => mappedSources.get(path) ?? []))].sort();
  const exclusions = [
    ...new Set(
      paths.flatMap((path) =>
        exclusionMatchers
          .filter((matcher) => matcher.regex.test(path))
          .map((matcher) => matcher.exclusion.source)
      )
    )
  ].sort();

  if (imports.length > 0) return { classification: "imported", details: imports };
  if (exclusions.length > 0) return { classification: "excluded", details: exclusions };
  return { classification: "review", details: [] };
}

function tableCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

const rows = changes.flatMap((change) =>
  change.paths.map((path, index) => ({
    status:
      change.paths.length > 1 ? `${change.status} ${index === 0 ? "from" : "to"}` : change.status,
    path,
    ...classify([path])
  }))
);
const counts = new Map(["imported", "excluded", "review"].map((name) => [name, 0]));
for (const row of rows) counts.set(row.classification, (counts.get(row.classification) ?? 0) + 1);

console.log("# Pstack update report\n");
console.log(`- Source root: \`${sourceRoot}\``);
console.log(`- Baseline: \`${baselineCommit}\``);
console.log(`- Candidate: \`${candidateCommit}\``);
console.log(`- Changed paths: ${rows.length}`);
console.log(
  `- Classifications: ${counts.get("imported")} imported, ${counts.get("excluded")} excluded, ${counts.get("review")} review`
);

if (rows.length === 0) {
  console.log("\nNo pstack paths changed.");
  process.exit(0);
}

console.log("\n| Status | Classification | Upstream path | Current rule |");
console.log("| --- | --- | --- | --- |");
for (const row of rows) {
  console.log(
    `| ${tableCell(row.status)} | ${row.classification} | \`${tableCell(row.path)}\` | ${tableCell(row.details.join(", ") || "none")} |`
  );
}

const changedMappedSources = [
  ...new Set(changes.flatMap((change) => change.paths).filter((path) => mappedSources.has(path)))
].sort();

if (changedMappedSources.length > 0) {
  console.log("\n## Candidate hashes for mapped sources\n");
  console.log("| Upstream path | Source SHA-256 | Normalized SHA-256 |");
  console.log("| --- | --- | --- |");
  for (const source of changedMappedSources) {
    const blob = candidateBlob(source);
    if (!blob) {
      console.log(`| \`${tableCell(source)}\` | missing | missing |`);
      continue;
    }
    const normalized = await normalizePstackSemanticBytes(blob, source);
    console.log(`| \`${tableCell(source)}\` | \`${sha256(blob)}\` | \`${sha256(normalized)}\` |`);
  }
}
