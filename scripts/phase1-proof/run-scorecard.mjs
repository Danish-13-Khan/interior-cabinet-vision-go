#!/usr/bin/env node
/**
 * Phase 1 proof gate aligned to docs §3.2 automation row:
 * qa:assets, qa:render, presets:check, phase1-domain, qa:smoke
 * Then writes automation-report.json + regenerates PROOF.md from latency-samples.json.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const fixturesDir = join(root, "fixtures/phase-1-benchmarks");

function run(command, args, env = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...env },
  });
  return result.status ?? 1;
}

function mustPass(label, status) {
  if (status !== 0) {
    console.error(`[phase1-proof] FAILED: ${label}`);
    process.exit(status);
  }
  console.log(`[phase1-proof] ok: ${label}`);
}

const gates = [];

console.log("[phase1-proof] qa:assets…");
mustPass("qa:assets", run(process.execPath, [join(root, "scripts/render-qa/check-assets.mjs")]));
gates.push({ id: "qa:assets", pass: true });

console.log("[phase1-proof] qa:render…");
mustPass("qa:render", run("npm", ["run", "qa:render"]));
gates.push({ id: "qa:render", pass: true });

console.log("[phase1-proof] presets:check…");
mustPass("presets:check", run(process.execPath, [join(root, "scripts/render-presets/check.mjs")]));
gates.push({ id: "presets:check", pass: true });

console.log("[phase1-proof] phase1-domain…");
mustPass(
  "phase1-domain",
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
    "src/domain/livingRoom/stillJob",
  ]),
);
gates.push({ id: "phase1-domain", pass: true });

console.log("[phase1-proof] qa:smoke…");
// Prefer a fresh Vite server so a blank/broken reuse on :1420 cannot fail the gate.
mustPass(
  "qa:smoke",
  run("npm", ["run", "qa:smoke"], { PW_REUSE_SERVER: "0" }),
);
gates.push({ id: "qa:smoke", pass: true });

mkdirSync(fixturesDir, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  gates,
};
writeFileSync(
  join(fixturesDir, "automation-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log("[phase1-proof] wrote automation-report.json");

console.log("[phase1-proof] regenerate proof pack…");
mustPass(
  "write-proof",
  run("npx", ["vitest", "run", "src/domain/livingRoom/phase1Benchmarks/phase1Proof.test.ts"]),
);

console.log("[phase1-proof] automation green; check PROOF.md for latency pending/pass");
console.log("[phase1-proof] fill latency-samples.json then re-run to complete Phase 1");
