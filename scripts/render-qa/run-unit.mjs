#!/usr/bin/env node
/**
 * Thin orchestrator for render QA unit checks + asset file resolution.
 * Screenshot smoke stays in Playwright (`npm run qa:smoke`).
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

console.log("[render-qa] checking curated asset files…");
run(process.execPath, [join(root, "scripts/render-qa/check-assets.mjs")]);

console.log("[render-qa] running domain/rendering QA unit tests…");
run("npm", [
  "test",
  "--",
  "src/domain/livingRoom/renderQa",
  "src/rendering/qa",
  "src/domain/livingRoom/glbFurnitureLoader.test.ts",
  "src/rendering/assets/curatedAssetPack.test.ts",
]);

console.log("[render-qa] unit + asset checks passed");
