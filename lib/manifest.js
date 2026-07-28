"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const MANIFEST_NAME = ".chisel-ai-toolkit.json";

function manifestPath(projectRoot) {
  return path.join(projectRoot, ".claude", MANIFEST_NAME);
}

function hash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 16);
}

function read(projectRoot) {
  const file = manifestPath(projectRoot);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function write(projectRoot, data) {
  const file = manifestPath(projectRoot);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

module.exports = { MANIFEST_NAME, manifestPath, hash, read, write };
