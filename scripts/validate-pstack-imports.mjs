import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const pstackSourceRoot =
  process.env.PSTACK_SOURCE_ROOT ?? resolve(repositoryRoot, "..", "plugins", "pstack");
const manifestPath = join(repositoryRoot, "docs", "pstack-imports.json");
const expectedSourceCommit = "799151d91b6e12ee7dbd09f708eec108d7de9b3b";
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

function validateNotice(imported, skillDirectory) {
  const noticePath = join(skillDirectory, "THIRD_PARTY_NOTICES.md");
  const notice = readRequired(noticePath);
  if (!notice) return;

  const requiredFragments = [
    expectedSourceCommit,
    "https://github.com/cursor/plugins",
    `https://github.com/cursor/plugins/tree/${expectedSourceCommit}/pstack`
  ];
  for (const fragment of requiredFragments) {
    if (!notice.includes(fragment)) {
      fail(`${relative(repositoryRoot, noticePath)} is missing ${fragment}`);
    }
  }

  const sourceLicensePath = join(pstackSourceRoot, "LICENSE");
  if (
    existsSync(sourceLicensePath) &&
    normalizeLicense(readFileSync(sourceLicensePath, "utf8")) !== expectedPstackLicense
  ) {
    fail(`${sourceLicensePath} does not match the pinned pstack MIT license`);
  }
  if (!normalizeLicense(notice).includes(expectedPstackLicense)) {
    fail(
      `${relative(repositoryRoot, noticePath)} does not contain the exact full pstack MIT license`
    );
  }

  for (const sourcePath of imported.sourcePaths) {
    if (!notice.includes(`\`${sourcePath}\``)) {
      fail(`${relative(repositoryRoot, noticePath)} does not name ${sourcePath}`);
    }
  }

  const mappings = [
    ...notice.matchAll(/^- `([^`]+)` -> `([^`]+)` \((modified|unchanged)\)$/gm)
  ].map((match) => ({
    source: match[1],
    destination: match[2],
    status: match[3]
  }));
  const adaptedPaths = new Set(mappings.map((mapping) => mapping.source));
  const expectedPaths = new Set(imported.sourcePaths);
  for (const path of adaptedPaths) {
    if (!expectedPaths.has(path)) {
      fail(`${relative(repositoryRoot, noticePath)} marks untracked source as adapted: ${path}`);
    }
  }
  for (const path of expectedPaths) {
    if (!adaptedPaths.has(path)) {
      fail(`${relative(repositoryRoot, noticePath)} does not mark source as adapted: ${path}`);
    }
  }

  for (const mapping of mappings) {
    const destinationPath = resolve(skillDirectory, mapping.destination);
    if (!destinationPath.startsWith(`${skillDirectory}/`)) {
      fail(`${relative(repositoryRoot, noticePath)} has unsafe destination ${mapping.destination}`);
      continue;
    }
    if (!existsSync(destinationPath)) {
      fail(`${relative(repositoryRoot, noticePath)} maps to missing ${mapping.destination}`);
      continue;
    }

    const sourcePath = join(pstackSourceRoot, mapping.source);
    if (existsSync(sourcePath)) {
      const unchanged = readFileSync(sourcePath).equals(readFileSync(destinationPath));
      const actualStatus = unchanged ? "unchanged" : "modified";
      if (mapping.status !== actualStatus) {
        fail(
          `${relative(repositoryRoot, noticePath)} marks ${mapping.source} ${mapping.status}, expected ${actualStatus}`
        );
      }
    }
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
  if (imported.coordinatesSubagents) {
    if (!skill.includes(exactSubagentCommunicationRule)) {
      fail(
        `${relative(repositoryRoot, skillPath)} coordinates subagents without the external-communication boundary`
      );
    }
  }
  validateChildPromptSafety(imported, skillDirectory, skill);
}

function validateImportedPlugin(imported, marketplaceNames) {
  const pluginDirectory = join(repositoryRoot, "plugins", imported.name);
  const skillDirectory = join(pluginDirectory, "skills", imported.name);
  const manifestPath = join(pluginDirectory, ".codex-plugin", "plugin.json");
  const manifestText = readRequired(manifestPath);
  const skillPath = join(skillDirectory, "SKILL.md");
  const skillText = readRequired(skillPath);

  readRequired(join(pluginDirectory, "README.md"));
  readRequired(join(pluginDirectory, "commands", `${imported.name}.md`));
  readRequired(join(skillDirectory, "agents", "openai.yaml"));

  let pluginManifest;
  if (manifestText) {
    try {
      pluginManifest = JSON.parse(manifestText);
    } catch (error) {
      fail(`${relative(repositoryRoot, manifestPath)} is invalid JSON: ${error.message}`);
    }
  }

  const frontmatter = parseFrontmatter(skillText, skillPath);
  if (pluginManifest) {
    if (pluginManifest.name !== imported.name) {
      fail(`${relative(repositoryRoot, manifestPath)} name does not match folder`);
    }
    if (pluginManifest.license !== "MIT") {
      fail(`${relative(repositoryRoot, manifestPath)} must declare MIT`);
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

  validateNotice(imported, skillDirectory);
  validateHostNeutrality(imported, skillDirectory);
}

if (!existsSync(manifestPath)) {
  fail("missing docs/pstack-imports.json");
} else {
  const importsManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (importsManifest.sourceCommit !== expectedSourceCommit) {
    fail("docs/pstack-imports.json does not pin the approved source commit");
  }

  const marketplacePath = join(repositoryRoot, ".agents", "plugins", "marketplace.json");
  const marketplace = JSON.parse(readRequired(marketplacePath) || "{}");
  const marketplaceNames = new Set((marketplace.plugins ?? []).map((plugin) => plugin.name));

  const names = new Set();
  for (const imported of importsManifest.imports ?? []) {
    if (names.has(imported.name)) fail(`duplicate import ${imported.name}`);
    names.add(imported.name);
    if (!Array.isArray(imported.sourcePaths) || imported.sourcePaths.length === 0) {
      fail(`${imported.name} has no sourcePaths`);
      continue;
    }
    validateImportedPlugin(imported, marketplaceNames);
  }
}

if (failures.length > 0) {
  console.error("pstack import validation failed:\n");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("pstack import validation passed");
