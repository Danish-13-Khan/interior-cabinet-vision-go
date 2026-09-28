#!/usr/bin/env node
// Calm Light style lint. Runs in `npm test`.
//   node scripts/ui-lint/check-styles.mjs                   check
//   node scripts/ui-lint/check-styles.mjs --write-baseline  record current counts
// Fails on font sizes below 12px, and on more raw hex colours or !important in a
// file than its baseline. Only lower the baseline; never raise it to pass.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { checkFile } from "./rules.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const baselinePath = join(here, "baseline.json");
const TOKEN_FILE = "src/styles/tokens.css";

function cssFiles() {
  return readdirSync(join(root, "src"), { recursive: true })
    .filter((file) => String(file).endsWith(".css"))
    .map((file) => relative(root, join(root, "src", String(file))).split("\\").join("/"))
    .sort();
}

function readBaseline() {
  try {
    return JSON.parse(readFileSync(baselinePath, "utf8"));
  } catch {
    return {};
  }
}

const writeBaseline = process.argv.includes("--write-baseline");
const baseline = readBaseline();
const next = {};
const errors = [];
const tightenable = [];

for (const path of cssFiles()) {
  const source = readFileSync(join(root, path), "utf8");
  const result = checkFile({ path, source, baseline: baseline[path], allowHex: path === TOKEN_FILE });
  if (result.counts.some((count) => count > 0)) next[path] = result.counts;
  if (writeBaseline) {
    errors.push(...result.errors.filter((error) => error.includes("font-size")));
  } else {
    errors.push(...result.errors);
    if (result.canTighten) tightenable.push(path);
  }
}

if (writeBaseline) {
  const lines = Object.entries(next).map(([path, counts]) => `  ${JSON.stringify(path)}: ${JSON.stringify(counts)}`);
  writeFileSync(baselinePath, `{\n${lines.join(",\n")}\n}\n`);
  console.log(`ui-lint: wrote baseline for ${lines.length} files`);
}

if (errors.length) {
  console.error(`ui-lint: ${errors.length} problem(s)\n${errors.map((error) => `  ${error}`).join("\n")}`);
  process.exit(1);
}

if (tightenable.length) {
  console.log(`ui-lint: ${tightenable.length} file(s) improved — run with --write-baseline to lock it in`);
}
console.log("ui-lint: styles OK");
