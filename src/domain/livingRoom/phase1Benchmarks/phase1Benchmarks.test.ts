import { describe, expect, it } from "vitest";
import { serializeInteriorProjectFile } from "../../interiorProject";
import { compileLivingRoomScene } from "../sceneCompiler";
import { validateCameraFraming } from "../renderQa";
import {
  createPhase1BenchmarkProject,
  describePhase1LatencyEnvironment,
  isPhase1LatencyWithinBudget,
  listPhase1BenchmarkFrames,
  listPhase1ScorecardChecks,
  PHASE1_BENCHMARK_IDS,
  PHASE1_BENCHMARK_NOW,
  PHASE1_LATENCY_ENVIRONMENT,
  resolvePhase1BenchmarkCameraId,
} from "./index";

describe("phase1Benchmarks", () => {
  it("freezes three rooms with two locked cameras each (six frames)", () => {
    const frames = listPhase1BenchmarkFrames();
    expect(PHASE1_BENCHMARK_IDS).toHaveLength(3);
    expect(frames).toHaveLength(6);
    expect(new Set(frames.map((frame) => frame.frameId)).size).toBe(6);
  });

  it("keeps each benchmark JSON-safe and schema-valid on serialize", () => {
    for (const id of PHASE1_BENCHMARK_IDS) {
      const project = createPhase1BenchmarkProject(id);
      const fileJson = serializeInteriorProjectFile(project, PHASE1_BENCHMARK_NOW);
      const file = JSON.parse(fileJson) as { schemaVersion: number };
      expect(file.schemaVersion).toBe(project.schemaVersion);
      expect(fileJson).not.toMatch(/WebGL|file:\/\/|\.glb\b|THREE\.|from ['"]three['"]/i);
      expect(project.cameras).toHaveLength(2);
      expect(project.extensions?.phase1Benchmark).toMatchObject({ id, version: 1 });
      expect(compileLivingRoomScene(project).nodes.length).toBeGreaterThan(8);
    }
  });

  it("locks eye-level camera poses and framing for camera-a on each room", () => {
    for (const id of PHASE1_BENCHMARK_IDS) {
      const project = createPhase1BenchmarkProject(id);
      const cameraId = resolvePhase1BenchmarkCameraId(project, "camera-a");
      const camera = project.cameras.find((item) => item.id === cameraId)!;
      expect(camera.position.y).toBeGreaterThanOrEqual(1300);
      expect(camera.position.y).toBeLessThanOrEqual(1600);
      const scene = compileLivingRoomScene(project);
      const report = validateCameraFraming(camera, scene.bounds);
      expect(report.ok).toBe(true);
    }
  });

  it("encodes latency budgets and scorecard checklist", () => {
    expect(PHASE1_LATENCY_ENVIRONMENT.draftCaptureMaxMs).toBe(3000);
    expect(PHASE1_LATENCY_ENVIRONMENT.clientPreviewCaptureMaxMs).toBe(8000);
    expect(listPhase1ScorecardChecks()).toHaveLength(8);
    expect(describePhase1LatencyEnvironment()).toContain("tauri-desktop");
    expect(
      isPhase1LatencyWithinBudget({
        frameId: "bench-daylight-sofa/camera-a",
        quality: "draft",
        elapsedMs: 2500,
        machine: "test",
      }),
    ).toBe(true);
    expect(
      isPhase1LatencyWithinBudget({
        frameId: "bench-daylight-sofa/camera-a",
        quality: "client-preview",
        elapsedMs: 9000,
        machine: "test",
      }),
    ).toBe(false);
  });
});
