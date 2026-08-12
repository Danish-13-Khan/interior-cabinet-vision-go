#!/usr/bin/env node
/**
 * Orchestrate client presentation checks (sample package + unit tests).
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

console.log("[presentation] building sample package…");
run(process.execPath, [join(root, "scripts/client-presentation/build-sample.mjs")]);

console.log("[presentation] running client presentation unit tests…");
run("npm", [
  "test",
  "--",
  "src/domain/livingRoom/clientPresentation",
]);

console.log("[presentation] checks passed");
