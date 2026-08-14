#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import os from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const fixturesDir = join(root, "fixtures/phase-1-benchmarks");
const outputPath = join(fixturesDir, "latency-samples.json");
const host = process.env.PHASE1_LATENCY_HOST || "127.0.0.1";
const port = Number(process.env.PHASE1_LATENCY_PORT || "1420");
const baseUrl = `http://${host}:${port}`;
const useDevServer = process.env.PHASE1_LATENCY_USE_DEV === "1";
const substituteReason = process.env.PHASE1_LATENCY_REASON
  || `Browser ${useDevServer ? "dev" : "preview"} harness substitute on Wednesday, August 12, 2026 because Tauri desktop automation is not available in this environment.`;

function listBenchmarks() {
  return [
    "bench-daylight-sofa",
    "bench-millwork-media",
    "bench-evening-lamp",
  ].map((benchmarkId) => {
    const absolute = join(fixturesDir, `${benchmarkId}.interior.json`);
    const parsed = JSON.parse(readFileSync(absolute, "utf8"));
    const project = parsed.project;
    return {
      benchmarkId,
      projectName: project.name,
      homeLabel: project.name.replace(/^Phase 1\s*·\s*/, ""),
      cameras: project.cameras.map((camera, index) => ({
        frameId: `${benchmarkId}/${index === 0 ? "camera-a" : "camera-b"}`,
        name: camera.name,
      })),
    };
  });
}

function machineLabel() {
  const memoryGb = Math.round(os.totalmem() / (1024 ** 3));
  return `${os.arch()} · ${os.platform()} ${os.release()} · ${memoryGb} GB RAM`;
}

function writeLatencySamples(samples) {
  const payload = {
    appSurface: "browser-dev-substitute",
    substituteReason,
    machine: machineLabel(),
    samples,
  };
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
}

function waitForServer(url, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = () => {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });
      request.on("error", () => {
        if (Date.now() >= deadline) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(tick, 500);
      });
    };
    tick();
  });
}

function mustSpawnSync(command, args) {
  const result = spawn(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  return new Promise((resolve, reject) => {
    result.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(" ")} exited with ${code ?? "unknown"}`));
    });
  });
}

async function goRenderView(page) {
  await page.getByRole("button", { name: "Interiors" }).click();
  await page.getByRole("dialog", { name: "Start a living room project" }).waitFor();
  await page.getByRole("button", { name: /FX Render/ }).waitFor({ state: "attached", timeout: 1_000 }).catch(() => {});
}

async function openBenchmark(page, benchmark) {
  await page.goto(baseUrl);
  await page.getByRole("button", { name: "Interiors" }).click();
  await page.getByRole("dialog", { name: "Start a living room project" }).waitFor();
  await page.getByRole("button", { name: new RegExp(benchmark.homeLabel, "i") }).click();
  await page.locator(".lr-plan-titlebar").waitFor();
  await page.getByRole("button", { name: /FX Render/ }).click();
  await page.locator(".lr-plan-titlebar strong").filter({ hasText: "RENDER · LIVING ROOM" }).waitFor();
  await page.getByTestId("lr-render-live").waitFor();
}

async function selectCamera(page, cameraName) {
  await page.getByRole("button", { name: new RegExp(cameraName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") }).click();
  await page.waitForTimeout(250);
}

async function selectQuality(page, label) {
  await page.getByRole("button", { name: new RegExp(`^${label}`, "i") }).click();
  await page.waitForTimeout(250);
}

async function runRender(page) {
  const renderButton = page.getByRole("button", { name: "Render Image" });
  const startedAt = Date.now();
  await renderButton.click();
  await page.waitForSelector(".lr-render-progress", { state: "visible", timeout: 10_000 });
  await page.waitForSelector(".lr-render-progress", { state: "hidden", timeout: 60_000 });
  await page.locator(".lr-render-result img").waitFor({ state: "visible", timeout: 10_000 });
  return Date.now() - startedAt;
}

async function collectSamples() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => window.localStorage.clear());

  const samples = [];
  writeLatencySamples(samples);
  const benchmarks = listBenchmarks();
  for (const benchmark of benchmarks) {
    console.log(`[phase1-latency] benchmark: ${benchmark.homeLabel}`);
    await openBenchmark(page, benchmark);
    for (const camera of benchmark.cameras) {
      console.log(`[phase1-latency] camera: ${camera.frameId} (${camera.name})`);
      await selectCamera(page, camera.name);
      await selectQuality(page, "Draft");
      console.log(`[phase1-latency] warm draft: ${camera.frameId}`);
      await runRender(page);
      const draftMs = await runRender(page);
      console.log(`[phase1-latency] measured draft: ${camera.frameId} -> ${draftMs}ms`);
      samples.push({
        frameId: camera.frameId,
        quality: "draft",
        elapsedMs: draftMs,
      });
      writeLatencySamples(samples);

      await selectQuality(page, "Client Preview");
      console.log(`[phase1-latency] warm client-preview: ${camera.frameId}`);
      await runRender(page);
      const clientPreviewMs = await runRender(page);
      console.log(`[phase1-latency] measured client-preview: ${camera.frameId} -> ${clientPreviewMs}ms`);
      samples.push({
        frameId: camera.frameId,
        quality: "client-preview",
        elapsedMs: clientPreviewMs,
      });
      writeLatencySamples(samples);
    }
  }

  await browser.close();
  return samples;
}

async function main() {
  mkdirSync(fixturesDir, { recursive: true });
  if (!useDevServer) {
    console.log("[phase1-latency] building production assets...");
    await mustSpawnSync("npm", ["run", "build"]);
  }
  const devServer = spawn(
    "npm",
    useDevServer
      ? ["run", "dev", "--", "--host", host, "--port", String(port)]
      : ["run", "preview", "--", "--host", host, "--port", String(port)],
    {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
    },
  );

  const shutdown = () => {
    if (!devServer.killed) devServer.kill("SIGINT");
  };
  process.on("exit", shutdown);
  process.on("SIGINT", () => {
    shutdown();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    shutdown();
    process.exit(143);
  });

  try {
    await waitForServer(baseUrl);
    const samples = await collectSamples();
    writeLatencySamples(samples);
    console.log(`[phase1-latency] wrote ${outputPath}`);
  } finally {
    shutdown();
  }
}

await main();
