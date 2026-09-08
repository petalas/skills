// Validates the packaging of plugins authored in this repository (every
// plugins/<name> that docs/pstack-imports.json does not list). Imported plugins
// are covered by validate-pstack-imports.mjs.

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  openaiPolicyPath,
  parseFrontmatter,
  readOpenaiPolicy,
  skillAllowsImplicitInvocation
} from "./lib/skill-invocation.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const pluginsDirectory = join(repositoryRoot, "plugins");
const importsManifest = JSON.parse(
  readFileSync(join(repositoryRoot, "docs", "pstack-imports.json"), "utf8")
);
const marketplace = JSON.parse(
  readFileSync(join(repositoryRoot, ".agents", "plugins", "marketplace.json"), "utf8")
);

const importedNames = new Set(importsManifest.imports.map((entry) => entry.name));
const marketplaceNames = new Set(marketplace.plugins.map((entry) => entry.name));
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function label(path) {
  return relative(repositoryRoot, path);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    failures.push(`${label(path)} is invalid JSON: ${error.message}`);
    return null;
  }
}

const localPlugins = readdirSync(pluginsDirectory, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !importedNames.has(entry.name))
  .map((entry) => entry.name)
  .sort();

for (const name of localPlugins) {
  const pluginDirectory = join(pluginsDirectory, name);
  const skillDirectory = join(pluginDirectory, "skills", name);
  const skillPath = join(skillDirectory, "SKILL.md");
  const manifestPath = join(pluginDirectory, ".codex-plugin", "plugin.json");
  const policyPath = openaiPolicyPath(skillDirectory);

  for (const path of [
    join(pluginDirectory, "commands", `${name}.md`),
    join(pluginDirectory, "README.md")
  ]) {
    check(existsSync(path), `missing ${label(path)}`);
  }
  check(
    marketplaceNames.has(name),
    `${name} is missing from .agents/plugins/marketplace.json; run bun run catalog:sync`
  );

  if (!existsSync(skillPath)) {
    failures.push(`missing ${label(skillPath)}`);
    continue;
  }
  const frontmatter = parseFrontmatter(readFileSync(skillPath, "utf8"));
  if (!frontmatter) {
    failures.push(`${label(skillPath)} has no YAML frontmatter`);
    continue;
  }
  const version = frontmatter.get("version") ?? "";
  check(frontmatter.get("name") === name, `${label(skillPath)} name does not match its directory`);
  check(/^\d+\.\d+\.\d+$/.test(version), `${label(skillPath)} has no semantic version`);
  check((frontmatter.get("description") ?? "") !== "", `${label(skillPath)} has no description`);

  if (!existsSync(manifestPath)) {
    failures.push(`missing ${label(manifestPath)}`);
  } else {
    const manifest = readJson(manifestPath);
    if (manifest) {
      check(manifest.name === name, `${label(manifestPath)} name does not match its directory`);
      check(
        manifest.version === version,
        `${label(manifestPath)} version ${manifest.version} does not match SKILL.md version ${version}`
      );
    }
  }

  if (!existsSync(policyPath)) {
    failures.push(
      `${label(policyPath)} is missing; add agents/openai.yaml with interface and policy blocks (scripts/scaffold-pstack-plugin.mjs shows the shape)`
    );
    continue;
  }
  try {
    const expectedPolicy = skillAllowsImplicitInvocation(frontmatter, label(skillPath));
    const policy = readOpenaiPolicy(skillDirectory, label(policyPath));
    if (policy === null) {
      failures.push(
        `${label(policyPath)} policy.allow_implicit_invocation is missing or unparseable (expected ${expectedPolicy}); run bun run policy:sync`
      );
    } else if (policy !== expectedPolicy) {
      failures.push(
        `${label(policyPath)} sets allow_implicit_invocation: ${policy}, but ${label(skillPath)} requires ${expectedPolicy}; run bun run policy:sync`
      );
    }
  } catch (error) {
    failures.push(error.message);
  }
}

if (failures.length > 0) {
  console.error("local plugin validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `local plugin validation passed (${localPlugins.length} plugins: ${localPlugins.join(", ")})`
);
