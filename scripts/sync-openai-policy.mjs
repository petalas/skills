import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  openaiPolicyPath,
  parseFrontmatter,
  parseImplicitInvocationPolicy,
  skillAllowsImplicitInvocation,
  withPolicyBlock
} from "./lib/skill-invocation.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const checkOnly = process.argv.includes("--check");
const pluginsDirectory = join(repositoryRoot, "plugins");

function listDirectories(path) {
  if (!existsSync(path)) return [];
  return readdirSync(path)
    .sort()
    .map((entry) => join(path, entry))
    .filter((child) => statSync(child).isDirectory());
}

const skillDirectories = listDirectories(pluginsDirectory).flatMap((pluginDirectory) =>
  listDirectories(join(pluginDirectory, "skills"))
);

const problems = [];
let changed = 0;

for (const skillDirectory of skillDirectories) {
  const skillPath = join(skillDirectory, "SKILL.md");
  const policyPath = openaiPolicyPath(skillDirectory);
  const skillLabel = relative(repositoryRoot, skillPath);
  const policyLabel = relative(repositoryRoot, policyPath);

  if (!existsSync(skillPath)) {
    problems.push(`${skillLabel} is missing`);
    continue;
  }
  if (!existsSync(policyPath)) {
    problems.push(`${policyLabel} is missing`);
    continue;
  }

  const frontmatter = parseFrontmatter(readFileSync(skillPath, "utf8"));
  if (!frontmatter) {
    problems.push(`${skillLabel} has no YAML frontmatter`);
    continue;
  }

  const allowImplicit = skillAllowsImplicitInvocation(frontmatter);
  const current = readFileSync(policyPath, "utf8");
  const expected = withPolicyBlock(current, allowImplicit);
  if (current === expected) continue;

  changed += 1;
  if (checkOnly) {
    const currentPolicy = parseImplicitInvocationPolicy(current);
    problems.push(
      currentPolicy === null
        ? `${policyLabel} lacks policy.allow_implicit_invocation (expected ${allowImplicit})`
        : `${policyLabel} sets allow_implicit_invocation: ${currentPolicy}, expected ${allowImplicit}`
    );
    continue;
  }
  writeFileSync(policyPath, expected);
  console.log(`${policyLabel}: allow_implicit_invocation: ${allowImplicit}`);
}

if (problems.length > 0) {
  console.error(
    checkOnly ? "openai policy is stale; run bun run policy:sync\n" : "openai policy sync failed\n"
  );
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log(
  checkOnly
    ? `openai policy is current (${skillDirectories.length} skills)`
    : `openai policy updated (${changed} of ${skillDirectories.length} files changed)`
);
