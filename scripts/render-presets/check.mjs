#!/usr/bin/env node
/**
 * Validate render preset matrix + unit tests.
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

console.log("[render-presets] listing matrix…");
run(process.execPath, [join(root, "scripts/render-presets/list-presets.mjs")]);

console.log("[render-presets] running unit tests…");
run("npm", [
  "test",
  "--",
  "src/domain/livingRoom/renderPresets",
  "src/domain/livingRoom/renderStudio.test.ts",
  "src/domain/livingRoom/heroRenderQuality.test.ts",
]);

console.log("[render-presets] checks passed");
