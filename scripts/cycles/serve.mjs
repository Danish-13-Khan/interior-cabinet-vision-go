#!/usr/bin/env node
/**
 * Cycles render service: the same runner behind a small HTTP API, so the app can
 * post a bundle and poll for the still. Runs anywhere Blender runs: a laptop
 * with Blender installed, the Docker image in docker/cycles, or an EC2 box.
 *
 *   node scripts/cycles/serve.mjs                      # http://localhost:8787
 *   CYCLES_FAKE_RENDER=1 node scripts/cycles/serve.mjs # no Blender: placeholder still, real provenance shape
 *
 * Env: PORT (8787) · CYCLES_JOBS_DIR (.cycles/jobs) · CYCLES_TOKEN (optional bearer token)
 *      BLENDER (path, forwarded to the runner) · CYCLES_FAKE_RENDER=1
 *
 * API (JSON unless noted):
 *   GET  /health                   → { ok, blender, fake, queued, rendering }
 *   POST /jobs            bundle   → { id }                       (202)
 *   GET  /jobs/:id                 → { id, status, startedAt, finishedAt, error, log }
 *   GET  /jobs/:id/still.png       → image/png                   (when done)
 *   GET  /jobs/:id/provenance.json → application/json            (when done)
 *   DELETE /jobs/:id               → { id, status: "cancelled" }
 * Jobs render one at a time with --rerun, so provenance carries the deterministic gate.
 */
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const runner = join(root, "scripts", "cycles", "render-still.mjs");
const PORT = Number(process.env.PORT ?? 8787);
const JOBS_DIR = resolve(process.env.CYCLES_JOBS_DIR ?? join(root, ".cycles", "jobs"));
const TOKEN = process.env.CYCLES_TOKEN ?? "";
const FAKE = process.env.CYCLES_FAKE_RENDER === "1";
const LOG_TAIL = 40;

mkdirSync(JOBS_DIR, { recursive: true });

const jobs = new Map();
const queue = [];
let active = null;

function blenderVersion() {
  if (FAKE) return "fake";
  const probe = spawnSync(process.execPath, [runner, "--check"], { encoding: "utf8" });
  return probe.status === 0 ? probe.stdout.trim().split(" at ")[0] : null;
}

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json", ...cors() });
  res.end(JSON.stringify(body));
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function authorised(req) {
  if (!TOKEN) return true;
  return req.headers.authorization === `Bearer ${TOKEN}`;
}

function readBody(req) {
  return new Promise((resolvePromise, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolvePromise(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function publicJob(job) {
  return {
    id: job.id,
    status: job.status,
    jobId: job.jobId,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    error: job.error,
    log: job.log.slice(-LOG_TAIL),
  };
}

async function fakeRender(job) {
  // No Blender here: a flat placeholder still so the app's round trip can be tested.
  const bundle = JSON.parse(readFileSync(join(job.dir, "bundle.json"), "utf8"));
  const { createCanvas } = await import("@napi-rs/canvas");
  const canvas = createCanvas(bundle.render.widthPx, bundle.render.heightPx);
  const context = canvas.getContext("2d");
  context.fillStyle = "#8a7a6a";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#f2eee8";
  context.font = "48px sans-serif";
  context.fillText(`FAKE CYCLES STILL · ${bundle.job.jobId}`, 40, 90);
  writeFileSync(join(job.dir, "still.png"), canvas.toBuffer("image/png"));
  writeFileSync(join(job.dir, "provenance.json"), `${JSON.stringify({
    schemaVersion: bundle.job.schemaVersion,
    engine: bundle.job.engine,
    lightUnitsVersion: bundle.lightUnitsVersion,
    jobId: bundle.job.jobId,
    projectId: bundle.job.projectId,
    projectContentHash: bundle.job.projectContentHash,
    snapshotId: bundle.job.snapshotId,
    cameraId: bundle.job.cameraId,
    seed: bundle.render.seed,
    materialIds: bundle.materialIds,
    lightCount: 0,
    bundleSha256: "fake",
    blender: "fake",
    platform: process.platform,
    device: "FAKE",
    samplesMax: 0,
    timeCapSeconds: bundle.render.timeCapSeconds,
    elapsedSeconds: 0,
    resolution: [bundle.render.widthPx, bundle.render.heightPx],
    denoise: "none",
    viewTransform: "none",
    deterministicRerun: { mad: 0, limit: 5.1, pass: true, seconds: 0 },
    warnings: ["CYCLES_FAKE_RENDER: placeholder image, not a render"],
    stillPath: "still.png",
  }, null, 2)}\n`);
  job.log.push("[fake] placeholder still written");
}

function finish(job, status, error = null) {
  job.status = status;
  job.error = error;
  job.finishedAt = new Date().toISOString();
  job.child = null;
  active = null;
  pump();
}

async function run(job) {
  active = job;
  job.status = "rendering";
  job.startedAt = new Date().toISOString();
  if (FAKE) {
    try {
      await fakeRender(job);
      finish(job, "done");
    } catch (error) {
      finish(job, "failed", error instanceof Error ? error.message : String(error));
    }
    return;
  }
  const child = spawn(process.execPath, [runner, job.dir, "--rerun"], { env: process.env });
  job.child = child;
  const relay = (chunk) => {
    for (const line of chunk.toString().split("\n")) if (line.trim()) job.log.push(line.trim());
  };
  child.stdout.on("data", relay);
  child.stderr.on("data", relay);
  child.on("exit", (code, signal) => {
    if (job.status === "cancelled") return;
    const ok = code === 0 && existsSync(join(job.dir, "provenance.json"));
    finish(job, ok ? "done" : "failed", ok ? null : `runner exited with ${signal ?? code}`);
  });
}

function pump() {
  if (active || queue.length === 0) return;
  void run(queue.shift());
}

async function handle(req, res) {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (req.method === "OPTIONS") {
    res.writeHead(204, cors());
    res.end();
    return;
  }
  if (!authorised(req)) return json(res, 401, { error: "missing or wrong bearer token" });

  if (req.method === "GET" && url.pathname === "/health") {
    return json(res, 200, { ok: true, blender: blenderVersion(), fake: FAKE, queued: queue.length, rendering: active?.id ?? null });
  }
  if (req.method === "POST" && url.pathname === "/jobs") {
    let bundle;
    try {
      bundle = JSON.parse(await readBody(req));
    } catch {
      return json(res, 400, { error: "body must be a Cycles bundle (JSON)" });
    }
    if (!bundle?.job?.jobId || bundle?.job?.engine?.id !== "stilljob-cycles") {
      return json(res, 400, { error: "not a Cycles bundle" });
    }
    const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const dir = join(JOBS_DIR, id);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "bundle.json"), `${JSON.stringify(bundle)}\n`);
    const job = { id, jobId: bundle.job.jobId, dir, status: "queued", createdAt: new Date().toISOString(), startedAt: null, finishedAt: null, error: null, log: [], child: null };
    jobs.set(id, job);
    queue.push(job);
    pump();
    return json(res, 202, { id });
  }
  const match = url.pathname.match(/^\/jobs\/([a-z0-9-]+)(?:\/(still\.png|provenance\.json))?$/);
  if (!match) return json(res, 404, { error: "not found" });
  const job = jobs.get(match[1]);
  if (!job) return json(res, 404, { error: "unknown job" });
  if (req.method === "DELETE") {
    const index = queue.indexOf(job);
    if (index >= 0) queue.splice(index, 1);
    job.status = "cancelled";
    job.child?.kill("SIGKILL");
    if (active === job) { active = null; pump(); }
    return json(res, 200, { id: job.id, status: job.status });
  }
  if (req.method !== "GET") return json(res, 405, { error: "method" });
  if (!match[2]) return json(res, 200, publicJob(job));
  if (job.status !== "done") return json(res, 409, { error: `job is ${job.status}` });
  const file = join(job.dir, match[2]);
  const body = await readFile(file);
  res.writeHead(200, { "Content-Type": match[2].endsWith(".png") ? "image/png" : "application/json", "Content-Length": body.length, ...cors() });
  res.end(body);
}

createServer((req, res) => {
  handle(req, res).catch((error) => json(res, 500, { error: error instanceof Error ? error.message : String(error) }));
}).listen(PORT, () => {
  console.log(`[cycles] render service on http://localhost:${PORT} · jobs in ${JOBS_DIR} · blender ${blenderVersion() ?? "NOT FOUND"}${FAKE ? " (fake mode)" : ""}${TOKEN ? " · token required" : ""}`);
});
