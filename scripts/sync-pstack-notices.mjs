import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { dirname, join, posix, relative, resolve } from "node:path";
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
  if (!isSafeRelativePath(sourcePath)) {
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

function isSafeRelativePath(path) {
  return (
    typeof path === "string" &&
    path.length > 0 &&
    !path.includes("\\") &&
    !posix.isAbsolute(path) &&
    posix.normalize(path) === path &&
    path !== "." &&
    !path.startsWith("../")
  );
}

const licenseBytes = readSourceBlob("LICENSE");
const license = licenseBytes.toString("utf8").trim();
if (
  createHash("sha256").update(licenseBytes).digest("hex") !== importsManifest.licenseSourceSha256
) {
  throw new Error("pstack LICENSE does not match the committed source hash");
}

for (const imported of importsManifest.imports) {
  const skillDirectory = join(repositoryRoot, "plugins", imported.name, "skills", imported.name);

  const mappings = imported.mappings.map((mapping) => {
    if (!isSafeRelativePath(mapping.destination)) {
      throw new Error(`unsafe installed destination: ${mapping.destination}`);
    }
    const sourceBytes = readSourceBlob(mapping.source);
    const sourceSha256 = createHash("sha256").update(sourceBytes).digest("hex");
    if (sourceSha256 !== mapping.sourceSha256) {
      throw new Error(
        `${mapping.source} at ${approvedSourceCommit} does not match its committed source hash`
      );
    }

    const destinationPath = mapping.destination;
    const destinationFile = resolve(skillDirectory, destinationPath);
    if (!destinationFile.startsWith(`${skillDirectory}/`)) {
      throw new Error(`installed destination escapes ${imported.name}: ${destinationPath}`);
    }
    if (!existsSync(destinationFile)) {
      throw new Error(
        `missing destination ${relative(repositoryRoot, destinationFile)} for ${mapping.source}`
      );
    }
    const destinationSha256 = createHash("sha256")
      .update(readFileSync(destinationFile))
      .digest("hex");
    return `- \`${mapping.source}\` -> \`${destinationPath}\` (${destinationSha256 === mapping.sourceSha256 ? "unchanged" : "modified"})`;
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
