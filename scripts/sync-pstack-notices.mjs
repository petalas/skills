import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import prettier from "prettier";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..");
const sourceRoot =
  process.env.PSTACK_SOURCE_ROOT ?? resolve(repositoryRoot, "..", "plugins", "pstack");
const importsManifest = JSON.parse(
  readFileSync(join(repositoryRoot, "docs", "pstack-imports.json"), "utf8")
);

if (!existsSync(join(sourceRoot, "LICENSE"))) {
  throw new Error(`pstack source not found at ${sourceRoot}; set PSTACK_SOURCE_ROOT`);
}

const license = readFileSync(join(sourceRoot, "LICENSE"), "utf8").trim();

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
    const sourceFile = join(sourceRoot, sourcePath);
    const destinationFile = join(skillDirectory, destinationPath);
    if (!existsSync(sourceFile)) throw new Error(`missing source ${sourcePath}`);
    if (!existsSync(destinationFile)) {
      throw new Error(
        `missing destination ${relative(repositoryRoot, destinationFile)} for ${sourcePath}`
      );
    }
    const unchanged = readFileSync(sourceFile).equals(readFileSync(destinationFile));
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
