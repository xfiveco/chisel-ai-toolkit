#!/usr/bin/env node
"use strict";

const path = require("node:path");

const pkg = require("./package.json");
const { resolveRoots } = require("./lib/roots");
const manifest = require("./lib/manifest");
const { EMITTERS } = require("./lib/emit");

const DEFAULT_AGENTS = ["claude", "agents"];

function parseArgs(argv) {
  const options = { agents: null, root: null, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const [flag, inline] = argv[i].split("=");
    const value = () => inline ?? argv[++i];
    if (flag === "--agent" || flag === "--agents") options.agents = value().split(",");
    else if (flag === "--root") options.root = value();
    else if (flag === "--dry-run") options.dryRun = true;
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const roots = resolveRoots({ override: options.root });
  const agents = options.agents || DEFAULT_AGENTS;

  const unknown = agents.filter((a) => !EMITTERS[a]);
  if (unknown.length) {
    throw new Error(`unknown agent(s): ${unknown.join(", ")} (available: ${Object.keys(EMITTERS).join(", ")})`);
  }

  console.log(`${pkg.name} ${pkg.version}`);
  console.log(`  theme: ${roots.projectRoot} (${roots.source})`);

  if (options.dryRun) {
    console.log(`  dry run — nothing written`);
    return;
  }

  const vars = { THEME_ROOT: roots.themeRelative, PACKAGE_NAME: pkg.name, VERSION: pkg.version };
  const files = {};
  const record = (abs) => {
    files[path.relative(roots.projectRoot, abs).split(path.sep).join("/")] = manifest.hash(abs);
  };

  for (const agent of agents) {
    EMITTERS[agent]({ packageDir: __dirname, projectRoot: roots.projectRoot, vars, record });
  }

  manifest.write(roots.projectRoot, {
    package: pkg.name,
    version: pkg.version,
    installedAt: new Date().toISOString(),
    agents,
    files,
  });

  console.log(`  wrote ${Object.keys(files).length} file(s) for: ${agents.join(", ")}`);
}

try {
  main();
} catch (error) {
  console.warn(`${pkg.name}: install failed — ${error.message}`);
  process.exitCode = process.env.npm_lifecycle_event === "postinstall" ? 0 : 1;
}
