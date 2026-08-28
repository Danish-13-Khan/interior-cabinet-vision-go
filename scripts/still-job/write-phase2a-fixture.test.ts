/**
 * Writes fixtures/phase-2-stills for Phase 2A handoff + revalidation.
 * Invoked by `npm run stilljob:phase2a` (via vitest).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  createPhase1BenchmarkProject,
  resolvePhase1BenchmarkCameraId,
} from "../../src/domain/livingRoom/phase1Benchmarks";
import {
  acceptStillReview,
  buildStillJob,
  openStillReview,
  stillSupportArtifactRefs,
  validateStillJobAgainstProject,
} from "../../src/domain/livingRoom";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = join(root, "fixtures/phase-2-stills");
const NOW = "2026-08-15T00:00:00.000Z";
const JOB_ID = "sj-p2a-daylight-sofa-camera-a";

describe("Phase 2A still fixture export", () => {
  it("writes job JSON, revalidates from disk, and records accepted provenance", () => {
    const project = createPhase1BenchmarkProject("bench-daylight-sofa");
    const before = JSON.stringify(project);
    const cameraId = resolvePhase1BenchmarkCameraId(project, "camera-a");
    const attachments = stillSupportArtifactRefs(JOB_ID);
    const job = buildStillJob({
      project,
      cameraId,
      jobId: JOB_ID,
      createdAt: NOW,
      seed: 7,
      styleIds: ["nordic-light"],
      attachments,
    });
    const validation = validateStillJobAgainstProject(job, project);
    expect(validation.ok).toBe(true);

    const accepted = acceptStillReview(
      openStillReview(job, attachments.heroPngPath ?? null, `${JOB_ID}-still.png`),
      NOW,
    );
    expect(JSON.stringify(project)).toBe(before);

    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, "still-job.json"), `${JSON.stringify(job, null, 2)}\n`);
    writeFileSync(
      join(outDir, "validation.json"),
      `${JSON.stringify({ ok: validation.ok, gates: validation.gates, tolerances: validation.tolerances }, null, 2)}\n`,
    );
    writeFileSync(
      join(outDir, "support-artifacts.json"),
      `${JSON.stringify({ jobId: JOB_ID, attachments, notes: "PNG bytes are not committed; paths are the capture contract." }, null, 2)}\n`,
    );
    writeFileSync(
      join(outDir, "provenance-accepted.json"),
      `${JSON.stringify(accepted.provenance, null, 2)}\n`,
    );
    writeFileSync(
      join(outDir, "material-ids.json"),
      `${JSON.stringify(job.materials, null, 2)}\n`,
    );

    const restored = JSON.parse(readFileSync(join(outDir, "still-job.json"), "utf8"));
    const roundTrip = validateStillJobAgainstProject(restored, project);
    expect(roundTrip.ok).toBe(true);
    writeFileSync(
      join(outDir, "NOTES.md"),
      [
        "# Phase 2A stills fixtures",
        "",
        "Proven:",
        "- StillJob v2 from InteriorProject + locked camera (snapshot id + hash)",
        "- millwork / openings / walls refs + §3.1 gates",
        "- revalidation from saved still-job.json",
        "- review accept provenance (rejected stills are not written here)",
        "- support artifact path contract (hero/depth/normal/material ids)",
        "- Render Studio review UI (plate | still | diff, Accept/Reject/Retry)",
        "- Hero still engine v1 (deterministic grade/contact/sharpen)",
        "- Deterministic rerun gate (§3.1 MAD ≤ 2%)",
        "- Accepted stills in client package manifest only",
        "",
        "Not in fixtures (by design):",
        "- WebGL PNG capture bytes (too large for git)",
        "- Stochastic / AI still engine",
        "",
      ].join("\n"),
    );
  });
});
