import { describe, expect, it } from "vitest";
import { compileLivingRoomScene, createLivingRoomStarterProject } from ".";
import {
  MODEL_VIEW_PRESETS,
  MODEL_VIEW_PRIMARY_CAMERA_IDS,
  modelViewUsesOrthographic,
  orthographicZoomForSpan,
  resolveModelViewPose,
} from "./modelViewPresets";
import {
  resolveModelViewFitPose,
  resolveModelViewSelectionBoundsMm,
} from "./modelViewFit";
import { computeCompiledSceneBounds } from "./sceneCompilerBounds";

describe("model view presets", () => {
  it("exposes primary cameras including true isometric, separate from dollhouse", () => {
    expect(MODEL_VIEW_PRIMARY_CAMERA_IDS).toEqual([
      "perspective", "isometric", "front", "side", "top",
    ]);
    expect(MODEL_VIEW_PRESETS.map((preset) => preset.id)).toEqual([
      "perspective", "isometric", "front", "side", "top", "dollhouse", "orbit", "walkthrough",
    ]);
    expect(modelViewUsesOrthographic("isometric")).toBe(true);
    expect(modelViewUsesOrthographic("dollhouse")).toBe(false);
  });

  it("frames the shared compiled room from each fixed view", () => {
    const scene = compileLivingRoomScene(createLivingRoomStarterProject({ now: "2026-08-18T00:00:00.000Z" }));
    const front = resolveModelViewPose(scene, "front");
    const top = resolveModelViewPose(scene, "top");
    const side = resolveModelViewPose(scene, "side");
    const orbit = resolveModelViewPose(scene, "orbit");
    const dollhouse = resolveModelViewPose(scene, "dollhouse");
    const isometric = resolveModelViewPose(scene, "isometric");

    expect(front.position.z).toBeGreaterThan(front.target.z);
    expect(side.position.x).toBeLessThan(side.target.x);
    expect(top.position.y).toBeGreaterThan(top.target.y);
    expect(orbit.position.x).toBeGreaterThan(orbit.target.x);
    expect(dollhouse.position.y).toBeGreaterThan(dollhouse.target.y);
    expect(isometric.position.x).toBeGreaterThan(isometric.target.x);
    expect(isometric.position.y).toBeGreaterThan(isometric.target.y);
    expect(isometric.position.z).toBeGreaterThan(isometric.target.z);
  });

  it("scales orthographic zoom with viewport size so rooms are not tiny", () => {
    const small = orthographicZoomForSpan(5000, { widthPx: 400, heightPx: 300 });
    const large = orthographicZoomForSpan(5000, { widthPx: 1600, heightPx: 1200 });
    expect(large).toBeGreaterThan(small);
    expect(large).toBeGreaterThan(80);
  });

  it("fit selection uses compiled-scene world bounds, not local primitive origins", () => {
    const scene = compileLivingRoomScene(createLivingRoomStarterProject({ now: "2026-08-18T00:00:00.000Z" }));
    const objectId = scene.nodes.find((node) => node.sourceObjectId)?.sourceObjectId;
    expect(objectId).toBeTruthy();
    const selectedNodes = scene.nodes.filter((node) => node.sourceObjectId === objectId);
    const expected = computeCompiledSceneBounds(selectedNodes);
    const resolved = resolveModelViewSelectionBoundsMm(scene, {
      objectIds: [objectId!], wallId: null, openingId: null,
    });
    expect(resolved).not.toBeNull();
    expect(resolved!.center).toEqual(expected.center);
    expect(Math.abs(resolved!.center.x) + Math.abs(resolved!.center.z)).toBeGreaterThan(100);

    const focused = resolveModelViewFitPose(scene, "front", "selection", {
      objectIds: [objectId!], wallId: null, openingId: null,
    });
    expect(focused.target.x).toBeCloseTo(expected.center.x, 5);
    expect(focused.target.z).toBeCloseTo(expected.center.z, 5);
    expect(focused.spanMm).toBeGreaterThan(0);
  });
});
