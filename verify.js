#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const pkg = require("./package.json");
const { resolveRoots } = require("./lib/roots");

/**
 * The mechanical half of Chisel's "before completing any task" checklist, plus
 * the grep-able review rules. Everything here is deterministic — if a check
 * needs judgement it does not belong in this file.
 */

const SKIP_DIRS = new Set(["node_modules", "vendor", ".git", "dist", "build"]);

function walk(dir, extension) {
  if (!fs.existsSync(dir)) return [];
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full, extension));
    else if (entry.name.endsWith(extension)) found.push(full);
  }
  return found;
}

/** Comments hold examples and disabled code — neither should fail a check. */
function stripComments(scss) {
  return scss.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1");
}

function slugs(list) {
  return new Set((list || []).map((entry) => entry.slug).filter(Boolean));
}

/** theme.json custom keys are written kebab in Chisel but WP accepts camel. */
function customKeys(theme, group) {
  const camel = group.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const custom = theme.settings?.custom || {};
  return new Set(Object.keys(custom[group] || custom[camel] || {}));
}

const TOKEN_SOURCES = {
  "get-color": (t) => slugs(t.settings?.color?.palette),
  "get-gradient": (t) => slugs(t.settings?.color?.gradients),
  "get-font-size": (t) => slugs(t.settings?.typography?.fontSizes),
  "get-margin": (t) => customKeys(t, "margin"),
  "get-padding": (t) => customKeys(t, "padding"),
  "get-spacer": (t) => customKeys(t, "spacer"),
  "get-gap": (t) => customKeys(t, "gap"),
  "get-border-radius": (t) => customKeys(t, "border-radius"),
  "get-box-shadow": (t) => customKeys(t, "box-shadow"),
  "get-transition": (t) => customKeys(t, "transition"),
  "get-letter-spacing": (t) => customKeys(t, "letter-spacing"),
  "get-line-height": (t) => customKeys(t, "line-height"),
  "get-layout": (t) => customKeys(t, "layout"),
  "get-layout-size": () => new Set(["content", "wide"]),
};

/** WP's own state flags — they look like preset classes but carry no slug. */
const PRESET_CLASS_EXCEPTIONS = new Set([
  "has-text-color",
  "has-link-color",
  "has-background",
  "has-custom-font-size",
]);

const PRESET_CLASS_PATTERNS = [
  [/\bhas-([a-z0-9-]+?)-(?:background-|border-|link-)?color\b/g, "color"],
  [/\bhas-([a-z0-9-]+?)-gradient-background\b/g, "gradient"],
  [/\bhas-([a-z0-9-]+?)-font-size\b/g, "fontSize"],
];

/** Colors that belong in a preset but got written into the markup by hand. */
const MARKUP_COLOR_PATTERNS = [
  [/"customOverlayColor"/g, "use an overlayColor preset slug"],
  [/\b(?:background-)?color:\s*#[0-9a-fA-F]{3,8}/g, "use a preset class, not a literal hex"],
];

/** SCSS written per-section, where a raw value is nearly always a missed token. */
const RAW_VALUE_DIRS = ["src/styles/patterns", "src/blocks", "src/blocks-acf"];

class Report {
  constructor() {
    this.entries = [];
  }
  error(check, message) {
    this.entries.push({ level: "error", check, message });
  }
  warn(check, message) {
    this.entries.push({ level: "warn", check, message });
  }
  get errors() {
    return this.entries.filter((e) => e.level === "error");
  }
  get warnings() {
    return this.entries.filter((e) => e.level === "warn");
  }
}

/** Every get-*('slug') argument resolves to something in theme.json. */
function checkTokens(report, { scss, theme, rel }) {
  for (const { file, text } of scss) {
    for (const [, helper, slug] of text.matchAll(/\b(get-[a-z-]+)\(\s*['"]([^'"]+)['"]/g)) {
      const source = TOKEN_SOURCES[helper];
      if (!source) continue; // unknown helper — checkHelpers owns that
      const allowed = source(theme);
      if (allowed.size && !allowed.has(slug)) {
        report.error("tokens", `${rel(file)}: ${helper}('${slug}') — no such slug in theme.json`);
      }
    }
  }
}

/** Calling a helper that src/design/tools never defines fails the SCSS build. */
function checkHelpers(report, { scss, themeRoot, rel }) {
  const toolsDir = path.join(themeRoot, "src", "design", "tools");
  if (!fs.existsSync(toolsDir)) return;

  const defined = new Set();
  for (const file of walk(toolsDir, ".scss")) {
    const text = stripComments(fs.readFileSync(file, "utf8"));
    for (const [, name] of text.matchAll(/@function\s+([\w-]+)\s*\(/g)) defined.add(name);
  }
  if (!defined.size) return;

  for (const { file, text } of scss) {
    if (file.startsWith(toolsDir)) continue;
    for (const [, name] of text.matchAll(/\b(get-[a-z-]+)\s*\(/g)) {
      if (!defined.has(name)) {
        report.error("helpers", `${rel(file)}: ${name}() is not defined in src/design/tools/`);
      }
    }
  }
}

/**
 * Preset classes must match a theme.json preset. The same class is just as
 * wrong in a Twig template as in a pattern, so both get read.
 */
function checkPresetClasses(report, { patterns, twig, theme, rel }) {
  const sources = {
    color: slugs(theme.settings?.color?.palette),
    gradient: slugs(theme.settings?.color?.gradients),
    fontSize: slugs(theme.settings?.typography?.fontSizes),
  };

  for (const { file, text } of [...patterns, ...twig]) {
    const seen = new Set();
    for (const [pattern, kind] of PRESET_CLASS_PATTERNS) {
      for (const match of text.matchAll(pattern)) {
        if (PRESET_CLASS_EXCEPTIONS.has(match[0]) || seen.has(match[0])) continue;
        const allowed = sources[kind];
        if (allowed.size && !allowed.has(match[1])) {
          seen.add(match[0]);
          report.error("presets", `${rel(file)}: class ${match[0]} — no such ${kind} preset in theme.json`);
        }
      }
    }
  }
}

/** Hand-written colors in block markup — presets exist for exactly this. */
function checkMarkupColors(report, { patterns, rel }) {
  for (const { file, text } of patterns) {
    const seen = new Set();
    for (const [pattern, advice] of MARKUP_COLOR_PATTERNS) {
      for (const [value] of text.matchAll(pattern)) {
        if (seen.has(value)) continue;
        seen.add(value);
        report.error("markup", `${rel(file)}: ${value} — ${advice}`);
      }
    }
  }
}

/**
 * `disableBottomMargin` and `u-no-margin-bottom` are one rule in two places:
 * the attribute drops the block's own margin, the class covers the theme's.
 * Either alone leaves a gap nobody sees until the section is stacked.
 */
function checkMarginPairs(report, { patterns, rel }) {
  for (const { file, text } of patterns) {
    for (const [block] of text.matchAll(/<!--\s+wp:[\s\S]*?-->/g)) {
      const attribute = /"disableBottomMargin"\s*:\s*true/.test(block);
      const className = /\bu-no-margin-bottom\b/.test(block);
      if (attribute === className) continue;

      const name = /wp:([\w/-]+)/.exec(block);
      const missing = attribute ? "u-no-margin-bottom in className" : '"disableBottomMargin":true';
      report.error("markup", `${rel(file)}: wp:${name ? name[1] : "?"} is missing ${missing} — the pair goes together`);
    }
  }
}

/** ACF group filename is the key, and the key has a fixed shape. */
function checkAcfGroups(report, { acfGroups, rel }) {
  for (const file of acfGroups) {
    const name = path.basename(file, ".json");

    let group;
    try {
      group = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
      report.error("acf", `${rel(file)}: not valid JSON — ${error.message}`);
      continue;
    }

    const key = group && group.key;
    if (!key) {
      report.error("acf", `${rel(file)}: no "key" field`);
    } else if (key !== name) {
      report.error("acf", `${rel(file)}: key "${key}" does not match filename "${name}"`);
    } else if (!/^group_[0-9a-f]{13}$/.test(key)) {
      report.error("acf", `${rel(file)}: key "${key}" is not group_ + 13 hex characters`);
    }
  }
}

/**
 * The starter ships no patterns layer, so the first pattern of a project has to
 * add the import by hand — to both entry points. Miss one and the partial
 * compiles into nothing, with no error anywhere.
 */
function checkPatternsLayer(report, { themeRoot, rel }) {
  const layer = path.join(themeRoot, "src", "styles", "patterns");
  if (!walk(layer, ".scss").length) return;

  for (const entry of ["main.scss", "editor.scss"]) {
    const file = path.join(themeRoot, "src", "styles", entry);
    if (!fs.existsSync(file)) continue;
    if (!/@use\s+['"]patterns['"]/.test(fs.readFileSync(file, "utf8"))) {
      report.error("scss", `${rel(file)}: src/styles/patterns/ exists but @use 'patterns'; is missing — the layer compiles into nothing`);
    }
  }
}

/** Raw colors in section SCSS. A warning: genuine one-offs do exist. */
function checkRawValues(report, { scss, themeRoot, rel }) {
  const dirs = RAW_VALUE_DIRS.map((dir) => path.join(themeRoot, ...dir.split("/")) + path.sep);

  for (const { file, text } of scss) {
    if (!dirs.some((dir) => file.startsWith(dir))) continue;
    const seen = new Set();
    for (const [value] of text.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d+\s*,/g)) {
      if (seen.has(value)) continue;
      seen.add(value);
      report.warn("raw", `${rel(file)}: literal ${value} — tokenize it in theme.json unless it's a genuine one-off`);
    }
  }
}

/** Slug header, filename, root class and SCSS scope all carry the same slug. */
function checkPatternSync(report, { patterns, themeRoot, rel }) {
  for (const { file, text } of patterns) {
    const slug = path.basename(file, ".php");
    const header = /^\s*\*?\s*Slug:\s*([\w-]+)\/([\w-]+)\s*$/m.exec(text);

    if (!header) {
      report.error("patterns", `${rel(file)}: no "Slug:" header`);
    } else if (header[2] !== slug) {
      report.error("patterns", `${rel(file)}: header slug "${header[2]}" does not match filename "${slug}"`);
    }

    if (!new RegExp(`\\bp-${slug}\\b`).test(text)) {
      report.error("patterns", `${rel(file)}: root class p-${slug} missing`);
    }

    const stylesheet = path.join(themeRoot, "src", "styles", "patterns", `_${slug}.scss`);
    if (!fs.existsSync(stylesheet)) {
      report.warn("patterns", `${rel(file)}: no src/styles/patterns/_${slug}.scss (fine if the pattern needs no styling)`);
    } else if (!new RegExp(`\\.p-${slug}\\b`).test(fs.readFileSync(stylesheet, "utf8"))) {
      report.error("patterns", `${rel(stylesheet)}: not scoped under .p-${slug}`);
    }
  }
}

/** The grep-able half of a Chisel code review. */
function checkScssConventions(report, { scss, themeRoot, rel }) {
  const designDir = path.join(themeRoot, "src", "design");

  for (const { file, text } of scss) {
    if (file.startsWith(designDir)) continue; // the accessors themselves

    // Only files that actually call a helper need the import — without it the
    // build fails. Token-free files (resets, plain element styles) don't.
    if (/\b(?:get-[a-z-]+|px-rem)\s*\(/.test(text) && !/@use\s+['"]~design['"]/.test(text)) {
      report.error("scss", `${rel(file)}: calls design helpers without @use '~design' as *;`);
    }
    if (/var\(\s*--wp--/.test(text)) {
      report.error("scss", `${rel(file)}: raw var(--wp--…) — use a get-* helper`);
    }
    // House style, not an API constraint: px-rem() strips units itself, so the
    // px form compiles. Warn, so nobody "fixes" working code as if it were broken.
    for (const [call] of text.matchAll(/px-rem\(\s*-?[\d.]+px\s*\)/g)) {
      report.warn("scss", `${rel(file)}: ${call} — write it unitless, px-rem(24); the px form compiles but isn't house style`);
    }
  }
}

/** core/ is upstream Chisel — local edits are overwritten on the next update. */
function checkCoreUntouched(report, { themeRoot }) {
  const git = (args) =>
    execFileSync("git", args, { cwd: themeRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

  let output;
  let prefix;
  try {
    // The pathspec is relative to cwd, so git does the matching — but
    // --porcelain reports from the repo root, which may sit above the theme.
    output = git(["status", "--porcelain", "--", "core"]);
    prefix = git(["rev-parse", "--show-prefix"]).trim();
  } catch {
    return; // not a git repo, or git unavailable
  }

  for (const line of output.split("\n")) {
    const file = line.slice(3).trim();
    if (file) {
      const shown = prefix && file.startsWith(prefix) ? file.slice(prefix.length) : file;
      report.error("core", `${shown} is modified — core/ is upstream Chisel, put changes in custom/`);
    }
  }
}

function parseArgs(argv) {
  const options = { root: null, theme: null };
  for (let i = 0; i < argv.length; i += 1) {
    const [flag, inline] = argv[i].split("=");
    const value = () => inline ?? argv[++i];
    if (flag === "--root") options.root = value();
    else if (flag === "--theme") options.theme = value();
  }
  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const themeRoot = options.theme
    ? path.resolve(options.theme)
    : resolveRoots({ startDir: process.cwd(), override: options.root }).themeRoot;

  const themeJsonPath = path.join(themeRoot, "theme.json");
  if (!fs.existsSync(themeJsonPath)) {
    console.error(`${pkg.name}: no theme.json at ${themeRoot} — run from inside a Chisel theme, or pass --theme <path>`);
    process.exit(2);
  }

  let theme;
  try {
    theme = JSON.parse(fs.readFileSync(themeJsonPath, "utf8"));
  } catch (error) {
    console.error(`${pkg.name}: theme.json is not valid JSON — ${error.message}`);
    process.exit(2);
  }

  const rel = (file) => path.relative(themeRoot, file).split(path.sep).join("/");
  const read = (file) => {
    const raw = fs.readFileSync(file, "utf8");
    return { file, raw, text: stripComments(raw) };
  };

  // Markup keeps its comments: a pattern's Slug header is a PHP docblock, and
  // a block's attributes live inside an HTML comment.
  const readMarkup = (file) => {
    const raw = fs.readFileSync(file, "utf8");
    return { file, raw, text: raw };
  };

  const context = {
    theme,
    themeRoot,
    rel,
    scss: walk(path.join(themeRoot, "src"), ".scss").map(read),
    patterns: walk(path.join(themeRoot, "patterns"), ".php").map(readMarkup),
    twig: [
      ...walk(path.join(themeRoot, "views"), ".twig"),
      ...walk(path.join(themeRoot, "src", "blocks"), ".twig"),
      ...walk(path.join(themeRoot, "src", "blocks-acf"), ".twig"),
    ].map(readMarkup),
    acfGroups: [
      ...walk(path.join(themeRoot, "acf-json"), ".json"),
      ...walk(path.join(themeRoot, "src", "blocks-acf"), ".json"),
    ].filter((file) => path.basename(file).startsWith("group_")),
  };

  const report = new Report();
  checkTokens(report, context);
  checkHelpers(report, context);
  checkPresetClasses(report, context);
  checkMarkupColors(report, context);
  checkMarginPairs(report, context);
  checkPatternSync(report, context);
  checkPatternsLayer(report, context);
  checkAcfGroups(report, context);
  checkScssConventions(report, context);
  checkRawValues(report, context);
  checkCoreUntouched(report, context);

  console.log(
    `${pkg.name} verify — ${rel(themeRoot) || "."} (${context.scss.length} scss, ` +
      `${context.patterns.length} patterns, ${context.twig.length} twig, ${context.acfGroups.length} acf groups)`,
  );

  for (const entry of [...report.errors, ...report.warnings]) {
    const tag = entry.level === "error" ? "ERROR" : " WARN";
    console.log(`  ${tag}  ${entry.check.padEnd(8)} ${entry.message}`);
  }

  if (!report.entries.length) {
    console.log("  all checks passed");
  }

  console.log(`\n  ${report.errors.length} error(s), ${report.warnings.length} warning(s)`);
  console.log("  not checked here: run `npm run build-scripts` to confirm SCSS compiles.");
  console.log("  nor: seeded page content, or anything needing judgement — reuse, mapping, design fidelity.");

  process.exitCode = report.errors.length ? 1 : 0;
}

try {
  main();
} catch (error) {
  console.error(`${pkg.name}: ${error.message}`);
  process.exitCode = 2;
}
