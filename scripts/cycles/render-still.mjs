#!/usr/bin/env node
/**
 * Render a Cycles still bundle with a local Blender (transport b: per-seat runner).
 *
 *   node scripts/cycles/render-still.mjs .cycles/2bhk            # renders bundle.json → still.png + provenance.json
 *   node scripts/cycles/render-still.mjs .cycles/2bhk --rerun    # also renders twice and records the MAD gate
 *   node scripts/cycles/render-still.mjs --check                 # only reports which Blender would be used
 *
 * Options: --device auto|cpu|gpu  --samples N  --time-cap S  --blender <path>
 * Blender is found from --blender, $BLENDER, then the usual install paths.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const script = join(root, "render-sources", "blender", "render_still.py");
const GRACE_SECONDS = 150;

const CANDIDATES = [
  process.env.BLENDER,
  "/Applications/Blender.app/Contents/MacOS/Blender",
  "/opt/homebrew/bin/blender",
  "/usr/local/bin/blender",
  "/usr/bin/blender",
  "C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe",
  "C:\\Program Files\\Blender Foundation\\Blender 4.1\\blender.exe",
  "blender",
];

function readArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) { args._.push(item); continue; }
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) { args[item.slice(2)] = next; index += 1; } else args[item.slice(2)] = true;
  }
  return args;
}

function findBlender(explicit) {
  for (const candidate of [explicit, ...CANDIDATES].filter(Boolean)) {
    const probe = spawnSync(candidate, ["--version"], { encoding: "utf8" });
    if (probe.status === 0 && /Blender \d/.test(probe.stdout)) {
      return { path: candidate, version: probe.stdout.split("\n")[0].trim() };
    }
  }
  return null;
}

const args = readArgs(process.argv.slice(2));
const blender = findBlender(args.blender);
if (args.check) {
  if (!blender) {
    console.error("No Blender found. Install Blender 4.x or set BLENDER=/path/to/blender.");
    process.exit(2);
  }
  console.log(`${blender.version} at ${blender.path}`);
  process.exit(0);
}
if (!blender) {
  console.error("No Blender found. Install Blender 4.x (https://www.blender.org/download/) or set BLENDER=/path/to/blender.");
  process.exit(2);
}
const dir = resolve(args._[0] ?? ".cycles/job");
const bundlePath = join(dir, "bundle.json");
if (!existsSync(bundlePath)) {
  console.error(`No bundle at ${bundlePath}. Export one with: npx vite-node scripts/cycles/export-bundle.ts -- --template 2bhk --out ${dir}`);
  process.exit(2);
}
const bundle = JSON.parse(await import("node:fs/promises").then((fs) => fs.readFile(bundlePath, "utf8")));
const timeCap = Number(args["time-cap"] ?? bundle.render.timeCapSeconds);
const outPath = join(dir, "still.png");
const provenancePath = join(dir, "provenance.json");

const blenderArgs = [
  "-b", "--python", script, "--",
  "--bundle", bundlePath, "--out", outPath, "--provenance", provenancePath, "--root", root,
  "--device", String(args.device ?? "auto"),
  "--time-cap", String(timeCap),
];
if (args.samples) blenderArgs.push("--samples", String(args.samples));
if (args.rerun) blenderArgs.push("--rerun");

console.log(`${blender.version} · job ${bundle.job.jobId} · ${bundle.render.widthPx}×${bundle.render.heightPx} · cap ${timeCap}s`);
const started = Date.now();
const child = spawn(blender.path, blenderArgs, { stdio: ["ignore", "pipe", "pipe"] });
const hardLimit = (timeCap * (args.rerun ? 2 : 1) + GRACE_SECONDS) * 1000;
const killer = setTimeout(() => {
  console.error(`[cycles] exceeded ${hardLimit / 1000}s; killing Blender`);
  child.kill("SIGKILL");
}, hardLimit);
const relay = (chunk) => {
  for (const line of chunk.toString().split("\n")) {
    if (/\[cycles\]|Fra:|Error|Traceback|Exception|Sample/.test(line)) process.stdout.write(`${line.trim()}\n`);
  }
};
child.stdout.on("data", relay);
child.stderr.on("data", relay);
child.on("exit", (code, signal) => {
  clearTimeout(killer);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  if (code === 0 && existsSync(provenancePath)) {
    console.log(`[cycles] done in ${seconds}s → ${outPath}`);
    console.log(`[cycles] provenance → ${provenancePath}`);
    process.exit(0);
  }
  console.error(`[cycles] Blender exited with ${signal ?? code} after ${seconds}s`);
  process.exit(1);
});
