import { describe, expect, it } from "vitest";
import { createGoldenCabinetRunProject } from "../../domain/livingRoom/goldenRun/createProject";
import { compileLivingRoomScene } from "../../domain/livingRoom/sceneCompiler";
import { resolveCabinetRunFrame } from "../../domain/livingRoom/cabinetRunFrame";
import { buildCameraRigGoal } from "./cameraRigGoal";

const viewport = { widthPx: 1000, heightPx: 700 };
const scene = compileLivingRoomScene(createGoldenCabinetRunProject());

function goal(overrides: Partial<Parameters<typeof buildCameraRigGoal>[0]> = {}) {
  return buildCameraRigGoal({
    scene,
    activeCameraId: null,
    composition: "project-camera",
    renderMode: "preview",
    viewPreset: "dollhouse",
    fitMode: "room",
    fitSelection: { objectIds: [], wallId: null, openingId: null },
    viewport,
    useFitPose: false,
    frameRun: "author",
    ...overrides,
  }).goal;
}

describe("buildCameraRigGoal — cabinet run frame", () => {
  const run = resolveCabinetRunFrame(scene, viewport, { audience: "author" })!;

  it("Dollhouse entry frames the run for authors", () => {
    const pose = goal();
    expect(pose.target.x).toBeCloseTo(run.target.x / 1000);
    expect(pose.target.z).toBeCloseTo(run.target.z / 1000);
  });

  it("Fit Room keeps the whole-room frame; Reset returns to the run", () => {
    const roomFit = goal({ useFitPose: true, fitMode: "room" });
    expect(roomFit.target.x).not.toBeCloseTo(run.target.x / 1000, 2);
    const reset = goal({ useFitPose: true, fitMode: "run", viewPreset: "orbit" });
    expect(reset.position.x).toBeCloseTo(run.position.x / 1000);
    expect(reset.position.z).toBeCloseTo(run.position.z / 1000);
  });

  it("other author presets keep their own framing", () => {
    const top = goal({ viewPreset: "top" });
    expect(top.target.x).not.toBeCloseTo(run.target.x / 1000, 2);
  });

  it("client framing applies on every preset", () => {
    const client = resolveCabinetRunFrame(scene, viewport, { audience: "client" })!;
    const pose = goal({ frameRun: "client", viewPreset: "perspective" });
    expect(pose.position.y).toBeCloseTo(client.position.y / 1000);
  });
});
