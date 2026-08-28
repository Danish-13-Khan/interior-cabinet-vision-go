#!/usr/bin/env node
/**
 * Phase 2 hybrid stills proof gate (K1):
 * domain StillJob + review + hero engine + benchmark matrix + optional e2e.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function run(args, env = {}) {
  const result = spawnSync("npx", ["vitest", "run", ...args], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...env },
  });
  return result.status ?? 1;
}

function mustPass(label, status) {
  if (status !== 0) {
    console.error(`[phase2-proof] FAILED: ${label}`);
    process.exit(status);
  }
  console.log(`[phase2-proof] ok: ${label}`);
}

console.log("[phase2-proof] StillJob + review domain…");
mustPass(
  "still-domain",
  run([
    "src/domain/livingRoom/stillJob",
    "src/domain/livingRoom/stillReview",
    "src/rendering/stillEngine",
  ]),
);

console.log("[phase2-proof] client package + accepted still binding…");
mustPass(
  "client-presentation",
  run([
    "src/domain/livingRoom/clientPresentation",
  ]),
);

console.log("[phase2-proof] benchmark matrix + PROOF.md…");
mustPass("phase2-proof", run(["src/domain/livingRoom/phase2Benchmarks/phase2Proof.test.ts"]));

console.log("[phase2-proof] Phase 2A fixtures…");
mustPass("phase2a-fixtures", run(["scripts/still-job/write-phase2a-fixture.test.ts"]));

console.log("[phase2-proof] render tier honesty (K3)…");
mustPass("render-tier-honesty", run(["src/domain/livingRoom/renderTierHonesty/renderTierHonesty.test.ts"]));

if (process.env.PHASE2_SKIP_E2E !== "1") {
  console.log("[phase2-proof] hybrid stills e2e…");
  mustPass(
    "e2e-stills",
    spawnSync("npx", ["playwright", "test", "tests/e2e/phase-k1-hybrid-stills.spec.ts"], {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: { ...process.env, PW_REUSE_SERVER: "0" },
    }).status ?? 1,
  );
  console.log("[phase2-proof] render honesty e2e (K3)…");
  mustPass(
    "e2e-k3-honesty",
    spawnSync("npx", ["playwright", "test", "tests/e2e/phase-k3-render-honesty.spec.ts"], {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: { ...process.env, PW_REUSE_SERVER: "0" },
    }).status ?? 1,
  );
}

console.log("[phase2-proof] green → fixtures/phase-2-stills/PROOF.md");
