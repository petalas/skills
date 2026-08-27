import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const sourceRoot = resolve(
  process.env.PSTACK_SOURCE_ROOT ?? resolve(repositoryRoot, "..", "plugins", "pstack")
);
const approvedSourceCommit = "799151d91b6e12ee7dbd09f708eec108d7de9b3b";
const importsManifest = JSON.parse(
  readFileSync(join(repositoryRoot, "docs", "pstack-imports.json"), "utf8")
);

if (importsManifest.sourceCommit !== approvedSourceCommit) {
  throw new Error(`pstack import manifest must pin approved commit ${approvedSourceCommit}`);
}

if (!existsSync(sourceRoot)) {
  throw new Error(`pstack source not found at ${sourceRoot}; set PSTACK_SOURCE_ROOT`);
}

const gitRoot = execFileSync("git", ["-C", sourceRoot, "rev-parse", "--show-toplevel"], {
  encoding: "utf8"
}).trim();
const resolvedSourceCommit = execFileSync(
  "git",
  ["-C", gitRoot, "rev-parse", "--verify", `${approvedSourceCommit}^{commit}`],
  { encoding: "utf8" }
).trim();
if (resolvedSourceCommit !== approvedSourceCommit) {
  throw new Error(`pstack source does not contain approved commit ${approvedSourceCommit}`);
}

const sourceTreePrefix = relative(gitRoot, sourceRoot).split("\\").join("/");
if (sourceTreePrefix === ".." || sourceTreePrefix.startsWith("../")) {
  throw new Error(`pstack source root ${sourceRoot} is outside git root ${gitRoot}`);
}

function readSourceBlob(sourcePath) {
  if (
    sourcePath.startsWith("/") ||
    sourcePath === ".." ||
    sourcePath.startsWith("../") ||
    sourcePath.includes("/../")
  ) {
    throw new Error(`unsafe pstack source path: ${sourcePath}`);
  }

  const treePath = sourceTreePrefix ? `${sourceTreePrefix}/${sourcePath}` : sourcePath;
  try {
    return execFileSync("git", ["-C", gitRoot, "show", `${approvedSourceCommit}:${treePath}`], {
      encoding: null,
      maxBuffer: 16 * 1024 * 1024
    });
  } catch (error) {
    throw new Error(
      `cannot read ${sourcePath} from pstack commit ${approvedSourceCommit}: ${error.message}`
    );
  }
}

const license = readSourceBlob("LICENSE").toString("utf8").trim();

function destinationFor(name, sourcePath) {
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

for (const imported of importsManifest.imports) {
  const skillDirectory = join(repositoryRoot, "plugins", imported.name, "skills", imported.name);

  const mappings = imported.sourcePaths.map((sourcePath) => {
    const destinationPath = destinationFor(imported.name, sourcePath);
    const destinationFile = join(skillDirectory, destinationPath);
    if (!existsSync(destinationFile)) {
      throw new Error(
        `missing destination ${relative(repositoryRoot, destinationFile)} for ${sourcePath}`
      );
    }
    const unchanged = readSourceBlob(sourcePath).equals(readFileSync(destinationFile));
    return `- \`${sourcePath}\` -> \`${destinationPath}\` (${unchanged ? "unchanged" : "modified"})`;
  });

  const notice = await prettier.format(
    `# Third-party notices

## pstack

This skill includes material copied or adapted from pstack.

- Repository: https://github.com/cursor/plugins
- Source commit: ${importsManifest.sourceCommit}
- Source subtree: https://github.com/cursor/plugins/tree/${importsManifest.sourceCommit}/pstack
- Source-to-installed-file mappings:

${mappings.join("\n")}

${license}
`,
    { parser: "markdown" }
  );

  mkdirSync(skillDirectory, { recursive: true });
  writeFileSync(join(skillDirectory, "THIRD_PARTY_NOTICES.md"), notice);
}

console.log(`updated ${importsManifest.imports.length} pstack notices`);
