import { describe, expect, it } from "vitest";
import {
  createPhase1BenchmarkProject,
  resolvePhase1BenchmarkCameraId,
} from "../phase1Benchmarks";
import {
  buildStillJob,
  stillJobProjectContentHash,
  validateStillJobAgainstProject,
} from "./index";

describe("StillJob spike (Ch7)", () => {
  it("builds a job for one benchmark camera with pose + materials", () => {
    const project = createPhase1BenchmarkProject("bench-daylight-sofa");
    const cameraId = resolvePhase1BenchmarkCameraId(project, "camera-a");
    const job = buildStillJob({
      project,
      cameraId,
      jobId: "sj-spike-daylight-a",
      createdAt: "2026-08-13T00:00:00.000Z",
      seed: 7,
      attachments: {
        heroPngPath: "hero-plate.png",
      },
    });

    expect(job.schemaVersion).toBe(1);
    expect(job.projectId).toBe(project.id);
    expect(job.projectContentHash).toBe(stillJobProjectContentHash(project));
    expect(job.cameraId).toBe(cameraId);
    expect(job.cameraPose.fovDeg).toBeGreaterThan(0);
    expect(job.materials.length).toBe(project.materials.length);
    expect(job.objects.length).toBe(project.objects.length);
    expect(job.attachments.heroPngPath).toBe("hero-plate.png");
    expect(job.forbiddenChangesNote).toMatch(/may not lie/i);
  });

  it("round-trips camera pose within §3.1 tolerances", () => {
    const project = createPhase1BenchmarkProject("bench-millwork-media");
    const cameraId = resolvePhase1BenchmarkCameraId(project, "camera-b");
    const job = buildStillJob({
      project,
      cameraId,
      jobId: "sj-spike-millwork-b",
      createdAt: "2026-08-13T00:00:00.000Z",
    });

    const validation = validateStillJobAgainstProject(job, project);
    expect(validation.ok).toBe(true);
    expect(
      validation.gates.filter((gate) => !gate.pass).map((gate) => gate.id),
    ).toEqual([]);
  });

  it("fails when claimed still eye drifts beyond 25 mm", () => {
    const project = createPhase1BenchmarkProject("bench-evening-lamp");
    const cameraId = resolvePhase1BenchmarkCameraId(project, "camera-a");
    const job = buildStillJob({
      project,
      cameraId,
      jobId: "sj-spike-drift",
      createdAt: "2026-08-13T00:00:00.000Z",
    });

    const drifted = {
      ...job.cameraPose,
      eye: {
        ...job.cameraPose.eye,
        x: job.cameraPose.eye.x + 40,
      },
    };
    const validation = validateStillJobAgainstProject(job, project, drifted);
    expect(validation.ok).toBe(false);
    const eyeGate = validation.gates.find((gate) => gate.id === "camera_eye");
    expect(eyeGate?.pass).toBe(false);
    expect(eyeGate?.measured).toBeGreaterThan(25);
  });

  it("fails when object set invents furniture", () => {
    const project = createPhase1BenchmarkProject("bench-daylight-sofa");
    const cameraId = resolvePhase1BenchmarkCameraId(project, "camera-a");
    const job = buildStillJob({
      project,
      cameraId,
      jobId: "sj-spike-hallucinate",
      createdAt: "2026-08-13T00:00:00.000Z",
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
    expect(validation.ok).toBe(false);
    expect(
      validation.gates.find((gate) => gate.id === "object_set")?.pass,
    ).toBe(false);
  });
});
