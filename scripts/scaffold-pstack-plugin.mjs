import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const pstackRoot = resolve(
  process.env.PSTACK_SOURCE_ROOT ?? resolve(repositoryRoot, "..", "plugins", "pstack")
);
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

const importsManifest = JSON.parse(
  readFileSync(join(repositoryRoot, "docs", "pstack-imports.json"), "utf8")
);
if (importsManifest.sourceCommit !== sourceCommit) {
  throw new Error(`pstack import manifest must pin approved commit ${sourceCommit}`);
}
const imported = importsManifest.imports.find((entry) => entry.name === name);
if (!imported) {
  throw new Error(
    `add ${name} with exact sourcePaths to docs/pstack-imports.json before scaffolding`
  );
}

function validateSourcePath(path) {
  if (
    !path ||
    path.startsWith("/") ||
    path === ".." ||
    path.startsWith("../") ||
    path.includes("/../")
  ) {
    throw new Error(`unsafe pstack source path: ${path}`);
  }
}

validateSourcePath(sourceRelative);
for (const sourcePath of additionalSourcePaths) validateSourcePath(sourcePath);

const gitRoot = execFileSync("git", ["-C", pstackRoot, "rev-parse", "--show-toplevel"], {
  encoding: "utf8"
}).trim();
const resolvedSourceCommit = execFileSync(
  "git",
  ["-C", gitRoot, "rev-parse", "--verify", `${sourceCommit}^{commit}`],
  { encoding: "utf8" }
).trim();
if (resolvedSourceCommit !== sourceCommit) {
  throw new Error(`pstack source does not contain approved commit ${sourceCommit}`);
}
const sourceTreePrefix = relative(gitRoot, pstackRoot).split("\\").join("/");
if (sourceTreePrefix === ".." || sourceTreePrefix.startsWith("../")) {
  throw new Error(`pstack source root ${pstackRoot} is outside git root ${gitRoot}`);
}

function treePathFor(sourcePath) {
  return sourceTreePrefix ? `${sourceTreePrefix}/${sourcePath}` : sourcePath;
}

function readSourceBlob(sourcePath) {
  return execFileSync(
    "git",
    ["-C", gitRoot, "show", `${sourceCommit}:${treePathFor(sourcePath)}`],
    { encoding: null, maxBuffer: 16 * 1024 * 1024 }
  );
}

function destinationFor(sourcePath) {
  if (sourcePath === "agents/comment-sicko.md") {
    return "references/reviewer-prompt.md";
  }

  if (name === "worktree-cleanup") {
    if (sourcePath.endsWith("/playbooks/worktree-cleanup.md")) return "SKILL.md";
    if (sourcePath.endsWith("/scripts/worktree-audit.sh")) {
      return "scripts/worktree-audit.sh";
    }
  }

  if (name === "engineering-mode") {
    if (sourcePath.endsWith("/SKILL.md")) return "SKILL.md";
    const playbook = sourcePath.match(/\/playbooks\/(.+)$/);
    if (playbook) return `playbooks/${playbook[1]}`;
  }

  const skillRelative = sourcePath.match(/^skills\/[^/]+\/(.+)$/);
  if (skillRelative) return skillRelative[1];

  throw new Error(`no destination rule for ${name}: ${sourcePath}`);
}

function sourceMode(sourcePath) {
  const output = execFileSync(
    "git",
    ["-C", gitRoot, "ls-tree", sourceCommit, "--", treePathFor(sourcePath)],
    { encoding: "utf8" }
  ).trim();
  const match = output.match(/^(\d+) blob [0-9a-f]+\t/);
  if (!match) throw new Error(`source is not a file at approved commit: ${sourcePath}`);
  return match[1];
}

const sourceDirectoryPath = sourceRelative.replace(/\/+$/, "");
const sourceTreePath = treePathFor(sourceDirectoryPath);
const sourceEntries = execFileSync(
  "git",
  ["-C", gitRoot, "ls-tree", "-r", sourceCommit, "--", sourceTreePath],
  { encoding: "utf8" }
)
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const match = line.match(/^(\d+) blob [0-9a-f]+\t(.+)$/);
    if (!match) throw new Error(`unexpected git ls-tree output: ${line}`);
    return { mode: match[1], treePath: match[2] };
  });
if (sourceEntries.length === 0) {
  throw new Error(`source directory is absent at approved commit: ${sourceRelative}`);
}

const sourceFiles = sourceEntries.map(({ treePath }) =>
  sourceTreePrefix ? treePath.slice(sourceTreePrefix.length + 1) : treePath
);
if (!sourceFiles.includes(`${sourceDirectoryPath}/SKILL.md`)) {
  throw new Error(`source has no SKILL.md at approved commit: ${sourceRelative}`);
}

const plannedSourcePaths = new Set([...sourceFiles, ...additionalSourcePaths]);
const manifestSourcePaths = new Set(imported.sourcePaths);
for (const sourcePath of plannedSourcePaths) {
  if (!manifestSourcePaths.has(sourcePath)) {
    throw new Error(`${name} manifest does not declare source path ${sourcePath}`);
  }
}
for (const sourcePath of manifestSourcePaths) {
  if (!plannedSourcePaths.has(sourcePath)) {
    throw new Error(
      `${name} manifest source ${sourcePath} is neither in ${sourceRelative} nor passed explicitly`
    );
  }
}

const pluginDirectory = join(repositoryRoot, "plugins", name);
if (existsSync(pluginDirectory)) {
  throw new Error(`plugin already exists: ${relative(repositoryRoot, pluginDirectory)}`);
}

const skillDirectory = join(pluginDirectory, "skills", name);
mkdirSync(skillDirectory, { recursive: true });
for (const entry of sourceEntries) {
  const sourcePath = sourceTreePrefix
    ? entry.treePath.slice(sourceTreePrefix.length + 1)
    : entry.treePath;
  const destinationPath = sourcePath.slice(sourceDirectoryPath.length + 1);
  const destination = join(skillDirectory, destinationPath);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, readSourceBlob(sourcePath));
  if (entry.mode === "100755") chmodSync(destination, 0o755);
}
for (const sourcePath of additionalSourcePaths) {
  const destinationPath = destinationFor(sourcePath);
  validateSourcePath(destinationPath);
  const destination = join(skillDirectory, destinationPath);
  if (existsSync(destination)) {
    throw new Error(`additional source maps to existing destination ${destinationPath}`);
  }
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, readSourceBlob(sourcePath));
  if (sourceMode(sourcePath) === "100755") chmodSync(destination, 0o755);
}

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

mkdirSync(join(skillDirectory, "agents"), { recursive: true });
writeFileSync(
  join(skillDirectory, "agents", "openai.yaml"),
  `interface:\n  display_name: "${name}"\n  short_description: ${description}\n  default_prompt: "Use $${name} for this task."\n`
);

mkdirSync(join(pluginDirectory, "commands"), { recursive: true });
writeFileSync(
  join(pluginDirectory, "commands", `${name}.md`),
  `# $${name}\n\nUse the \`${name}\` skill for this task. Follow repository instructions. Never message, post, comment, review, email, or otherwise communicate with another person through an external service. Keep artifacts local.\n`
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

execFileSync(process.execPath, [join(scriptDirectory, "sync-pstack-notices.mjs")], {
  cwd: repositoryRoot,
  env: { ...process.env, PSTACK_SOURCE_ROOT: pstackRoot },
  stdio: "inherit"
});

console.log(`created ${relative(repositoryRoot, pluginDirectory)}`);
