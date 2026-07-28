"use strict";

const fs = require("node:fs");
const path = require("node:path");

/**
 * .claude/settings.json is shared: the user owns it, the toolkit owns one hook
 * inside it. There are no comment markers to splice against, so instead of
 * rewriting the file we read it, replace our own entry, and write it back —
 * every install, without comparing against last time.
 *
 * Ours is identified by the script it runs. No marker field, nothing extra in
 * the file that Claude Code would have to tolerate.
 */

const SCRIPT_REL = ".claude/chisel/hooks/guard-core.js";
const SIGNATURE = "chisel/hooks/guard-core.js";
const SETTINGS_REL = ".claude/settings.json";

function settingsPath(projectRoot) {
  return path.join(projectRoot, SETTINGS_REL);
}

function guardGroup() {
  return {
    matcher: "Edit|Write|MultiEdit|NotebookEdit",
    hooks: [
      {
        type: "command",
        command: "node",
        args: [`\${CLAUDE_PROJECT_DIR}/${SCRIPT_REL}`],
        timeout: 10,
        statusMessage: "Checking core/ guard...",
      },
    ],
  };
}

function isOurs(hook) {
  const parts = [hook.command, ...(Array.isArray(hook.args) ? hook.args : [])];
  return parts.some((part) => typeof part === "string" && part.includes(SIGNATURE));
}

/** Read, or null if the file exists but isn't valid JSON — then we don't touch it. */
function read(file) {
  if (!fs.existsSync(file)) return {};
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return null;
  }
}

/**
 * Drop our hook wherever it appears, at the hook level rather than the group
 * level — someone may have added their own command alongside ours. Groups and
 * keys left empty are pruned so an uninstall doesn't leave scaffolding behind.
 */
function stripGuard(settings) {
  const groups = settings.hooks && settings.hooks.PreToolUse;
  if (!Array.isArray(groups)) return false;

  const kept = groups
    .map((group) => ({ ...group, hooks: (group.hooks || []).filter((hook) => !isOurs(hook)) }))
    .filter((group) => group.hooks.length);

  const changed = kept.length !== groups.length || JSON.stringify(kept) !== JSON.stringify(groups);
  if (!changed) return false;

  if (kept.length) {
    settings.hooks.PreToolUse = kept;
  } else {
    delete settings.hooks.PreToolUse;
    if (!Object.keys(settings.hooks).length) delete settings.hooks;
  }
  return true;
}

function write(file, settings) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(settings, null, 2)}\n`);
}

/** Returns the relative path written, or null if nothing was touched. */
function installGuard(projectRoot) {
  const file = settingsPath(projectRoot);
  const settings = read(file);
  if (settings === null) return null;

  stripGuard(settings);
  settings.hooks = settings.hooks || {};
  settings.hooks.PreToolUse = settings.hooks.PreToolUse || [];
  settings.hooks.PreToolUse.push(guardGroup());

  write(file, settings);
  return SETTINGS_REL;
}

/** Returns "removed", "empty" (file deleted), "absent", or "unreadable". */
function removeGuard(projectRoot) {
  const file = settingsPath(projectRoot);
  if (!fs.existsSync(file)) return "absent";

  const settings = read(file);
  if (settings === null) return "unreadable";
  if (!stripGuard(settings)) return "absent";

  if (!Object.keys(settings).length) {
    fs.rmSync(file);
    return "empty";
  }
  write(file, settings);
  return "removed";
}

module.exports = { SETTINGS_REL, settingsPath, installGuard, removeGuard };
