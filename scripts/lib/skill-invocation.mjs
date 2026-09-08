import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const policyKey = "policy";
const implicitInvocationKey = "allow_implicit_invocation";
const invocationField = "disable-model-invocation";

// Matches any character outside printable ASCII plus tab, LF, and CR. Shared by
// every check that requires ASCII-only skill text so they agree on the rule.
export const nonAsciiPattern = /[^\x09\x0a\x0d\x20-\x7e]/;

// Strips one layer of YAML double or single quotes from a scalar.
export function unquoteYamlScalar(value) {
  const text = value.trim();
  if (text.length >= 2 && text.startsWith('"') && text.endsWith('"')) {
    return text.slice(1, -1).replaceAll('\\"', '"').replaceAll("\\\\", "\\");
  }
  if (text.length >= 2 && text.startsWith("'") && text.endsWith("'")) {
    return text.slice(1, -1).replaceAll("''", "'");
  }
  return text;
}

// Minimal YAML reader for skill frontmatter: top-level `key: value` pairs plus
// `>`/`|` block scalars. Nested mappings are skipped.
function parseFrontmatterFields(yamlText) {
  const fields = new Map();
  const lines = yamlText.split("\n");
  let cursor = 0;
  while (cursor < lines.length) {
    const match = /^([A-Za-z0-9_-]+):(.*)$/.exec(lines[cursor]);
    if (!match) {
      cursor += 1;
      continue;
    }
    const key = match[1];
    const rawValue = match[2].trim();
    if (/^[>|]-?$/.test(rawValue)) {
      const block = [];
      cursor += 1;
      while (
        cursor < lines.length &&
        (lines[cursor].startsWith(" ") || lines[cursor].trim() === "")
      ) {
        block.push(lines[cursor].trim());
        cursor += 1;
      }
      fields.set(key, block.join(rawValue.startsWith(">") ? " " : "\n").trim());
      continue;
    }
    fields.set(key, unquoteYamlScalar(rawValue));
    cursor += 1;
  }
  return fields;
}

// Splits a markdown document into its frontmatter fields and body. Returns null
// when the document has no leading `---` frontmatter block.
export function splitFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: parseFrontmatterFields(match[1]), body: match[2] };
}

export function parseFrontmatter(markdown) {
  return splitFrontmatter(markdown)?.frontmatter ?? null;
}

// Reads `disable-model-invocation` strictly: absent, true, or false. Any other
// value is a mistake in the skill and is reported instead of failing open.
export function skillAllowsImplicitInvocation(frontmatter, label = "SKILL.md") {
  const raw = frontmatter.get(invocationField);
  if (raw === undefined) return true;
  const value = unquoteYamlScalar(raw).toLowerCase();
  if (value === "true") return false;
  if (value === "false") return true;
  throw new Error(
    `${label}: ${invocationField} must be true or false, found ${JSON.stringify(raw)}`
  );
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

// Locates the top-level `policy:` block mapping. Returns { start, end } line
// indexes (end exclusive, trailing blank lines excluded) or null when absent.
// Throws when `policy:` carries an inline value such as a flow mapping,
// because that form cannot be edited line by line.
export function locatePolicyBlock(lines, label = "openai.yaml") {
  const start = lines.findIndex((line) => line.startsWith(`${policyKey}:`));
  if (start < 0) return null;

  const inlineValue = lines[start].slice(policyKey.length + 1).trim();
  if (inlineValue !== "" && !inlineValue.startsWith("#")) {
    throw new Error(
      `${label}: "${policyKey}:" must be a block mapping with indented children, found inline value ${JSON.stringify(inlineValue)}`
    );
  }

  let end = start + 1;
  while (end < lines.length && !isTopLevelLine(lines[end])) end += 1;
  while (end > start + 1 && lines[end - 1].trim() === "") end -= 1;
  return { start, end };
}

const implicitInvocationLinePattern = new RegExp(
  `^(\\s+)${implicitInvocationKey}:\\s*(.*?)\\s*(#.*)?$`
);

function findImplicitInvocationLine(lines, block) {
  for (let cursor = block.start + 1; cursor < block.end; cursor += 1) {
    const match = implicitInvocationLinePattern.exec(lines[cursor]);
    if (match) return { index: cursor, indent: match[1], value: match[2], comment: match[3] };
  }
  return null;
}

export function parseImplicitInvocationPolicy(yamlText, label = "openai.yaml") {
  const lines = splitLines(yamlText);
  const block = locatePolicyBlock(lines, label);
  if (!block) return null;

  const field = findImplicitInvocationLine(lines, block);
  if (!field) return null;
  const value = unquoteYamlScalar(field.value).toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function readOpenaiPolicy(skillDirectory, label = openaiPolicyPath(skillDirectory)) {
  const path = openaiPolicyPath(skillDirectory);
  if (!existsSync(path)) return null;
  return parseImplicitInvocationPolicy(readFileSync(path, "utf8"), label);
}

function childIndent(lines, block) {
  for (let cursor = block.start + 1; cursor < block.end; cursor += 1) {
    const match = /^(\s+)\S/.exec(lines[cursor]);
    if (match) return match[1];
  }
  return "  ";
}

// Rewrites only `policy.allow_implicit_invocation`. When a `policy:` block
// exists, that one line is replaced (or inserted as the first child) and every
// other child line and comment is kept. Otherwise the canonical block is
// appended after the existing content.
export function withPolicyBlock(yamlText, allowImplicit, label = "openai.yaml") {
  const value = allowImplicit ? "true" : "false";
  const lines = splitLines(yamlText);
  const existing = locatePolicyBlock(lines, label);
  if (!existing) {
    const block = expectedPolicyBlock(allowImplicit);
    const body = yamlText === "" || yamlText.endsWith("\n") ? yamlText : `${yamlText}\n`;
    return body === "" ? block : `${body}\n${block}`;
  }

  const field = findImplicitInvocationLine(lines, existing);
  if (field) {
    const comment = field.comment ? ` ${field.comment}` : "";
    lines[field.index] = `${field.indent}${implicitInvocationKey}: ${value}${comment}`;
  } else {
    const indent = childIndent(lines, existing);
    lines.splice(existing.start + 1, 0, `${indent}${implicitInvocationKey}: ${value}`);
  }
  return `${lines.join("\n")}\n`;
}
