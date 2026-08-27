import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const checkOnly = process.argv.includes("--check");
const pluginsDirectory = join(repositoryRoot, "plugins");

const plugins = readdirSync(pluginsDirectory)
  .map((directory) => {
    const manifestPath = join(pluginsDirectory, directory, ".codex-plugin", "plugin.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    return { directory, manifest };
  })
  .sort((left, right) => left.manifest.name.localeCompare(right.manifest.name));

function escapeTable(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function concise(value, limit = 150) {
  const plain = String(value).replace(/\s+/g, " ").trim();
  return plain.length <= limit ? plain : `${plain.slice(0, limit - 3)}...`;
}

const marketplace = {
  name: "petalas-skills",
  interface: { displayName: "Petalas Skills" },
  plugins: plugins.map(({ directory, manifest }) => ({
    name: manifest.name,
    source: { source: "local", path: `./plugins/${directory}` },
    policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
    category: manifest.interface?.category ?? "Coding"
  }))
};
const marketplaceText = await prettier.format(JSON.stringify(marketplace), {
  parser: "json"
});

const catalogRows = plugins
  .map(({ directory, manifest }) => {
    const description = manifest.interface?.shortDescription ?? manifest.description ?? "";
    return `| [\`${escapeTable(manifest.name)}\`](../plugins/${directory}/README.md) | ${escapeTable(manifest.interface?.category ?? "Coding")} | ${escapeTable(description)} |`;
  })
  .join("\n");
const catalogText = await prettier.format(
  `# Skill catalog

This repository publishes ${plugins.length} independently installable skills.

| Skill | Category | What it does |
| --- | --- | --- |
${catalogRows}

Install any entry by name:

\`\`\`bash
bunx skills@latest add petalas/skills --skill <skill-name> -g -y
\`\`\`
`,
  { parser: "markdown" }
);

const readmePath = join(repositoryRoot, "README.md");
const readme = readFileSync(readmePath, "utf8");
const begin = "<!-- BEGIN GENERATED SKILL CATALOG -->";
const end = "<!-- END GENERATED SKILL CATALOG -->";
const startIndex = readme.indexOf(begin);
const endIndex = readme.indexOf(end);
if (startIndex < 0 || endIndex < startIndex) {
  throw new Error("README.md is missing generated catalog markers");
}
const readmeRows = plugins
  .map(({ directory, manifest }) => {
    const description = concise(manifest.interface?.shortDescription ?? manifest.description ?? "");
    return `| [\`${escapeTable(manifest.name)}\`](plugins/${directory}/README.md) | ${escapeTable(description)} |`;
  })
  .join("\n");
const generatedReadme = `${begin}

| Skill | What it does |
| --- | --- |
${readmeRows}

See the [full catalog](docs/PLUGIN_CATALOG.md) for categories and installation.

${end}`;
const readmeText = await prettier.format(
  `${readme.slice(0, startIndex)}${generatedReadme}${readme.slice(endIndex + end.length)}`,
  { parser: "markdown" }
);

const outputs = [
  [join(repositoryRoot, ".agents", "plugins", "marketplace.json"), marketplaceText],
  [join(repositoryRoot, "docs", "PLUGIN_CATALOG.md"), catalogText],
  [readmePath, readmeText]
];

let stale = false;
for (const [path, expected] of outputs) {
  const actual = (() => {
    try {
      return readFileSync(path, "utf8");
    } catch {
      return "";
    }
  })();
  if (actual === expected) continue;
  stale = true;
  if (!checkOnly) writeFileSync(path, expected);
}

if (checkOnly && stale) {
  console.error("plugin catalog is stale; run bun run catalog:sync");
  process.exit(1);
}

console.log(checkOnly ? "plugin catalog is current" : "plugin catalog updated");
