#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const pkg = require("./package.json");
const { resolveRoots } = require("./lib/roots");
const manifest = require("./lib/manifest");
const { BEGIN, END } = require("./lib/emit");
const settings = require("./lib/settings");

const MANAGED_MEMORY_FILES = new Set(["CLAUDE.md", "AGENTS.md"]);

function stripManagedBlock(content) {
  const start = content.indexOf(BEGIN);
  const end = content.indexOf(END);
  if (start === -1 || end === -1 || end < start) return content;
  return (content.slice(0, start) + content.slice(end + END.length)).replace(/\n{3,}/g, "\n\n").trimStart();
}

function pruneEmptyDirs(dir, stopAt) {
  let current = path.resolve(dir);
  const stop = path.resolve(stopAt);
  while (current.startsWith(stop) && current !== stop) {
    if (!fs.existsSync(current) || fs.readdirSync(current).length) return;
    fs.rmdirSync(current);
    current = path.dirname(current);
  }
}

function main() {
  const rootArg = process.argv.indexOf("--root");
  const roots = resolveRoots({ override: rootArg !== -1 ? process.argv[rootArg + 1] : null });
  const previous = manifest.read(roots.projectRoot);

  if (!previous) {
    console.log(`${pkg.name}: no manifest at ${roots.projectRoot} — nothing to uninstall`);
    return;
  }

  for (const rel of Object.keys(previous.files || {})) {
    const abs = path.join(roots.projectRoot, rel);
    if (!fs.existsSync(abs)) continue;

    if (MANAGED_MEMORY_FILES.has(rel)) {
      const remaining = stripManagedBlock(fs.readFileSync(abs, "utf8"));
      if (remaining.trim()) fs.writeFileSync(abs, remaining);
      else fs.rmSync(abs);
      continue;
    }

    // Shared with the user — take out our hook, leave the rest of the file.
    if (rel === settings.SETTINGS_REL) {
      const outcome = settings.removeGuard(roots.projectRoot);
      if (outcome === "unreadable") {
        console.warn(`${pkg.name}: ${rel} is not valid JSON — left untouched, remove the guard hook by hand`);
      }
      continue;
    }

    fs.rmSync(abs);
    pruneEmptyDirs(path.dirname(abs), roots.projectRoot);
  }

  fs.rmSync(manifest.manifestPath(roots.projectRoot), { force: true });
  pruneEmptyDirs(path.join(roots.projectRoot, ".claude"), roots.projectRoot);
  console.log(`${pkg.name}: removed ${Object.keys(previous.files || {}).length} file(s)`);
}

try {
  main();
} catch (error) {
  console.error(`${pkg.name}: ${error.message}`);
  process.exitCode = 1;
}
