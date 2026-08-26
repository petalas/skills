import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const pluginRoot = join(repositoryRoot, "plugins", "fix-all-issues");
const skillRoot = join(pluginRoot, "skills", "fix-all-issues");
const skillPath = join(skillRoot, "SKILL.md");
const commandPath = join(pluginRoot, "commands", "fix-all-issues.md");
const readmePath = join(pluginRoot, "README.md");
const manifestPath = join(pluginRoot, ".codex-plugin", "plugin.json");
const schemaPath = join(skillRoot, "schemas", "run-state.schema.json");
const casesPath = join(skillRoot, "schemas", "protocol-cases.json");

const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

function read(path) {
  return readFileSync(path, "utf8");
}

function filesUnder(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

const requiredFiles = [
  "references/protocol.md",
  "references/reviewer-lenses.md",
  "references/triage.md",
  "references/validation.md",
  "references/pr-delivery.md",
  "templates/round-coordinator.md",
  "templates/reviewer.md",
  "templates/triager.md",
  "templates/fixer.md",
  "schemas/run-state.schema.json",
  "schemas/protocol-cases.json"
];

for (const relativePath of requiredFiles) {
  check(existsSync(join(skillRoot, relativePath)), `missing required skill file: ${relativePath}`);
}

const skill = read(skillPath);
const command = read(commandPath);
const readme = read(readmePath);
const manifest = JSON.parse(read(manifestPath));
const versionMatch = skill.match(/^version:\s*(\d+\.\d+\.\d+)$/m);

check(Boolean(versionMatch), "SKILL.md must declare a semantic version");
check(versionMatch?.[1] === manifest.version, "SKILL.md and plugin.json versions must match");
check(
  readme.includes(`Version ${manifest.version}`),
  "README must name the released plugin version"
);
check(
  /^disable-model-invocation:\s*true$/m.test(skill),
  "fix-all-issues must disable direct model invocation"
);

const sharedInputs = [
  "review_mode",
  "num_agents",
  "orchestrator_only",
  "fresh_round_context",
  "stop_policy",
  "required_clean_outer_rounds",
  "max_outer_rounds",
  "max_fix_rounds",
  "max_rounds",
  "cap_strategy",
  "progress"
];

for (const input of sharedInputs) {
  for (const [name, content] of [
    ["SKILL.md", skill],
    ["command", command],
    ["README", readme]
  ]) {
    check(content.includes(`\`${input}\``), `${name} is missing shared input ${input}`);
  }
}

for (const link of skill.matchAll(/\]\((references|templates|schemas)\/([^)]+)\)/g)) {
  const relativePath = `${link[1]}/${link[2]}`;
  check(
    existsSync(resolve(skillRoot, relativePath)),
    `SKILL.md link does not resolve: ${relativePath}`
  );
}

const runSchema = JSON.parse(read(schemaPath));
check(
  runSchema.$schema === "https://json-schema.org/draft/2020-12/schema",
  "run-state schema must use draft 2020-12"
);
check(
  runSchema.properties?.current?.$ref === "#/$defs/snapshot",
  "run-state schema must bind current state to a snapshot"
);

const protocolCases = JSON.parse(read(casesPath));
const caseNames = protocolCases.cases?.map((entry) => entry.name) ?? [];
check(protocolCases.schema_version === "1.0.0", "protocol cases must declare schema version 1.0.0");
check(caseNames.length === new Set(caseNames).size, "protocol case names must be unique");

const requiredOutcomes = new Set([
  "fix-forbidden",
  "fix-allowed",
  "review-and-validation-invalid",
  "cold-review-invalid",
  "design-pass-required",
  "clean",
  "capped-stabilized",
  "capped-with-residuals",
  "deployment-forbidden"
]);
const actualOutcomes = new Set(protocolCases.cases?.map((entry) => entry.expected));
for (const outcome of requiredOutcomes) {
  check(actualOutcomes.has(outcome), `protocol cases missing expected outcome: ${outcome}`);
}

function evaluateProtocolCase(givenValues) {
  const given = new Set(givenValues);
  if (given.has("no-explicit-deploy-authority")) return "deployment-forbidden";
  if (given.has("candidate-tree-changed")) return "review-and-validation-invalid";
  if (given.has("pr-body-behavior-hash-changed")) return "cold-review-invalid";
  if (given.has("same-invariant-accepted-count-3")) return "design-pass-required";
  if (given.has("outer-cap-reached") && given.has("actionable-residuals"))
    return "capped-with-residuals";
  if (
    given.has("outer-cap-reached") &&
    given.has("inner-stable") &&
    given.has("fresh-zero-incomplete")
  ) {
    return "capped-stabilized";
  }
  if (given.has("required-fresh-zero-complete") && given.has("final-validation-green"))
    return "clean";
  if (
    given.has("verified") &&
    given.has("primary-accepted") &&
    given.has("second-accepted") &&
    given.has("disagreement-resolved")
  ) {
    return "fix-allowed";
  }
  return "fix-forbidden";
}

for (const protocolCase of protocolCases.cases ?? []) {
  check(
    evaluateProtocolCase(protocolCase.given) === protocolCase.expected,
    `protocol case failed: ${protocolCase.name}`
  );
}

for (const path of filesUnder(pluginRoot)) {
  if (!statSync(path).isFile()) continue;
  const bytes = readFileSync(path);
  check(
    !bytes.some((byte) => byte > 0x7f),
    `non-ASCII byte in ${path.slice(repositoryRoot.length + 1)}`
  );
}

if (failures.length > 0) {
  console.error("fix-all-issues validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`fix-all-issues ${manifest.version} validation passed`);
