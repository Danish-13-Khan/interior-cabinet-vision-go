import { describe, expect, it } from "vitest";
import {
  createPhase1BenchmarkProject,
  resolvePhase1BenchmarkCameraId,
} from "../phase1Benchmarks";
import {
  buildStillJob,
  stillJobProjectContentHash,
  stillSupportArtifactRefs,
  validateStillJobAgainstProject,
} from "./index";

describe("StillJob Phase 2A foundation", () => {
  it("builds a job for one benchmark camera without mutating project truth", () => {
    const project = createPhase1BenchmarkProject("bench-daylight-sofa");
    const before = JSON.stringify(project);
    const cameraId = resolvePhase1BenchmarkCameraId(project, "camera-a");
    const job = buildStillJob({
      project,
      cameraId,
      jobId: "sj-p2a-daylight-a",
      createdAt: "2026-08-15T00:00:00.000Z",
      seed: 7,
      attachments: stillSupportArtifactRefs("sj-p2a-daylight-a"),
    });

    expect(JSON.stringify(project)).toBe(before);
    expect(job.schemaVersion).toBe(2);
    expect(job.snapshotId).toContain(job.projectContentHash);
    expect(job.projectContentHash).toBe(stillJobProjectContentHash(project));
    expect(job.millwork.length).toBeGreaterThan(0);
    expect(job.openings.length).toBe(project.openings.length);
    expect(job.walls.length).toBe(project.walls.length);
    expect(job.attachments.heroPngPath).toBe("sj-p2a-daylight-a-hero-plate.png");
  });

  it("round-trips saved job JSON against the same project", () => {
    const project = createPhase1BenchmarkProject("bench-millwork-media");
    const cameraId = resolvePhase1BenchmarkCameraId(project, "camera-b");
    const job = buildStillJob({
      project,
      cameraId,
      jobId: "sj-p2a-millwork-b",
      createdAt: "2026-08-15T00:00:00.000Z",
    });
    const restored = JSON.parse(JSON.stringify(job));
    const validation = validateStillJobAgainstProject(restored, project);
    expect(validation.ok).toBe(true);
    expect(validation.gates.some((gate) => gate.id === "millwork_size" && gate.pass)).toBe(true);
    expect(validation.gates.some((gate) => gate.id === "opening_wall" && gate.pass)).toBe(true);
  });

  it("fails when claimed still eye drifts beyond 25 mm", () => {
    const project = createPhase1BenchmarkProject("bench-evening-lamp");
    const cameraId = resolvePhase1BenchmarkCameraId(project, "camera-a");
    const job = buildStillJob({
      project,
      cameraId,
      jobId: "sj-p2a-drift",
      createdAt: "2026-08-15T00:00:00.000Z",
    });
    const drifted = {
      ...job.cameraPose,
      eye: { ...job.cameraPose.eye, x: job.cameraPose.eye.x + 40 },
    };
    const validation = validateStillJobAgainstProject(job, project, drifted);
    expect(validation.ok).toBe(false);
    expect(validation.gates.find((gate) => gate.id === "camera_eye")?.pass).toBe(false);
  });

  it("fails when millwork size drifts beyond 2 mm", () => {
    const project = createPhase1BenchmarkProject("bench-millwork-media");
    const cameraId = resolvePhase1BenchmarkCameraId(project, "camera-a");
    const job = buildStillJob({
      project,
      cameraId,
      jobId: "sj-p2a-millwork-lie",
      createdAt: "2026-08-15T00:00:00.000Z",
    });
    const polluted = {
      ...job,
      millwork: job.millwork.map((item, index) =>
        index === 0 ? { ...item, size: { ...item.size, w: item.size.w + 12 } } : item,
      ),
    };
    const validation = validateStillJobAgainstProject(polluted, project);
    expect(validation.ok).toBe(false);
    expect(validation.gates.find((gate) => gate.id === "millwork_size")?.pass).toBe(false);
  });

  it("fails when object set invents furniture", () => {
    const project = createPhase1BenchmarkProject("bench-daylight-sofa");
    const cameraId = resolvePhase1BenchmarkCameraId(project, "camera-a");
    const job = buildStillJob({
      project,
      cameraId,
      jobId: "sj-p2a-hallucinate",
      createdAt: "2026-08-15T00:00:00.000Z",
    });
    const polluted = {
      ...job,
      objects: [
        ...job.objects,
        {
          id: "hallucinated-prop",
          category: "decor",
          position: { x: 0, y: 0, z: 0 },
          rotationYDeg: 0,
          size: { w: 100, d: 100, h: 100 },
        },
      ],
    };
    const validation = validateStillJobAgainstProject(polluted, project);
    expect(validation.gates.find((gate) => gate.id === "object_set")?.pass).toBe(false);
  });
});
