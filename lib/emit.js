"use strict";

const fs = require("node:fs");
const path = require("node:path");

const settings = require("./settings");

const PACKAGE_NAME = require("../package.json").name;
const BEGIN = `<!-- BEGIN ${PACKAGE_NAME} -->`;
const END = `<!-- END ${PACKAGE_NAME} -->`;

/**
 * Skills and reference docs are authored once with {{THEME_ROOT}} standing in
 * for the theme directory, then rendered per-project. In a theme-root repo it
 * collapses to "."; in a full WordPress project it becomes something like
 * "wp/wp-content/themes/my-theme".
 */
function render(text, vars) {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => (key in vars ? vars[key] : match));
}

const TEXT_EXTENSIONS = new Set([".md", ".mdc", ".json", ".txt", ".yml", ".yaml"]);

function copyTree(source, target, vars, record) {
  fs.mkdirSync(target, { recursive: true });
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyTree(from, to, vars, record);
    } else if (TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      fs.writeFileSync(to, render(fs.readFileSync(from, "utf8"), vars));
      record(to);
    } else {
      fs.copyFileSync(from, to);
      record(to);
    }
  }
}

function spliceManagedBlock(existing, body) {
  const block = `${BEGIN}\n${body.trim()}\n${END}`;
  const start = existing.indexOf(BEGIN);
  const end = existing.indexOf(END);
  if (start !== -1 && end !== -1 && end > start) {
    return existing.slice(0, start) + block + existing.slice(end + END.length);
  }
  return existing.trimEnd() ? `${existing.trimEnd()}\n\n${block}\n` : `${block}\n`;
}

function writeManaged(target, body, record) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const existing = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
  fs.writeFileSync(target, spliceManagedBlock(existing, body));
  record(target);
}

/** Claude Code: skills as slash commands, rules spliced into CLAUDE.md. */
function emitClaude({ packageDir, projectRoot, vars, record }) {
  const skills = path.join(packageDir, "skills");
  if (fs.existsSync(skills)) {
    const targetRoot = path.join(projectRoot, ".claude", "skills");
    for (const skill of fs.readdirSync(skills, { withFileTypes: true })) {
      if (!skill.isDirectory()) continue;
      const target = path.join(targetRoot, skill.name);
      fs.rmSync(target, { recursive: true, force: true });
      copyTree(path.join(skills, skill.name), target, vars, record);
    }
  }

  for (const dir of ["reference", "templates"]) {
    const source = path.join(packageDir, "rules", dir);
    if (!fs.existsSync(source)) continue;
    const target = path.join(projectRoot, ".claude", "chisel", dir);
    fs.rmSync(target, { recursive: true, force: true });
    copyTree(source, target, vars, record);
  }

  // The "how to use it" half of the root README, for whoever opens the theme repo.
  const usage = path.join(packageDir, "rules", "README.md");
  if (fs.existsSync(usage)) {
    const target = path.join(projectRoot, ".claude", "chisel", "README.md");
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, render(fs.readFileSync(usage, "utf8"), vars));
    record(target);
  }

  const hooks = path.join(packageDir, "hooks");
  if (fs.existsSync(hooks)) {
    const target = path.join(projectRoot, ".claude", "chisel", "hooks");
    fs.rmSync(target, { recursive: true, force: true });
    copyTree(hooks, target, vars, record);
    // Shared file: recorded so uninstall knows to strip our entry, never to
    // delete the file.
    if (settings.installGuard(projectRoot)) {
      record(settings.settingsPath(projectRoot));
    } else {
      console.warn(
        `${PACKAGE_NAME}: ${settings.SETTINGS_REL} is not valid JSON — the core/ guard hook was NOT installed`,
      );
    }
  }

  const rules = path.join(packageDir, "rules", "CLAUDE.md");
  if (fs.existsSync(rules)) {
    writeManaged(
      path.join(projectRoot, "CLAUDE.md"),
      render(fs.readFileSync(rules, "utf8"), vars),
      record,
    );
  }
}

/** Codex, Aider and anything else that reads AGENTS.md — a pointer, not a copy. */
function emitAgents({ packageDir, projectRoot, vars, record }) {
  const source = path.join(packageDir, "rules", "AGENTS.md");
  if (!fs.existsSync(source)) return;
  writeManaged(
    path.join(projectRoot, "AGENTS.md"),
    render(fs.readFileSync(source, "utf8"), vars),
    record,
  );
}

const EMITTERS = { claude: emitClaude, agents: emitAgents };

module.exports = { EMITTERS, BEGIN, END, render, spliceManagedBlock };
