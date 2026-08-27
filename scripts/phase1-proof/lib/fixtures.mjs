import { readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import { join } from "node:path";
import { fixturesDir, outputPath, substituteReason } from "./config.mjs";

const benchmarkIds = ["bench-daylight-sofa", "bench-millwork-media", "bench-evening-lamp"];

export function listBenchmarks() {
  return benchmarkIds.map((benchmarkId) => {
    const parsed = JSON.parse(readFileSync(join(fixturesDir, `${benchmarkId}.interior.json`), "utf8"));
    const project = parsed.project;
    return {
      benchmarkId,
      homeLabel: project.name.replace(/^Phase 1\s*·\s*/, ""),
      cameras: project.cameras.map((camera, index) => ({
        frameId: `${benchmarkId}/${index === 0 ? "camera-a" : "camera-b"}`,
        name: camera.name,
      })),
    };
  });
}

function machineLabel() {
  const memoryGb = Math.round(os.totalmem() / (1024 ** 3));
  return `${os.arch()} · ${os.platform()} ${os.release()} · ${memoryGb} GB RAM`;
}

export function writeLatencySamples(samples) {
  const payload = { appSurface: "browser-dev-substitute", substituteReason, machine: machineLabel(), samples };
  writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
}
