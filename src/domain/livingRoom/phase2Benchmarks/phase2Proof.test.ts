/**
 * Phase 2 hybrid stills proof: benchmark StillJobs + trust gates + fixture pack.
 * Invoked by `npm run phase2:proof`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  PHASE1_BENCHMARK_DEFINITIONS,
  createPhase1BenchmarkProject,
  resolvePhase1BenchmarkCameraId,
} from "../phase1Benchmarks";
import {
  buildStillJob,
  stillSupportArtifactRefs,
  validateStillJobAgainstProject,
} from "../stillJob";
import {
  acceptStillReview,
  openStillReview,
} from "../stillReview";
import { describeStillHonesty } from "../stillHonesty";
import { evaluateHonesty } from "../phase1Benchmarks/evaluateHonesty";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const outDir = join(root, "fixtures/phase-2-stills");
const NOW = "2026-08-28T12:00:00.000Z";

describe("Phase 2 hybrid stills proof", () => {
  it("validates StillJobs for every locked benchmark camera", () => {
    const rows: { benchmark: string; camera: string; ok: boolean }[] = [];
    for (const bench of PHASE1_BENCHMARK_DEFINITIONS) {
      const project = createPhase1BenchmarkProject(bench.id);
      const before = JSON.stringify(project);
      for (const camera of bench.cameras) {
        const cameraId = resolvePhase1BenchmarkCameraId(project, camera.key);
        const jobId = `sj-p2-${bench.id}-${camera.key}`;
        const job = buildStillJob({
          project,
          cameraId,
          jobId,
          createdAt: NOW,
          attachments: stillSupportArtifactRefs(jobId),
        });
        const validation = validateStillJobAgainstProject(job, project);
        rows.push({ benchmark: bench.id, camera: camera.key, ok: validation.ok });
        expect(validation.ok, `${bench.id}/${camera.key}`).toBe(true);
      }
      expect(JSON.stringify(project)).toBe(before);
    }

    const honesty = describeStillHonesty();
    expect(honesty.headline).toMatch(/Hybrid Still/i);
    expect(evaluateHonesty([honesty.headline, honesty.subline]).status).toBe("pass");

    mkdirSync(outDir, { recursive: true });
    writeFileSync(
      join(outDir, "PROOF.md"),
      [
        "# Phase 2 hybrid stills proof",
        "",
        `Generated: ${NOW}`,
        "",
        "## Benchmark StillJob gates",
        "",
        "| Benchmark | Camera | Trust OK |",
        "| --- | --- | --- |",
        ...rows.map((row) => `| ${row.benchmark} | ${row.camera} | ${row.ok ? "yes" : "no"} |`),
        "",
        "## Pipeline",
        "",
        "- StillJob v2 from InteriorProject + locked camera",
        "- Hero still engine (deterministic grade/contact/sharpen)",
        "- Review: plate | still | diff · Accept / Reject / Retry",
        "- Accepted stills only in client package manifest",
        "",
      ].join("\n"),
    );
    writeFileSync(
      join(outDir, "benchmark-matrix.json"),
      `${JSON.stringify({ generatedAt: NOW, rows }, null, 2)}\n`,
    );

    const sampleBench = PHASE1_BENCHMARK_DEFINITIONS[0]!;
    const sampleProject = createPhase1BenchmarkProject(sampleBench.id);
    const sampleCameraId = resolvePhase1BenchmarkCameraId(sampleProject, "camera-a");
    const sampleJob = buildStillJob({
      project: sampleProject,
      cameraId: sampleCameraId,
      jobId: "sj-p2-proof-sample",
      createdAt: NOW,
      attachments: stillSupportArtifactRefs("sj-p2-proof-sample"),
    });
    const accepted = acceptStillReview(
      openStillReview(sampleJob, "sj-p2-proof-sample-hero-plate.png", "sj-p2-proof-sample-still.png"),
      NOW,
    );
    writeFileSync(join(outDir, "provenance-accepted.json"), `${JSON.stringify(accepted.provenance, null, 2)}\n`);
  });
});
