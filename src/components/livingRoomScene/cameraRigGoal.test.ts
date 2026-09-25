import { describe, expect, it } from "vitest";
import { compileLivingRoomScene } from "../../domain/livingRoom/sceneCompiler";
import { createLivingRoomStarterProject } from "../../domain/livingRoom/preset";
import { resolveRenderCameraPose } from "../../domain/livingRoom/renderCameraPose";
import { buildCameraRigGoal } from "./cameraRigGoal";

const viewport = { widthPx: 1000, heightPx: 700 };
const project = createLivingRoomStarterProject({ now: "2026-08-31T00:00:00.000Z" });
const scene = compileLivingRoomScene(project);
const saved = scene.cameras.find((camera) => camera.name === "TV Wall")!;

function goal(overrides: Partial<Parameters<typeof buildCameraRigGoal>[0]> = {}) {
  return buildCameraRigGoal({
    scene,
    activeCameraId: saved.id,
    composition: "project-camera",
    renderMode: "preview",
    viewPreset: "perspective",
    fitMode: "room",
    fitSelection: { objectIds: [], wallId: null, openingId: null },
    viewport,
    useFitPose: false,
    fieldOfViewDegrees: 42,
    ...overrides,
  }).goal;
}

describe("buildCameraRigGoal", () => {
  it("uses a saved project camera pose for Perspective", () => {
    const resolved = resolveRenderCameraPose(saved, scene.bounds, "project-camera", "preview");
    const pose = goal();
    expect(pose.position.x).toBeCloseTo(resolved.position.x / 1000);
    expect(pose.position.y).toBeCloseTo(resolved.position.y / 1000);
    expect(pose.position.z).toBeCloseTo(resolved.position.z / 1000);
    expect(pose.target.x).toBeCloseTo(resolved.target.x / 1000);
    expect(pose.fieldOfViewDegrees).toBe(resolved.fieldOfViewDegrees);
    const exterior = goal({ activeCameraId: null });
    expect(exterior.position.z).not.toBeCloseTo(pose.position.z);
    const architectural = resolveRenderCameraPose(saved, scene.bounds, "architectural", "preview");
    const composed = goal({ composition: "architectural" });
    expect(composed.position.z).toBeCloseTo(architectural.position.z / 1000);
    const hero = resolveRenderCameraPose(saved, scene.bounds, "project-camera", "hero");
    expect(goal({ renderMode: "hero" }).fieldOfViewDegrees).toBe(hero.fieldOfViewDegrees);
    expect(hero.fieldOfViewDegrees).not.toBe(resolved.fieldOfViewDegrees);
  });

  it("Fit Room overrides a saved Perspective camera", () => {
    const savedPose = goal();
    const roomFit = goal({ useFitPose: true, fitMode: "room" });
    const exterior = goal({ activeCameraId: null });
    expect(roomFit.position.z).not.toBeCloseTo(savedPose.position.z);
    expect(roomFit.position.x).toBeCloseTo(exterior.position.x);
    expect(roomFit.position.z).toBeCloseTo(exterior.position.z);
  });

  it("Isometric Focus Selected zooms to the selection span", () => {
    const objectId = scene.nodes.find((node) => node.sourceObjectId && node.primitives.length > 0)!
      .sourceObjectId!;
    const base = { viewPreset: "isometric" as const, activeCameraId: null };
    const room = goal({ ...base, useFitPose: true, fitMode: "room" });
    const focused = goal({
      ...base,
      useFitPose: true,
      fitMode: "selection",
      fitSelection: { objectIds: [objectId], wallId: null, openingId: null },
    });
    expect(focused.orthographicZoom!).toBeGreaterThan(room.orthographicZoom!);
  });
});
