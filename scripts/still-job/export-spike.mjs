#!/usr/bin/env node
/**
 * StillJob week-4 spike: tests + export fixture JSON (no AI).
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

console.log("[still-job] domain tests…");
run(["src/domain/livingRoom/stillJob"]);

console.log("[still-job] write fixtures…");
run(["scripts/still-job/write-fixture.test.ts"]);

console.log("[still-job] done → fixtures/still-job-spike/");
