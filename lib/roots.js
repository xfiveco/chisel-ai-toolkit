"use strict";

const fs = require("node:fs");
const path = require("node:path");

const THEME_MARKERS = ["style.css", "functions.php", "theme.json"];

function up(dir) {
  const parent = path.dirname(dir);
  return parent === dir ? null : parent;
}

function walkUp(from, predicate) {
  let dir = path.resolve(from);
  while (dir) {
    if (predicate(dir)) return dir;
    dir = up(dir);
  }
  return null;
}

/**
 * The directory the package was installed into — i.e. the one whose
 * package.json pulled us in. Falls back to cwd when run via npx.
 */
function findInstallDir(startDir) {
  const inNodeModules = walkUp(startDir, (d) => path.basename(d) === "node_modules");
  return inNodeModules ? path.dirname(inNodeModules) : process.cwd();
}

/** Nearest ancestor (inclusive) that looks like a Chisel theme. */
function findThemeRoot(startDir) {
  return walkUp(startDir, (d) => THEME_MARKERS.every((f) => fs.existsSync(path.join(d, f))));
}

/**
 * Everything installs into the theme directory. That's where npm already runs
 * (so `npx chisel-verify` resolves the local bin), and it's the directory the
 * agent must be launched from for .claude/ and CLAUDE.md to be discovered.
 *
 * No theme, no install — falling back to some ancestor guesses wrong silently.
 */
function resolveRoots({ startDir = __dirname, override } = {}) {
  const explicit = override || process.env.CHISEL_AI_TOOLKIT_ROOT;
  const themeRoot = explicit ? path.resolve(explicit) : findThemeRoot(findInstallDir(startDir));

  if (!themeRoot) {
    throw new Error(
      `no Chisel theme found (looked for ${THEME_MARKERS.join(", ")} walking up from the install directory) — pass --root <path to theme>`,
    );
  }

  return {
    projectRoot: themeRoot,
    themeRoot,
    themeRelative: ".",
    source: explicit ? "override" : "detected",
  };
}

module.exports = { resolveRoots, findThemeRoot, findInstallDir };
