import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const scenarios = JSON.parse(
  readFileSync(join(repositoryRoot, "tests", "pstack-scenarios.json"), "utf8")
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const scenario of scenarios) {
  const path = join(repositoryRoot, scenario.file);
  const contents = readFileSync(path, "utf8");

  for (const expected of scenario.includes ?? []) {
    assert(
      contents.includes(expected),
      `${scenario.name}: ${scenario.file} is missing ${expected}`
    );
  }

  for (const forbidden of scenario.excludes ?? []) {
    assert(
      !contents.includes(forbidden),
      `${scenario.name}: ${scenario.file} contains ${forbidden}`
    );
  }
}

const skillsBinary = join(repositoryRoot, "node_modules", ".bin", "skills");
assert(existsSync(skillsBinary), "skills CLI is not installed; run bun install");

const fixtureRoot = mkdtempSync(join(tmpdir(), "petalas-skills-install-"));

try {
  const standaloneValidation = spawnSync(
    process.execPath,
    [join(repositoryRoot, "scripts", "validate-pstack-imports.mjs")],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        PSTACK_SOURCE_ROOT: join(fixtureRoot, "no-pstack-checkout")
      }
    }
  );
  assert(
    standaloneValidation.status === 0,
    `standalone provenance validation failed:\n${standaloneValidation.stdout}\n${standaloneValidation.stderr}`
  );

  const git = spawnSync("git", ["init", "--quiet"], {
    cwd: fixtureRoot,
    encoding: "utf8"
  });
  assert(git.status === 0, `installation fixture git init failed: ${git.stderr}`);

  const install = spawnSync(
    skillsBinary,
    ["add", repositoryRoot, "--skill", "bro", "--agent", "codex", "--copy", "--yes"],
    {
      cwd: fixtureRoot,
      encoding: "utf8",
      env: { ...process.env, CI: "1", DO_NOT_TRACK: "1" }
    }
  );
  assert(
    install.status === 0,
    `local skills installation failed:\n${install.stdout}\n${install.stderr}`
  );

  const installedRoot = join(fixtureRoot, ".agents", "skills", "bro");
  for (const relativePath of ["SKILL.md", "THIRD_PARTY_NOTICES.md", "agents/openai.yaml"]) {
    assert(
      existsSync(join(installedRoot, relativePath)),
      `installed bro skill is missing ${relativePath}`
    );
  }

  const notice = readFileSync(join(installedRoot, "THIRD_PARTY_NOTICES.md"), "utf8");
  assert(notice.includes("Copyright (c) 2026 Lauren Tan"), "installed notice lost copyright");
  assert(
    notice.includes("799151d91b6e12ee7dbd09f708eec108d7de9b3b"),
    "installed notice lost pinned source commit"
  );
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log(`${scenarios.length} pstack behavior scenarios and installation fixture passed`);
