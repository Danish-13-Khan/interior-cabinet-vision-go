#!/usr/bin/env node
/**
 * Phase 1 proof pack gate: scorecard unit evaluation + related domain tests.
 * PNG/latency remain manual under tmp/phase-1-baselines/ (see fixtures PROOF.md).
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("[phase1-proof] curated assets…");
run(process.execPath, [join(root, "scripts/render-qa/check-assets.mjs")]);

console.log("[phase1-proof] preset matrix…");
run(process.execPath, [join(root, "scripts/render-presets/check.mjs")]);

console.log("[phase1-proof] scorecard + Phase 1 domain tests…");
run("npx", [
  "vitest",
  "run",
  "src/domain/livingRoom/phase1Benchmarks",
  "src/domain/livingRoom/groundingQuality.test.ts",
  "src/domain/livingRoom/windowKeyLight.test.ts",
  "src/domain/livingRoom/materialContrast.test.ts",
  "src/domain/livingRoom/heroRenderQuality.test.ts",
  "src/domain/livingRoom/renderQa",
  "src/domain/livingRoom/renderStudio.test.ts",
  "src/domain/livingRoom/renderPresets",
  "src/rendering/qa",
]);

console.log("[phase1-proof] automated gates passed");
console.log("[phase1-proof] next: attach Draft/Client PNGs + latency table in PR (fixtures/phase-1-benchmarks/PROOF.md)");
