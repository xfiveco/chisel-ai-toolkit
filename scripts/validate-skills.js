#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const SKILLS_DIR = path.join(ROOT, "skills");
const RULES_DIR = path.join(ROOT, "rules");
const errors = [];

function frontmatter(text) {
  const match = /^---\n([\s\S]*?)\n---/.exec(text);
  if (!match) return null;
  const fields = {};
  for (const line of match[1].split("\n")) {
    const kv = /^([\w-]+):\s*(.*)$/.exec(line);
    if (kv) fields[kv[1]] = kv[2].trim();
  }
  return fields;
}

for (const entry of fs.readdirSync(SKILLS_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = path.join(SKILLS_DIR, entry.name, "SKILL.md");

  if (!fs.existsSync(file)) {
    errors.push(`${entry.name}: missing SKILL.md`);
    continue;
  }

  const text = fs.readFileSync(file, "utf8");
  const fields = frontmatter(text);

  if (!fields) errors.push(`${entry.name}: missing YAML frontmatter`);
  else if (fields.name !== entry.name) errors.push(`${entry.name}: frontmatter name is "${fields.name}"`);
  else if (!fields.description) errors.push(`${entry.name}: missing description`);

  for (const token of text.match(/\{\{(\w+)\}\}/g) || []) {
    if (!["{{THEME_ROOT}}", "{{PACKAGE_NAME}}", "{{VERSION}}"].includes(token)) {
      errors.push(`${entry.name}: unknown template token ${token}`);
    }
  }
}

/**
 * Cross-link check. Skills and reference docs link to each other using the
 * paths they will have *after* install — `.claude/chisel/reference/x.md` rather
 * than `rules/reference/x.md`. Map those back to the package layout and confirm
 * the target ships. A dangling link is invisible until an agent follows it.
 */
const INSTALLED_PREFIXES = [
  [/^\.claude\/chisel\/(reference|templates)\/(.+)$/, (m) => path.join(RULES_DIR, m[1], m[2])],
  [/^\.claude\/skills\/([\w-]+)\/SKILL\.md$/, (m) => path.join(SKILLS_DIR, m[1], "SKILL.md")],
  [/^(CLAUDE|AGENTS)\.md$/, (m) => path.join(RULES_DIR, `${m[1]}.md`)],
];

/**
 * Fenced blocks hold worked examples — the PLAN/phase templates in
 * chisel-new link to files that only exist once an agent generates them.
 * Those are illustrations, not references, so they don't get checked.
 */
function stripFences(text) {
  let fence = null;
  return text
    .split("\n")
    .map((line) => {
      const marker = /^\s*(`{3,})/.exec(line);
      if (marker && (fence === null || marker[1].length >= fence.length)) {
        fence = fence === null ? marker[1] : null;
        return "";
      }
      return fence === null ? line : "";
    })
    .join("\n");
}

function markdownFiles(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...markdownFiles(full));
    else if (entry.name.endsWith(".md")) found.push(full);
  }
  return found;
}

function resolveLink(target, fromFile) {
  for (const [pattern, toPackagePath] of INSTALLED_PREFIXES) {
    const match = pattern.exec(target);
    if (match) return toPackagePath(match);
  }
  if (target.startsWith(".claude/")) return null; // installed path we don't ship
  return path.resolve(path.dirname(fromFile), target);
}

for (const dir of [SKILLS_DIR, RULES_DIR]) {
  for (const file of markdownFiles(dir)) {
    const text = stripFences(fs.readFileSync(file, "utf8"));
    const label = path.relative(ROOT, file).split(path.sep).join("/");

    for (const [, target] of text.matchAll(/\]\(([^)\s#]+\.md)(?:#[^)]*)?\)/g)) {
      if (/^(https?:|mailto:|\{\{)/.test(target)) continue;
      const resolved = resolveLink(target, file);
      if (resolved === null) {
        errors.push(`${label}: link to ${target} — not a file this package ships`);
      } else if (!fs.existsSync(resolved)) {
        errors.push(`${label}: broken link to ${target}`);
      }
    }
  }
}

if (errors.length) {
  console.error("validation failed:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
console.log("all skills valid, all cross-links resolve");
