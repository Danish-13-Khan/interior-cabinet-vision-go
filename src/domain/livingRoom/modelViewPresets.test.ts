import { describe, expect, it } from "vitest";
import { compileLivingRoomScene, createLivingRoomStarterProject } from ".";
import { MODEL_VIEW_PRESETS, resolveModelViewPose } from "./modelViewPresets";

describe("model view presets", () => {
  it("provides a dollhouse entry view and optional walkthrough controls", () => {
    expect(MODEL_VIEW_PRESETS.map((preset) => preset.id)).toEqual([
      "dollhouse", "orbit", "front", "top", "perspective", "walkthrough",
    ]);
    expect(MODEL_VIEW_PRESETS.filter((preset) => preset.clientMode).map((preset) => preset.id)).toEqual([
      "dollhouse", "orbit", "walkthrough",
    ]);
    expect(MODEL_VIEW_PRESETS.find((preset) => preset.id === "dollhouse")?.purpose).toBe(
      "See the whole room at a glance",
    );
  });

  it("frames the shared compiled room from each fixed view", () => {
    const scene = compileLivingRoomScene(createLivingRoomStarterProject({ now: "2026-08-18T00:00:00.000Z" }));
    const front = resolveModelViewPose(scene, "front");
    const top = resolveModelViewPose(scene, "top");
    const orbit = resolveModelViewPose(scene, "orbit");
    const dollhouse = resolveModelViewPose(scene, "dollhouse");

    expect(front.position.z).toBeGreaterThan(front.target.z);
    expect(top.position.y).toBeGreaterThan(top.target.y);
    expect(orbit.position.x).toBeGreaterThan(orbit.target.x);
    expect(dollhouse.position.y).toBeGreaterThan(dollhouse.target.y);
  });
});
