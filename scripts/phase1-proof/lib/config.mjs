import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
export const fixturesDir = join(root, "fixtures/phase-1-benchmarks");
export const outputPath = join(fixturesDir, "latency-samples.json");
export const host = process.env.PHASE1_LATENCY_HOST || "127.0.0.1";
export const port = Number(process.env.PHASE1_LATENCY_PORT || "1420");
export const baseUrl = `http://${host}:${port}`;
export const useDevServer = process.env.PHASE1_LATENCY_USE_DEV === "1";
export const substituteReason = process.env.PHASE1_LATENCY_REASON
  || `Browser ${useDevServer ? "dev" : "preview"} harness substitute on Wednesday, August 12, 2026 because Tauri desktop automation is not available in this environment.`;
