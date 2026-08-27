#!/usr/bin/env node
import { mkdirSync } from "node:fs";
import { baseUrl, fixturesDir, outputPath, useDevServer } from "./lib/config.mjs";
import { listBenchmarks, writeLatencySamples } from "./lib/fixtures.mjs";
import { collectSamples } from "./lib/render-benchmark.mjs";
import { run, startServer, waitForServer } from "./lib/server.mjs";

async function main() {
  mkdirSync(fixturesDir, { recursive: true });
  if (!useDevServer) {
    console.log("[phase1-latency] building production assets...");
    await run("npm", ["run", "build"]);
  }

  const server = startServer();
  const shutdown = () => { if (!server.killed) server.kill("SIGINT"); };
  process.on("exit", shutdown);
  process.on("SIGINT", () => { shutdown(); process.exit(130); });
  process.on("SIGTERM", () => { shutdown(); process.exit(143); });
  try {
    await waitForServer(baseUrl);
    const samples = await collectSamples({ baseUrl, benchmarks: listBenchmarks(), writeSamples: writeLatencySamples });
    writeLatencySamples(samples);
    console.log(`[phase1-latency] wrote ${outputPath}`);
  } finally {
    shutdown();
  }
}

await main();
