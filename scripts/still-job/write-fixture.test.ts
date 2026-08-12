/**
 * Writes fixtures/still-job-spike for the week-4 handoff spike.
 * Invoked by `npm run stilljob:spike` (via vitest).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  createPhase1BenchmarkProject,
  resolvePhase1BenchmarkCameraId,
} from "../../src/domain/livingRoom/phase1Benchmarks";
import {
  buildStillJob,
  validateStillJobAgainstProject,
} from "../../src/domain/livingRoom/stillJob";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = join(root, "fixtures/still-job-spike");

describe("StillJob spike fixture export", () => {
  it("writes job JSON + gaps notes + hero placeholder sidecar", () => {
    const project = createPhase1BenchmarkProject("bench-daylight-sofa");
    const cameraId = resolvePhase1BenchmarkCameraId(project, "camera-a");
    const job = buildStillJob({
      project,
      cameraId,
      jobId: "sj-spike-daylight-sofa-camera-a",
      createdAt: "2026-08-13T00:00:00.000Z",
      seed: 7,
      styleIds: ["nordic-light"],
      attachments: {
        heroPngPath: "hero-plate.png",
      },
    });

    const validation = validateStillJobAgainstProject(job, project);
    expect(validation.ok).toBe(true);

    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "still-job.json"), `${JSON.stringify(job, null, 2)}\n`, "utf8");
    writeFileSync(
      join(outDir, "validation.json"),
      `${JSON.stringify(
        {
          ok: validation.ok,
          gates: validation.gates,
          tolerances: validation.tolerances,
        },
        null,
        2,
      )}\n`,
      "utf8",
    );
    writeFileSync(
      join(outDir, "hero-plate.PLACEHOLDER.txt"),
      [
        "Attach Client Preview PNG here as hero-plate.png (not committed).",
        `Camera: ${cameraId}`,
        `Project: ${project.id}`,
        `Hash: ${job.projectContentHash}`,
        "",
      ].join("\n"),
      "utf8",
    );
    writeFileSync(
      join(outDir, "GAPS.md"),
      [
        "# StillJob spike gaps (Ch 7)",
        "",
        "Proven in this spike:",
        "- StillJob JSON shape from InteriorProject + locked camera",
        "- project content hash binding",
        "- material id list + object refs",
        "- round-trip pose QA within trust-contract §3.1 (eye/target/FOV)",
        "",
        "Not in scope yet:",
        "- Real WebGL PNG capture / attach bytes",
        "- Depth / normal / segmentation masks",
        "- Millwork size + opening/wall plan gates (types exist in tolerances)",
        "- Deterministic offline renderer or AI enhancer",
        "- Accept/Reject review UI + client package manifest",
        "- Any vendor API call",
        "",
        "Next:",
        "- Capture hero plate from Client Preview for this camera",
        "- Wire export action in app (optional) once Phase 1 PNG proof is done",
        "",
      ].join("\n"),
      "utf8",
    );
  });
});
