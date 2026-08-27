import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, posix, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { normalizePstackSemanticBytes, sha256 } from "./lib/pstack-normalization.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const pstackSourceRoot = resolve(
  process.env.PSTACK_SOURCE_ROOT ?? resolve(repositoryRoot, "..", "plugins", "pstack")
);
const manifestPath = join(repositoryRoot, "docs", "pstack-imports.json");
const inventoryPath = join(repositoryRoot, "docs", "research", "pstack-component-inventory.md");
const expectedSourceCommit = "799151d91b6e12ee7dbd09f708eec108d7de9b3b";
const expectedSemanticNormalization = "pstack-markdown-v1";
const exactSubagentCommunicationRule =
  "Subagents may communicate with each other, but no agent may communicate with a person.";
const exactChildPromptInstruction = "Repeat that sentence verbatim in every child prompt.";
const expectedPstackLicense = `MIT License

Copyright (c) 2026 Lauren Tan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
const failures = [];

function fail(message) {
  failures.push(message);
}

function readRequired(path) {
  if (!existsSync(path)) {
    fail(`missing ${relative(repositoryRoot, path)}`);
    return "";
  }

  return readFileSync(path, "utf8");
}

function parseFrontmatter(markdown, path) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    fail(`${relative(repositoryRoot, path)} has no YAML frontmatter`);
    return new Map();
  }

  const fields = new Map();
  for (const line of match[1].split("\n")) {
    const field = line.match(/^([a-z][a-z-]*):\s*(.+)$/);
    if (field) fields.set(field[1], field[2].replace(/^['"]|['"]$/g, ""));
  }
  return fields;
}

function collectTextFiles(path) {
  if (!existsSync(path)) return [];
  const entries = readdirSync(path).sort();
  return entries.flatMap((entry) => {
    const child = join(path, entry);
    if (statSync(child).isDirectory()) return collectTextFiles(child);
    return /\.(?:md|json|ya?ml|mjs|sh)$/.test(entry) ? [child] : [];
  });
}

function normalizeLicense(text) {
  return text.replace(/\r\n?/g, "\n").replace(/\n$/, "");
}

function isSafeRelativePath(path) {
  return (
    typeof path === "string" &&
    path.length > 0 &&
    !path.includes("\\") &&
    !posix.isAbsolute(path) &&
    posix.normalize(path) === path &&
    path !== "." &&
    !path.startsWith("../")
  );
}

function inventoryEntries() {
  const inventory = readRequired(inventoryPath);
  const entries = new Map();
  for (const line of inventory.split("\n")) {
    const classification = line.match(/\|\s*(Copy|Adapt|Extract concept|Exclude)\s*\|/);
    if (!classification) continue;
    const destination = line.split("|").at(-2)?.trim() ?? "";
    for (const sourceMatch of line.matchAll(/\/pstack\/([^)\s]+)\)/g)) {
      const source = sourceMatch[1];
      const previous = entries.get(source);
      if (
        previous &&
        (previous.classification !== classification[1] || previous.destination !== destination)
      ) {
        fail(`${relative(repositoryRoot, inventoryPath)} classifies ${source} twice`);
      }
      entries.set(source, { classification: classification[1], destination });
    }
  }
  return entries;
}

function optionalSourceAuditContext() {
  if (!existsSync(pstackSourceRoot)) return null;
  try {
    const gitRoot = execFileSync("git", ["-C", pstackSourceRoot, "rev-parse", "--show-toplevel"], {
      encoding: "utf8"
    }).trim();
    const commit = execFileSync(
      "git",
      ["-C", gitRoot, "rev-parse", "--verify", `${expectedSourceCommit}^{commit}`],
      { encoding: "utf8" }
    ).trim();
    if (commit !== expectedSourceCommit) throw new Error("commit did not resolve exactly");
    const treePrefix = relative(gitRoot, pstackSourceRoot).split("\\").join("/");
    if (treePrefix === ".." || treePrefix.startsWith("../")) {
      throw new Error("source root is outside its git repository");
    }
    return { gitRoot, treePrefix };
  } catch (error) {
    fail(`optional pstack source audit failed for ${pstackSourceRoot}: ${error.message}`);
    return null;
  }
}

function readAuditedSourceBlob(context, sourcePath) {
  const treePath = context.treePrefix ? `${context.treePrefix}/${sourcePath}` : sourcePath;
  try {
    return execFileSync(
      "git",
      ["-C", context.gitRoot, "show", `${expectedSourceCommit}:${treePath}`],
      { encoding: null, maxBuffer: 16 * 1024 * 1024 }
    );
  } catch (error) {
    fail(`cannot audit ${sourcePath} at ${expectedSourceCommit}: ${error.message}`);
    return null;
  }
}

function isBundledChildPromptTemplate(path, contents) {
  const filename = path.split("/").at(-1) ?? "";
  if (/prompt/i.test(filename)) return true;

  const firstContentLine = contents.split("\n").find((line) => line.trim() !== "") ?? "";
  return /^(?:You are |Synthesize .*reviewer outputs)/.test(firstContentLine);
}

function validateChildPromptSafety(imported, skillDirectory, skill) {
  const constructsChildPrompts =
    imported.coordinatesSubagents ||
    /\b(?:child(?:-agent)?|drive) prompts?\b|\bprompt templates?\b/i.test(skill);

  if (constructsChildPrompts) {
    const skillPath = join(skillDirectory, "SKILL.md");
    if (!skill.includes(exactSubagentCommunicationRule)) {
      fail(
        `${relative(repositoryRoot, skillPath)} constructs child prompts without the exact communication rule`
      );
    }
    if (!skill.includes(exactChildPromptInstruction)) {
      fail(
        `${relative(repositoryRoot, skillPath)} constructs child prompts without requiring the exact rule in every child prompt`
      );
    }
  }

  for (const path of collectTextFiles(skillDirectory)) {
    if (!path.endsWith(".md")) continue;
    if (path.endsWith("SKILL.md") || path.endsWith("THIRD_PARTY_NOTICES.md")) continue;
    const contents = readFileSync(path, "utf8");
    if (!isBundledChildPromptTemplate(path, contents)) continue;
    if (!contents.includes(exactSubagentCommunicationRule)) {
      fail(
        `${relative(repositoryRoot, path)} is a bundled child prompt template without the exact communication rule`
      );
    }
  }
}

async function validateMappings(imported, skillDirectory, sourceAudit) {
  if (!Array.isArray(imported.mappings) || imported.mappings.length === 0) {
    fail(`${imported.name} has no authoritative mappings`);
    return;
  }
  if (Object.hasOwn(imported, "sourcePaths")) {
    fail(`${imported.name} still uses deprecated sourcePaths`);
  }

  const sources = new Set();
  const destinations = new Set();
  for (const mapping of imported.mappings) {
    if (!isSafeRelativePath(mapping.source)) {
      fail(`${imported.name} has unsafe source ${mapping.source}`);
      continue;
    }
    if (!isSafeRelativePath(mapping.destination)) {
      fail(`${imported.name} has unsafe destination ${mapping.destination}`);
      continue;
    }
    if (sources.has(mapping.source)) fail(`${imported.name} repeats source ${mapping.source}`);
    if (destinations.has(mapping.destination)) {
      fail(`${imported.name} repeats destination ${mapping.destination}`);
    }
    sources.add(mapping.source);
    destinations.add(mapping.destination);

    for (const field of ["sourceSha256", "sourceNormalizedSha256"]) {
      if (!/^[0-9a-f]{64}$/.test(mapping[field] ?? "")) {
        fail(`${imported.name} ${mapping.source} has invalid ${field}`);
      }
    }

    const destinationPath = resolve(skillDirectory, mapping.destination);
    if (!destinationPath.startsWith(`${skillDirectory}/`)) {
      fail(`${imported.name} mapping escapes the installed skill: ${mapping.destination}`);
      continue;
    }
    if (!existsSync(destinationPath)) {
      fail(`${imported.name} maps to missing ${mapping.destination}`);
      continue;
    }

    const destinationBytes = readFileSync(destinationPath);
    if (imported.disposition === "copy") {
      try {
        const normalizedHash = sha256(
          await normalizePstackSemanticBytes(destinationBytes, mapping.source)
        );
        if (normalizedHash !== mapping.sourceNormalizedSha256) {
          fail(
            `${imported.name} is copy-class but ${mapping.destination} differs semantically from ${mapping.source}`
          );
        }
      } catch (error) {
        fail(`${imported.name} cannot normalize ${mapping.destination}: ${error.message}`);
      }
    }

    if (sourceAudit) {
      const sourceBytes = readAuditedSourceBlob(sourceAudit, mapping.source);
      if (sourceBytes && sha256(sourceBytes) !== mapping.sourceSha256) {
        fail(`${mapping.source} does not match its committed sourceSha256`);
      }
      if (sourceBytes) {
        const normalizedSourceHash = sha256(
          await normalizePstackSemanticBytes(sourceBytes, mapping.source)
        );
        if (normalizedSourceHash !== mapping.sourceNormalizedSha256) {
          fail(`${mapping.source} does not match its committed sourceNormalizedSha256`);
        }
      }
    }
  }

  if (!sources.has(imported.inventorySource)) {
    fail(`${imported.name} inventorySource is not one of its mapped sources`);
  }
}

function validateNotice(imported, skillDirectory) {
  const noticePath = join(skillDirectory, "THIRD_PARTY_NOTICES.md");
  const notice = readRequired(noticePath);
  if (!notice) return;

  for (const fragment of [
    expectedSourceCommit,
    "https://github.com/cursor/plugins",
    `https://github.com/cursor/plugins/tree/${expectedSourceCommit}/pstack`
  ]) {
    if (!notice.includes(fragment)) {
      fail(`${relative(repositoryRoot, noticePath)} is missing ${fragment}`);
    }
  }
  if (!normalizeLicense(notice).includes(expectedPstackLicense)) {
    fail(`${relative(repositoryRoot, noticePath)} does not contain the exact pstack MIT license`);
  }

  const noticeMappings = [
    ...notice.matchAll(/^- `([^`]+)` -> `([^`]+)` \((modified|unchanged)\)$/gm)
  ].map((match) => ({ source: match[1], destination: match[2], status: match[3] }));
  const noticeByPair = new Map();
  for (const mapping of noticeMappings) {
    const key = `${mapping.source}\0${mapping.destination}`;
    if (noticeByPair.has(key)) {
      fail(`${relative(repositoryRoot, noticePath)} repeats ${mapping.source}`);
    }
    noticeByPair.set(key, mapping);
  }

  for (const mapping of imported.mappings) {
    const installedPath = resolve(skillDirectory, mapping.destination);
    if (!existsSync(installedPath)) continue;
    const expectedStatus =
      sha256(readFileSync(installedPath)) === mapping.sourceSha256 ? "unchanged" : "modified";
    const noticeMapping = noticeByPair.get(`${mapping.source}\0${mapping.destination}`);
    if (!noticeMapping) {
      fail(
        `${relative(repositoryRoot, noticePath)} lacks ${mapping.source} -> ${mapping.destination}`
      );
    } else if (noticeMapping.status !== expectedStatus) {
      fail(
        `${relative(repositoryRoot, noticePath)} marks ${mapping.source} ${noticeMapping.status}, expected ${expectedStatus}`
      );
    }
  }
  if (noticeMappings.length !== imported.mappings.length) {
    fail(`${relative(repositoryRoot, noticePath)} mapping count does not match the manifest`);
  }
}

function validateHostNeutrality(imported, skillDirectory) {
  const forbidden = [
    [/\.cursor(?:\/|\\)/, ".cursor path"],
    [/\bAskQuestion\b/, "Cursor AskQuestion tool"],
    [/\bgeneralPurpose\b/, "Cursor subagent type"],
    [/\brun_in_background\b/, "Cursor task flag"],
    [/\b(?:claude-fable|grok-4|gpt-5\.6-sol)\b/i, "fixed model slug"],
    [/\bcursor-team-kit\b/i, "Cursor team kit dependency"],
    [/\bBugbot\b/i, "Bugbot dependency"],
    [/\bGraphite\b/, "Graphite dependency"],
    [/\bSlack\b/, "workplace chat dependency"],
    [/\bteammates?\b/i, "teammate workflow"],
    [/\bcoworkers?\b/i, "coworker workflow"]
  ];

  for (const path of collectTextFiles(skillDirectory)) {
    if (path.endsWith("THIRD_PARTY_NOTICES.md")) continue;
    const contents = readFileSync(path, "utf8");
    if (/[^\x09\x0a\x0d\x20-\x7e]/.test(contents)) {
      fail(`${relative(repositoryRoot, path)} contains non-ASCII text`);
    }
    for (const [pattern, label] of forbidden) {
      if (pattern.test(contents)) {
        fail(`${relative(repositoryRoot, path)} contains forbidden ${label}: ${pattern}`);
      }
    }
  }

  const skillPath = join(skillDirectory, "SKILL.md");
  const skill = readRequired(skillPath);
  if (imported.coordinatesSubagents && !skill.includes(exactSubagentCommunicationRule)) {
    fail(
      `${relative(repositoryRoot, skillPath)} coordinates subagents without the communication boundary`
    );
  }
  validateChildPromptSafety(imported, skillDirectory, skill);
}

async function validateImportedPlugin(imported, marketplaceNames, inventory, sourceAudit) {
  const pluginDirectory = join(repositoryRoot, "plugins", imported.name);
  const skillDirectory = join(pluginDirectory, "skills", imported.name);
  const pluginManifestPath = join(pluginDirectory, ".codex-plugin", "plugin.json");
  const pluginManifestText = readRequired(pluginManifestPath);
  const skillPath = join(skillDirectory, "SKILL.md");
  const skillText = readRequired(skillPath);

  readRequired(join(pluginDirectory, "README.md"));
  readRequired(join(pluginDirectory, "commands", `${imported.name}.md`));
  readRequired(join(skillDirectory, "agents", "openai.yaml"));

  let pluginManifest;
  if (pluginManifestText) {
    try {
      pluginManifest = JSON.parse(pluginManifestText);
    } catch (error) {
      fail(`${relative(repositoryRoot, pluginManifestPath)} is invalid JSON: ${error.message}`);
    }
  }

  const frontmatter = parseFrontmatter(skillText, skillPath);
  if (pluginManifest) {
    if (pluginManifest.name !== imported.name) {
      fail(`${relative(repositoryRoot, pluginManifestPath)} name does not match folder`);
    }
    if (pluginManifest.license !== "MIT") {
      fail(`${relative(repositoryRoot, pluginManifestPath)} must declare MIT`);
    }
    if (frontmatter.get("version") !== pluginManifest.version) {
      fail(`${imported.name} skill and plugin versions do not match`);
    }
  }

  if (frontmatter.get("name") !== imported.name) {
    fail(`${relative(repositoryRoot, skillPath)} name does not match folder`);
  }
  if (!/^\d+\.\d+\.\d+$/.test(frontmatter.get("version") ?? "")) {
    fail(`${relative(repositoryRoot, skillPath)} has no semantic version`);
  }
  const invocationSetting = frontmatter.get("disable-model-invocation");
  if (imported.automaticInvocation) {
    if (invocationSetting === "true") {
      fail(`${relative(repositoryRoot, skillPath)} must allow automatic invocation`);
    }
  } else if (invocationSetting !== "true") {
    fail(`${relative(repositoryRoot, skillPath)} must disable model invocation`);
  }
  if (!marketplaceNames.has(imported.name)) {
    fail(`${imported.name} is missing from the marketplace`);
  }

  const inventoryEntry = inventory.get(imported.inventorySource);
  if (!inventoryEntry) {
    fail(
      `${imported.name} inventory source ${imported.inventorySource} is absent from the inventory`
    );
  } else {
    const inventoryClass = inventoryEntry.classification;
    const expectedDisposition = inventoryClass === "Copy" ? "copy" : "adapt";
    if (inventoryClass === "Exclude") {
      fail(`${imported.name} imports an inventory-excluded source`);
    } else if (imported.disposition !== expectedDisposition) {
      fail(
        `${imported.name} is ${imported.disposition}, but inventory class ${inventoryClass} requires ${expectedDisposition}`
      );
    }
    if (inventoryEntry.destination !== imported.name) {
      fail(
        `${imported.name} inventory row points to ${inventoryEntry.destination || "no destination"}`
      );
    }
  }
  if (!new Set(["copy", "adapt"]).has(imported.disposition)) {
    fail(`${imported.name} has invalid disposition ${imported.disposition}`);
  }

  await validateMappings(imported, skillDirectory, sourceAudit);
  validateNotice(imported, skillDirectory);
  validateHostNeutrality(imported, skillDirectory);
}

function validateGuideProvenance() {
  const noticePath = join(repositoryRoot, "docs", "guide", "THIRD_PARTY_NOTICES.md");
  const notice = readRequired(noticePath);
  if (!notice) return;
  for (const fragment of [
    expectedSourceCommit,
    "Upstream pstack path",
    "Copyright (c) 2026 Lauren Tan",
    "Permission is hereby granted, free of charge",
    'THE SOFTWARE IS PROVIDED "AS IS"'
  ]) {
    if (!notice.includes(fragment)) {
      fail(`${relative(repositoryRoot, noticePath)} is missing ${fragment}`);
    }
  }
}

if (!existsSync(manifestPath)) {
  fail("missing docs/pstack-imports.json");
} else {
  const importsManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (importsManifest.sourceCommit !== expectedSourceCommit) {
    fail("docs/pstack-imports.json does not pin the approved source commit");
  }
  if (importsManifest.semanticNormalization !== expectedSemanticNormalization) {
    fail(`docs/pstack-imports.json must use ${expectedSemanticNormalization}`);
  }
  const expectedLicenseSha256 = sha256(Buffer.from(`${expectedPstackLicense}\n`));
  if (importsManifest.licenseSourceSha256 !== expectedLicenseSha256) {
    fail("docs/pstack-imports.json has the wrong pinned LICENSE hash");
  }

  const marketplacePath = join(repositoryRoot, ".agents", "plugins", "marketplace.json");
  const marketplace = JSON.parse(readRequired(marketplacePath) || "{}");
  const marketplaceNames = new Set((marketplace.plugins ?? []).map((plugin) => plugin.name));
  const inventory = inventoryEntries();
  const sourceAudit = optionalSourceAuditContext();
  if (sourceAudit) {
    const licenseBytes = readAuditedSourceBlob(sourceAudit, "LICENSE");
    if (licenseBytes && sha256(licenseBytes) !== importsManifest.licenseSourceSha256) {
      fail("pinned pstack LICENSE does not match licenseSourceSha256");
    }
  }

  const names = new Set();
  for (const imported of importsManifest.imports ?? []) {
    if (typeof imported.name !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(imported.name)) {
      fail(`unsafe imported plugin name: ${String(imported.name)}`);
      continue;
    }
    if (names.has(imported.name)) fail(`duplicate import ${imported.name}`);
    names.add(imported.name);
    await validateImportedPlugin(imported, marketplaceNames, inventory, sourceAudit);
  }
  validateGuideProvenance();
}

if (failures.length > 0) {
  console.error("pstack import validation failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("pstack import validation passed");
