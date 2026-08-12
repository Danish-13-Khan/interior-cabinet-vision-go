/**
 * Deprecated placeholder generator.
 * Prefer: node scripts/curated-assets/generate-pack.mjs
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const curated = join(dirname(fileURLToPath(import.meta.url)), "curated-assets/generate-pack.mjs");
const result = spawnSync(process.execPath, [curated], { stdio: "inherit" });
process.exit(result.status ?? 1);
