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
const runSchemaPath = join(skillRoot, "schemas", "run-state.schema.json");
const evidenceSchemaPath = join(skillRoot, "schemas", "evidence-packet.schema.json");
const findingsSchemaPath = join(skillRoot, "schemas", "findings.schema.json");
const validationSchemaPath = join(skillRoot, "schemas", "validation-ledger.schema.json");
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
  "templates/verifier.md",
  "templates/triager.md",
  "templates/fixer.md",
  "templates/cold-reviewer.md",
  "schemas/run-state.schema.json",
  "schemas/evidence-packet.schema.json",
  "schemas/findings.schema.json",
  "schemas/validation-ledger.schema.json",
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
  "reviewer_timebox_minutes",
  "early_claim_minutes",
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

const runSchema = JSON.parse(read(runSchemaPath));
const evidenceSchema = JSON.parse(read(evidenceSchemaPath));
const findingsSchema = JSON.parse(read(findingsSchemaPath));
const validationSchema = JSON.parse(read(validationSchemaPath));

for (const [name, schema] of [
  ["run-state", runSchema],
  ["evidence-packet", evidenceSchema],
  ["findings", findingsSchema],
  ["validation-ledger", validationSchema]
]) {
  check(
    schema.$schema === "https://json-schema.org/draft/2020-12/schema",
    `${name} schema must use draft 2020-12`
  );
}

check(
  runSchema.properties?.current?.$ref === "#/$defs/snapshot",
  "run state must bind current snapshot"
);
check(
  runSchema.$defs?.snapshot?.required?.includes("remote_body_hash") &&
    runSchema.$defs?.snapshot?.required?.includes("proposed_body_hash") &&
    !runSchema.$defs?.snapshot?.properties?.pr_body_hash,
  "run state must separate remote and proposed body hashes"
);
check(
  runSchema.$defs?.growth?.properties?.qualifying_finding_routed_for_growth?.const === false,
  "growth schema must forbid routing qualifying findings for growth"
);
check(
  runSchema.$defs?.capacity?.properties?.reserved_independent_slots?.minimum >= 2,
  "run state must reserve independent triage and cold-review capacity"
);
check(
  runSchema.properties?.terminal_state?.enum?.includes("scope-routed") &&
    runSchema.properties?.terminal_state?.enum?.includes("blocked") &&
    runSchema.properties?.terminal_state?.enum?.includes("capped-in-envelope-green"),
  "run state must distinguish scope-routed, blocked, and capped terminals"
);
check(
  evidenceSchema.required?.includes("change_contracts") &&
    evidenceSchema.required?.includes("remote_body_hash") &&
    evidenceSchema.required?.includes("proposed_body_hash") &&
    evidenceSchema.$defs?.change_contract?.required?.includes("callers"),
  "evidence packet must structure body phases, change contracts, and caller rows"
);
check(
  findingsSchema.$defs?.finding?.required?.includes("attribution") &&
    findingsSchema.$defs?.finding?.required?.includes("responsibility") &&
    findingsSchema.$defs?.finding?.required?.includes("route") &&
    findingsSchema.$defs?.finding?.properties?.disposition?.enum?.includes("deferred") &&
    findingsSchema.$defs?.route?.properties?.kind?.enum?.includes("routed-user-authority"),
  "finding ledger must structure attribution, responsibility, and routes"
);
check(
  validationSchema.$defs?.entry?.required?.includes("affected_surfaces") &&
    validationSchema.$defs?.entry?.properties?.status?.enum?.includes("reused") &&
    validationSchema.$defs?.entry?.properties?.status?.enum?.includes("invalidated"),
  "validation ledger must support affected-surface invalidation and reuse"
);

const requiredPhrases = [
  "second accepted finding",
  "cold code and proposed-body",
  "critical path",
  "small fixed pool",
  "routed-follow-up"
];
for (const phrase of requiredPhrases) {
  check(skill.includes(phrase), `SKILL.md missing required protocol phrase: ${phrase}`);
}

const protocolCases = JSON.parse(read(casesPath));
const caseNames = protocolCases.cases?.map((entry) => entry.name) ?? [];
check(protocolCases.schema_version === "2.0.0", "protocol cases must declare schema version 2.0.0");
check(caseNames.length === new Set(caseNames).size, "protocol case names must be unique");

function evaluateProtocolCase(givenValues) {
  const given = new Set(givenValues);
  if (given.has("no-explicit-deploy-authority")) return "deployment-forbidden";
  if (given.has("required-authority-missing") && given.has("in-envelope")) return "blocked";
  if (given.has("outer-cap-reached") && given.has("qualifying-residuals")) {
    return "capped-with-residuals";
  }
  if (
    given.has("outer-cap-reached") &&
    given.has("in-envelope-green") &&
    given.has("fresh-zero-incomplete")
  ) {
    return "capped-in-envelope-green";
  }
  if (
    given.has("required-fresh-zero-complete") &&
    given.has("final-validation-green") &&
    given.has("routed-issues-exist")
  ) {
    return "scope-routed";
  }
  if (
    given.has("required-fresh-zero-complete") &&
    given.has("final-validation-green") &&
    given.has("no-routed-issues")
  ) {
    return "clean";
  }
  if (given.has("qualifying-finding-seen")) return "fresh-zero-not-earned";
  if (given.has("remote-body-hash-changed") && given.has("proposal-exists")) {
    return "rebase-proposal-and-rereview";
  }
  if (given.has("proposed-body-hash-changed")) return "body-review-invalid";
  if (
    given.has("root-command-already-passed") &&
    given.has("same-tree") &&
    given.has("same-environment")
  ) {
    return "root-validation-repeat-alarm";
  }
  if (
    given.has("prior-entry-passed") &&
    given.has("dependencies-unchanged") &&
    given.has("surfaces-disjoint")
  ) {
    return "validation-reuse-row-required";
  }
  if (given.has("cleanup-zero") && given.has("cold-code-zero") && given.has("cold-body-zero")) {
    return "root-validation-allowed";
  }
  if (given.has("cleanup-zero") || given.has("cold-code-zero") || given.has("cold-body-zero")) {
    return "root-validation-forbidden";
  }
  if (given.has("same-invariant-accepted-count-2")) return "consolidation-required";
  if (given.has("growth-triggered") && given.has("in-envelope")) {
    return "consolidation-required";
  }
  if (given.has("out-of-envelope") && given.has("verified")) return "route-required";
  if (given.has("verdict-disagreement")) return "resolver-required";
  if (
    given.has("primary-accepted") &&
    given.has("independent-accepted") &&
    !given.has("verified")
  ) {
    return "resolver-forbidden";
  }
  if (given.has("next-outer-round") && given.has("fresh-round-context")) {
    return "fresh-pool-required";
  }
  if (given.has("stop-policy-fresh-zero") && given.has("fresh-round-context-false")) {
    return "fresh-zero-config-invalid";
  }
  if (given.has("early-claim-deadline")) return "claim-checkpoint-required";
  if (given.has("same-outer-round") && given.has("compatible-idle-worker")) return "reuse-worker";
  if (given.has("assigned-lens-exhausted")) return "review-stop";
  if (given.has("fix-batches-ready") && given.has("file-ownership-overlap")) {
    return "single-owner-required";
  }
  if (given.has("fix-batches-ready") && given.has("file-ownership-disjoint")) {
    return "parallel-fix-allowed";
  }

  const independentlyAccepted = given.has("independent-accepted");
  const proportionalQuickGate = given.has("quick") && given.has("P2") && given.has("ordinary-risk");
  if (
    given.has("verified") &&
    given.has("in-envelope") &&
    given.has("primary-accepted") &&
    (independentlyAccepted || proportionalQuickGate)
  ) {
    return "fix-allowed";
  }
  return "fix-forbidden";
}

const requiredOutcomes = new Set([
  "fix-forbidden",
  "fix-allowed",
  "resolver-required",
  "resolver-forbidden",
  "route-required",
  "consolidation-required",
  "root-validation-forbidden",
  "root-validation-allowed",
  "root-validation-repeat-alarm",
  "validation-reuse-row-required",
  "body-review-invalid",
  "rebase-proposal-and-rereview",
  "fresh-zero-not-earned",
  "clean",
  "scope-routed",
  "capped-in-envelope-green",
  "capped-with-residuals",
  "blocked",
  "reuse-worker",
  "fresh-pool-required",
  "fresh-zero-config-invalid",
  "claim-checkpoint-required",
  "review-stop",
  "parallel-fix-allowed",
  "single-owner-required",
  "deployment-forbidden"
]);
const actualOutcomes = new Set(protocolCases.cases?.map((entry) => entry.expected));
for (const outcome of requiredOutcomes) {
  check(actualOutcomes.has(outcome), `protocol cases missing expected outcome: ${outcome}`);
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
