// Renders the principle index from docs/router-index.json into the router
// skill, renders the companion install block into the router README, and
// checks the invariants the router relies on.
//
// Usage:
//   bun scripts/sync-router-index.mjs            # write both blocks when every check passes
//   bun scripts/sync-router-index.mjs --check    # report drift and problems, write nothing
//
// Nothing is written while any problem exists, so a partial index never lands.

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";
import {
  nonAsciiPattern,
  readOpenaiPolicy,
  skillAllowsImplicitInvocation,
  splitFrontmatter
} from "./lib/skill-invocation.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const checkOnly = process.argv.includes("--check");
const pluginsDirectory = join(repositoryRoot, "plugins");
const indexPath = join(repositoryRoot, "docs", "router-index.json");
const maxRouterDescriptionLength = 1536;
const readmeMarkers = {
  begin: "<!-- BEGIN GENERATED COMPANION INSTALL -->",
  end: "<!-- END GENERATED COMPANION INSTALL -->"
};

const index = JSON.parse(readFileSync(indexPath, "utf8"));
const routerName = index.router;
const skillMarkers = index.markers;
const routerSkillPath = join(pluginsDirectory, routerName, "skills", routerName, "SKILL.md");
const routerReadmePath = join(pluginsDirectory, routerName, "README.md");

const problems = [];

function label(path) {
  return relative(repositoryRoot, path);
}

function skillDirectory(name) {
  return join(pluginsDirectory, name, "skills", name);
}

function firstHeading(body) {
  const match = /^# (.+)$/m.exec(body);
  return match ? match[1].trim() : null;
}

async function formatMarkdown(text, path) {
  const options = (await prettier.resolveConfig(path)) ?? {};
  return prettier.format(text, { ...options, parser: "markdown" });
}

// Replaces the text between two marker lines. Returns null (and records a
// problem) when the markers are absent.
function splice(text, path, markers, generated) {
  const startIndex = text.indexOf(markers.begin);
  const endIndex = text.indexOf(markers.end);
  if (startIndex < 0 || endIndex < startIndex) {
    problems.push(
      `${label(path)} is missing the generated markers; add the lines "${markers.begin}" and "${markers.end}" where the generated block belongs, then rerun`
    );
    return null;
  }
  return `${text.slice(0, startIndex)}${generated}${text.slice(endIndex + markers.end.length)}`;
}

function checkAscii(text, path) {
  const nonAscii = nonAsciiPattern.exec(text);
  if (!nonAscii) return;
  const lineNumber = text.slice(0, nonAscii.index).split("\n").length;
  const codePoint = nonAscii[0].codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
  problems.push(
    `${label(path)} contains a non-ASCII character (U+${codePoint}) on line ${lineNumber}`
  );
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

// Collect leaf metadata and (d) invocation flags. A member must be user-only
// on both hosts: the skill frontmatter disables model invocation and the
// Codex policy forbids implicit invocation.
const entries = new Map();
for (const name of listedMembers) {
  const directory = skillDirectory(name);
  const path = join(directory, "SKILL.md");
  if (!existsSync(path)) {
    problems.push(`docs/router-index.json lists ${name} but ${label(path)} is missing`);
    continue;
  }
  const parsed = splitFrontmatter(readFileSync(path, "utf8"));
  if (!parsed) {
    problems.push(`${label(path)} has no YAML frontmatter`);
    continue;
  }
  const { frontmatter, body } = parsed;
  const title = firstHeading(body);
  if (!title) problems.push(`${label(path)} has no "# " heading`);
  const description = frontmatter.get("description") ?? "";
  if (!description) problems.push(`${label(path)} frontmatter has no description`);

  try {
    if (skillAllowsImplicitInvocation(frontmatter, label(path))) {
      problems.push(`${label(path)} frontmatter lacks "disable-model-invocation: true"`);
    }
    const policyLabel = label(join(directory, "agents", "openai.yaml"));
    if (readOpenaiPolicy(directory, policyLabel) !== false) {
      problems.push(
        `${policyLabel} must set policy.allow_implicit_invocation: false; run bun run policy:sync`
      );
    }
  } catch (error) {
    problems.push(error.message);
  }
  entries.set(name, { title: title ?? name, description });
}

// Render the principle index.
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
const generatedIndex = `${skillMarkers.begin}\n\n${renderedGroups}\n\n${skillMarkers.end}`;

// Render the companion install block for the router README.
const installLines = [
  "bunx skills@latest add petalas/skills \\",
  ...listedMembers.map(
    (name, position) => `  ${position === 0 ? "--skill " : "        "}${name} \\`
  ),
  "  -g -y"
];
const generatedInstall = `${readmeMarkers.begin}

## Companion skills

The router indexes the \`principle-*\` leaves and \`power-of-ten\` and reads each one from \`../<name>/SKILL.md\` beside its own directory. Install them too, or the router falls back to the one-line rules in its index:

\`\`\`bash
${installLines.join("\n")}
\`\`\`

${readmeMarkers.end}`;

// Compute the expected text of every generated target.
const targets = [];
for (const [path, markers, generated] of [
  [routerSkillPath, skillMarkers, generatedIndex],
  [routerReadmePath, readmeMarkers, generatedInstall]
]) {
  if (!existsSync(path)) {
    problems.push(`${label(path)} is missing`);
    continue;
  }
  const current = readFileSync(path, "utf8");
  const spliced = splice(current, path, markers, generated);
  if (spliced === null) continue;
  const expected = await formatMarkdown(spliced, path);
  checkAscii(expected, path);
  targets.push({ path, current, expected });
}

// (e) router description length.
const routerTarget = targets.find((target) => target.path === routerSkillPath);
if (routerTarget) {
  const routerDescription =
    splitFrontmatter(routerTarget.expected)?.frontmatter.get("description") ?? "";
  if (routerDescription.length > maxRouterDescriptionLength) {
    problems.push(
      `${routerName}: frontmatter description is ${routerDescription.length} characters; limit is ${maxRouterDescriptionLength}`
    );
  }
}

// (c) drift. Report in check mode; in write mode only after every check passed.
const stale = targets.filter((target) => target.expected !== target.current);
if (checkOnly) {
  for (const target of stale) {
    problems.push(`${label(target.path)} generated block is stale; run bun run router:sync`);
  }
}

if (problems.length > 0) {
  console.error(
    checkOnly ? "router index check failed:\n" : "router index sync failed; nothing was written:\n"
  );
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

for (const target of stale) {
  writeFileSync(target.path, target.expected);
  console.log(`generated block written to ${label(target.path)}`);
}
console.log(
  checkOnly ? "router index is current" : `router index updated (${stale.length} files changed)`
);
