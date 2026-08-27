import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const pstackRoot =
  process.env.PSTACK_SOURCE_ROOT ?? resolve(repositoryRoot, "..", "plugins", "pstack");
const sourceCommit = "799151d91b6e12ee7dbd09f708eec108d7de9b3b";
const [name, sourceRelative, ...additionalSourcePaths] = process.argv.slice(2);

if (!name || !sourceRelative) {
  console.error(
    "usage: bun scripts/scaffold-pstack-plugin.mjs <name> <pstack-source-dir> [additional-source-path ...]"
  );
  process.exit(1);
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
  throw new Error(`invalid plugin name: ${name}`);
}

const sourceDirectory = resolve(pstackRoot, sourceRelative);
const sourceSkillPath = join(sourceDirectory, "SKILL.md");
if (!existsSync(sourceSkillPath)) {
  throw new Error(`source has no SKILL.md: ${sourceRelative}`);
}

const pluginDirectory = join(repositoryRoot, "plugins", name);
if (existsSync(pluginDirectory)) {
  throw new Error(`plugin already exists: ${relative(repositoryRoot, pluginDirectory)}`);
}

const skillDirectory = join(pluginDirectory, "skills", name);
mkdirSync(dirname(skillDirectory), { recursive: true });
cpSync(sourceDirectory, skillDirectory, { recursive: true });

function ascii(text) {
  const replacements = new Map([
    ["\u00a0", " "],
    ["\u00d7", "x"],
    ["\u00e1", "a"],
    ["\u00e9", "e"],
    ["\u2010", "-"],
    ["\u2011", "-"],
    ["\u2012", "-"],
    ["\u2013", "-"],
    ["\u2014", "-"],
    ["\u2018", "'"],
    ["\u2019", "'"],
    ["\u201c", '"'],
    ["\u201d", '"'],
    ["\u2026", "..."],
    ["\u2190", "<-"],
    ["\u2192", "->"],
    ["\u21d2", "=>"],
    ["\u2264", "<="],
    ["\u2265", ">="],
    ["\u2713", "passed"],
    ["\u2717", "failed"]
  ]);

  let normalized = text;
  for (const [from, to] of replacements) normalized = normalized.split(from).join(to);
  return normalized;
}

function transformTextFiles(path) {
  for (const entry of readdirSync(path)) {
    const child = join(path, entry);
    if (statSync(child).isDirectory()) {
      transformTextFiles(child);
      continue;
    }
    if (!/\.(?:md|json|ya?ml|mjs|sh|ts|tsx)$/.test(entry)) continue;
    writeFileSync(child, ascii(readFileSync(child, "utf8")));
  }
}

transformTextFiles(skillDirectory);

const sourceSkill = readFileSync(join(skillDirectory, "SKILL.md"), "utf8");
const frontmatterMatch = sourceSkill.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!frontmatterMatch) throw new Error("source skill has invalid frontmatter");

const descriptionLine = frontmatterMatch[1]
  .split("\n")
  .find((line) => line.startsWith("description:"));
if (!descriptionLine) throw new Error("source skill has no one-line description");
const description = descriptionLine.slice("description:".length).trim();

const newSkill = [
  "---",
  `name: ${name}`,
  "version: 0.1.0",
  "disable-model-invocation: true",
  `description: ${description}`,
  "---",
  frontmatterMatch[2].trimStart()
].join("\n");
writeFileSync(join(skillDirectory, "SKILL.md"), newSkill);

const sourceFiles = [];
function collectSourceFiles(path) {
  for (const entry of readdirSync(path).sort()) {
    const child = join(path, entry);
    if (statSync(child).isDirectory()) collectSourceFiles(child);
    else sourceFiles.push(relative(pstackRoot, child));
  }
}
collectSourceFiles(sourceDirectory);
for (const sourcePath of additionalSourcePaths) {
  if (!sourceFiles.includes(sourcePath)) sourceFiles.push(sourcePath);
}

const noticeMappings = sourceFiles
  .sort()
  .map((path) => `- \`${path}\` -> adapted in this skill (modified)`)
  .join("\n");
const notice = `# Third-party notices

## pstack

This skill includes material adapted from pstack.

- Repository: https://github.com/cursor/plugins
- Source commit: ${sourceCommit}
- Source subtree: https://github.com/cursor/plugins/tree/${sourceCommit}/pstack
- Source-to-installed-file mappings:
${noticeMappings}

MIT License

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
SOFTWARE.
`;
writeFileSync(join(skillDirectory, "THIRD_PARTY_NOTICES.md"), notice);

mkdirSync(join(skillDirectory, "agents"), { recursive: true });
writeFileSync(
  join(skillDirectory, "agents", "openai.yaml"),
  `interface:\n  display_name: "${name}"\n  short_description: ${description}\n  default_prompt: "Use $${name} for this task."\n`
);

mkdirSync(join(pluginDirectory, "commands"), { recursive: true });
writeFileSync(
  join(pluginDirectory, "commands", `${name}.md`),
  `# $${name}\n\nUse the \`${name}\` skill for this task. Follow repository instructions and keep external communication with people under the user's manual control.\n`
);

mkdirSync(join(pluginDirectory, ".codex-plugin"), { recursive: true });
const pluginManifest = {
  name,
  version: "0.1.0",
  description: description.replace(/^['"]|['"]$/g, ""),
  author: {
    name: "Nick Petalas",
    email: "webmasternikos@gmail.com",
    url: "https://github.com/petalas"
  },
  homepage: "https://github.com/petalas/skills",
  repository: "https://github.com/petalas/skills",
  bugs: "https://github.com/petalas/skills/issues",
  license: "MIT",
  keywords: ["agent-skill", "solo-developer", name],
  skills: "./skills/",
  interface: {
    displayName: name,
    shortDescription: description.replace(/^['"]|['"]$/g, ""),
    longDescription: description.replace(/^['"]|['"]$/g, ""),
    developerName: "Nick Petalas",
    category: "Coding",
    capabilities: ["Interactive"],
    defaultPrompt: [`Use $${name} for this task.`],
    brandColor: "#475569",
    screenshots: []
  }
};
writeFileSync(
  join(pluginDirectory, ".codex-plugin", "plugin.json"),
  `${JSON.stringify(pluginManifest, null, 2)}\n`
);

writeFileSync(
  join(pluginDirectory, "README.md"),
  `# ${name}\n\n${description.replace(/^['"]|['"]$/g, "")}\n\n## Install\n\n\`\`\`bash\nbunx skills@latest add petalas/skills --skill ${name} -g -y\n\`\`\`\n\n## Usage\n\n\`\`\`text\nUse $${name} for this task.\n\`\`\`\n\nThis plugin adapts material from pstack. The installed skill includes the full upstream notice and exact provenance.\n`
);

console.log(`created ${relative(repositoryRoot, pluginDirectory)}`);
