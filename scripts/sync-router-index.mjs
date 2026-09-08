// Renders the principle index from docs/router-index.json into the router
// skill and checks the invariants the router relies on.
//
// Usage:
//   node scripts/sync-router-index.mjs            # write the block, report problems
//   node scripts/sync-router-index.mjs --check    # report drift and problems, write nothing
//
// ROUTER_SKILL_PATH overrides the target SKILL.md path (testing only).

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const checkOnly = process.argv.includes("--check");
const pluginsDirectory = join(repositoryRoot, "plugins");
const indexPath = join(repositoryRoot, "docs", "router-index.json");
const maxRouterDescriptionLength = 1536;

const index = JSON.parse(readFileSync(indexPath, "utf8"));
const routerName = index.router;
const { begin, end } = index.markers;
const routerSkillPath =
  process.env.ROUTER_SKILL_PATH ??
  join(pluginsDirectory, routerName, "skills", routerName, "SKILL.md");

const problems = [];

function skillPath(name) {
  return join(pluginsDirectory, name, "skills", name, "SKILL.md");
}

function openaiYamlPath(name) {
  return join(pluginsDirectory, name, "skills", name, "agents", "openai.yaml");
}

function unquote(value) {
  const text = value.trim();
  if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
    return text.slice(1, -1).replaceAll('\\"', '"').replaceAll("\\\\", "\\");
  }
  if (text.length >= 2 && text.startsWith("'") && text.endsWith("'")) {
    return text.slice(1, -1).replaceAll("''", "'");
  }
  return text;
}

// Minimal YAML frontmatter reader: top-level `key: value` pairs plus `>`/`|`
// block scalars. Returns { data, body }.
function parseFrontmatter(markdown) {
  const lines = markdown.split("\n");
  if (lines[0]?.trim() !== "---") return { data: {}, body: markdown };
  const closing = lines.findIndex((line, position) => position > 0 && line.trim() === "---");
  if (closing < 0) return { data: {}, body: markdown };

  const data = {};
  let cursor = 1;
  while (cursor < closing) {
    const line = lines[cursor];
    const match = /^([A-Za-z0-9_-]+):(.*)$/.exec(line);
    if (!match) {
      cursor += 1;
      continue;
    }
    const key = match[1];
    const rawValue = match[2].trim();
    if (rawValue === ">" || rawValue === ">-" || rawValue === "|" || rawValue === "|-") {
      const block = [];
      cursor += 1;
      while (cursor < closing && (lines[cursor].startsWith(" ") || lines[cursor].trim() === "")) {
        block.push(lines[cursor].trim());
        cursor += 1;
      }
      data[key] = block.join(rawValue.startsWith(">") ? " " : "\n").trim();
      continue;
    }
    data[key] = unquote(rawValue);
    cursor += 1;
  }
  return { data, body: lines.slice(closing + 1).join("\n") };
}

function firstHeading(body) {
  const match = /^# (.+)$/m.exec(body);
  return match ? match[1].trim() : null;
}

function readOpenaiPolicyFlag(name) {
  const path = openaiYamlPath(name);
  if (!existsSync(path)) return { present: false };
  const lines = readFileSync(path, "utf8").split("\n");
  const policyIndex = lines.findIndex((line) => /^policy:\s*$/.test(line));
  if (policyIndex < 0) return { present: true, hasPolicy: false };
  for (let cursor = policyIndex + 1; cursor < lines.length; cursor += 1) {
    const line = lines[cursor];
    if (line.trim() !== "" && !line.startsWith(" ")) break;
    const match = /^ {2}allow_implicit_invocation:\s*(true|false)\s*$/.exec(line);
    if (match)
      return { present: true, hasPolicy: true, allowImplicitInvocation: match[1] === "true" };
  }
  return { present: true, hasPolicy: true };
}

// (a) every principle plugin is listed; (b) every listed member exists.
const listedMembers = index.groups.flatMap((group) => group.members);
const seen = new Set();
for (const name of listedMembers) {
  if (seen.has(name)) problems.push(`docs/router-index.json lists ${name} more than once`);
  seen.add(name);
}
const principlePlugins = readdirSync(pluginsDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith("principle-"))
  .map((entry) => entry.name)
  .sort();
for (const name of principlePlugins) {
  if (!seen.has(name)) {
    problems.push(`plugins/${name} is not listed in docs/router-index.json`);
  }
}

// Collect leaf metadata and (d) invocation flags.
const entries = new Map();
for (const name of listedMembers) {
  const path = skillPath(name);
  if (!existsSync(path)) {
    problems.push(
      `docs/router-index.json lists ${name} but plugins/${name}/skills/${name}/SKILL.md is missing`
    );
    continue;
  }
  const { data, body } = parseFrontmatter(readFileSync(path, "utf8"));
  const title = firstHeading(body);
  if (!title) problems.push(`${name}: SKILL.md has no "# " heading`);
  if (!data.description) problems.push(`${name}: SKILL.md frontmatter has no description`);
  if (data["disable-model-invocation"] !== "true") {
    problems.push(`${name}: SKILL.md frontmatter lacks "disable-model-invocation: true"`);
  }
  const policy = readOpenaiPolicyFlag(name);
  if (!policy.present) {
    problems.push(`${name}: agents/openai.yaml is missing`);
  } else if (policy.allowImplicitInvocation !== false) {
    problems.push(
      `${name}: agents/openai.yaml lacks "allow_implicit_invocation: false" under "policy:"`
    );
  }
  entries.set(name, { title: title ?? name, description: data.description ?? "" });
}

// Render the block.
const renderedGroups = index.groups
  .map((group) => {
    const bullets = group.members
      .filter((name) => entries.has(name))
      .map((name) => {
        const { title, description } = entries.get(name);
        return `- **${title}** (\`${name}\`). ${description.replace(/\s+/g, " ").trim()}`;
      })
      .join("\n");
    return `**${group.name}**\n\n${bullets}`;
  })
  .join("\n\n");
const generatedBlock = `${begin}\n\n${renderedGroups}\n\n${end}`;

// Splice into the router skill.
let routerText = null;
if (!existsSync(routerSkillPath)) {
  problems.push(`router skill not found at ${routerSkillPath}`);
} else {
  routerText = readFileSync(routerSkillPath, "utf8");
}

let expected = null;
if (routerText !== null) {
  const startIndex = routerText.indexOf(begin);
  const endIndex = routerText.indexOf(end);
  if (startIndex < 0 || endIndex < startIndex) {
    problems.push(
      `${routerSkillPath} is missing the generated index markers; add the lines "${begin}" and "${end}" where the principle index belongs, then rerun`
    );
  } else {
    expected = await prettier.format(
      `${routerText.slice(0, startIndex)}${generatedBlock}${routerText.slice(endIndex + end.length)}`,
      { parser: "markdown" }
    );
  }
}

// (e) router description length and ASCII-only content.
if (expected !== null) {
  const routerDescription = parseFrontmatter(expected).data.description ?? "";
  if (routerDescription.length > maxRouterDescriptionLength) {
    problems.push(
      `${routerName}: frontmatter description is ${routerDescription.length} characters; limit is ${maxRouterDescriptionLength}`
    );
  }
  const nonAscii = /[^\x00-\x7F]/.exec(expected);
  if (nonAscii) {
    const lineNumber = expected.slice(0, nonAscii.index).split("\n").length;
    problems.push(
      `${routerName}: SKILL.md contains a non-ASCII character (U+${nonAscii[0].codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}) on line ${lineNumber}`
    );
  }

  // (c) drift.
  if (expected !== routerText) {
    if (checkOnly) {
      problems.push(`${routerSkillPath} principle index is stale; run bun run router:sync`);
    } else {
      writeFileSync(routerSkillPath, expected);
      console.log(`principle index written to ${routerSkillPath}`);
    }
  }
}

for (const problem of problems) console.error(problem);
if (problems.length > 0) process.exit(1);
console.log(checkOnly ? "principle index is current" : "principle index updated");
