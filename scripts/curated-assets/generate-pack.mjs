/**
 * Regenerate the curated living-room asset pack (GLBs + PBR textures).
 * Run: node scripts/curated-assets/generate-pack.mjs
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

function run(file) {
  const result = spawnSync(process.execPath, [join(here, file)], {
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("generate-glbs.mjs");
run("generate-textures.mjs");
console.log("Curated asset pack generation complete.");
