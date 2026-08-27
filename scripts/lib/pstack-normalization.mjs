import { createHash } from "node:crypto";
import { extname } from "node:path";
import prettier from "prettier";

const prettierOptions = {
  printWidth: 100,
  proseWrap: "preserve",
  tabWidth: 2,
  useTabs: false,
  singleQuote: false,
  trailingComma: "none"
};

export function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function normalizePstackSemanticBytes(bytes, sourcePath) {
  let text = bytes.toString("utf8").replace(/\r\n?/g, "\n");
  if (extname(sourcePath) === ".md") {
    const frontmatter = text.match(/^(---\n)([\s\S]*?)(\n---\n)([\s\S]*)$/);
    if (frontmatter) {
      const fields = frontmatter[2]
        .split("\n")
        .filter((line) => !/^version:\s*/.test(line))
        .sort()
        .join("\n");
      text = `${frontmatter[1]}${fields}${frontmatter[3]}${frontmatter[4]}`;
    }
    text = await prettier.format(text, { ...prettierOptions, parser: "markdown" });
  }
  return Buffer.from(text.replace(/\r\n?/g, "\n"));
}
