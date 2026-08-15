#!/usr/bin/env node
/**
 * Phase 2A: StillJob request + validation + provenance fixtures (no AI / no PNG bytes).
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function run(args) {
  const result = spawnSync("npx", ["vitest", "run", ...args], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("[still-job] Phase 2A domain tests…");
run(["src/domain/livingRoom/stillJob", "src/domain/livingRoom/stillReview"]);

console.log("[still-job] write Phase 2A fixtures…");
run(["scripts/still-job/write-phase2a-fixture.test.ts"]);

console.log("[still-job] done → fixtures/phase-2-stills/");
