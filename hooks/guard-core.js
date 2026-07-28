"use strict";

const path = require("node:path");

/**
 * PreToolUse guard: refuses any write inside the theme's `core/` directory.
 *
 * core/ is upstream Chisel — an edit there is silently overwritten by the next
 * Chisel update. CLAUDE.md says so, but that's advice the model can skip past.
 * This isn't: exit 2 blocks the tool call outright.
 *
 * Anything unexpected (bad payload, no file path) exits 0 — a guard that
 * misfires on its own bugs is worse than no guard.
 */

const CASE_INSENSITIVE = process.platform === "win32";

function normalize(p) {
  return CASE_INSENSITIVE ? p.toLowerCase() : p;
}

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});

process.stdin.on("end", () => {
  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    process.exit(0);
  }

  const file = payload.tool_input && payload.tool_input.file_path;
  if (typeof file !== "string" || !file) process.exit(0);

  const projectDir = process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd();
  const core = path.resolve(projectDir, "core") + path.sep;
  const target = path.resolve(projectDir, file);

  if (!normalize(target).startsWith(normalize(core))) process.exit(0);

  const rel = path.relative(projectDir, target).split(path.sep).join("/");
  console.error(
    `Blocked: ${rel} is inside core/, which is upstream Chisel — any edit there is lost on the next ` +
      `Chisel update. Put the change in custom/ instead, or override the behaviour from the theme's ` +
      `own files. If this genuinely belongs upstream, it's a change to Chisel itself, not to this theme.`,
  );
  process.exit(2);
});
