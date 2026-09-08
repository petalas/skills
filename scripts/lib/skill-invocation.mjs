import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const policyKey = "policy";
const implicitInvocationKey = "allow_implicit_invocation";

export function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return null;

  const fields = new Map();
  for (const line of match[1].split("\n")) {
    const field = line.match(/^([a-z][a-z-]*):\s*(.+)$/);
    if (field) fields.set(field[1], field[2].replace(/^['"]|['"]$/g, ""));
  }
  return fields;
}

export function skillAllowsImplicitInvocation(frontmatter) {
  return frontmatter.get("disable-model-invocation") !== "true";
}

export function expectedPolicyBlock(allowImplicit) {
  return `${policyKey}:\n  ${implicitInvocationKey}: ${allowImplicit ? "true" : "false"}\n`;
}

export function openaiPolicyPath(skillDirectory) {
  return join(skillDirectory, "agents", "openai.yaml");
}

function isTopLevelLine(line) {
  return /^\S/.test(line);
}

function splitLines(text) {
  const lines = text.split("\n");
  if (lines.at(-1) === "") lines.pop();
  return lines;
}

// Locates the top-level `policy:` mapping. Returns { start, end } line indexes
// (end exclusive, trailing blank lines excluded) or null when absent.
export function locatePolicyBlock(lines) {
  const start = lines.findIndex((line) => /^policy:\s*(?:#.*)?$/.test(line));
  if (start < 0) return null;

  let end = start + 1;
  while (end < lines.length && !isTopLevelLine(lines[end])) end += 1;
  while (end > start + 1 && lines[end - 1].trim() === "") end -= 1;
  return { start, end };
}

export function parseImplicitInvocationPolicy(yamlText) {
  const lines = splitLines(yamlText);
  const block = locatePolicyBlock(lines);
  if (!block) return null;

  for (const line of lines.slice(block.start + 1, block.end)) {
    const field = line.match(/^\s+allow_implicit_invocation:\s*(.+?)\s*(?:#.*)?$/);
    if (!field) continue;
    const value = field[1].replace(/^['"]|['"]$/g, "").toLowerCase();
    if (value === "true") return true;
    if (value === "false") return false;
    return null;
  }
  return null;
}

export function readOpenaiPolicy(skillDirectory) {
  const path = openaiPolicyPath(skillDirectory);
  if (!existsSync(path)) return null;
  return parseImplicitInvocationPolicy(readFileSync(path, "utf8"));
}

// Rewrites only the `policy:` block: replaces it in place when present,
// otherwise appends it after the existing content. Everything else is kept.
export function withPolicyBlock(yamlText, allowImplicit) {
  const block = expectedPolicyBlock(allowImplicit);
  const lines = splitLines(yamlText);
  const existing = locatePolicyBlock(lines);
  if (!existing) {
    const body = yamlText === "" || yamlText.endsWith("\n") ? yamlText : `${yamlText}\n`;
    return body === "" ? block : `${body}\n${block}`;
  }

  const blockLines = splitLines(block);
  lines.splice(existing.start, existing.end - existing.start, ...blockLines);
  return `${lines.join("\n")}\n`;
}
