import { describe, expect, it } from "vitest";
import {
  CABINET_SCENE_ORBIT_DAMPING_FACTOR,
  MODEL_VIEW_ORBIT_DAMPING_FACTOR,
  ORBIT_SCREEN_SPACE_PANNING,
  cabinetSceneOrbitOverrides,
  modelViewOrbitOverrides,
  resolveOrbitControlsSharedCommons,
} from "./orbitControlsPreset";

describe("orbitControlsPreset", () => {
  it("shares screen-space panning as the only forced common", () => {
    expect(ORBIT_SCREEN_SPACE_PANNING).toBe(true);
    expect(resolveOrbitControlsSharedCommons()).toEqual({
      screenSpacePanning: true,
      enableDamping: true,
    });
  });

  it("keeps viewer and editor damping as separate overrides", () => {
    expect(MODEL_VIEW_ORBIT_DAMPING_FACTOR).toBe(0.06);
    expect(CABINET_SCENE_ORBIT_DAMPING_FACTOR).toBe(0.15);
    expect(modelViewOrbitOverrides.dampingFactor).toBe(0.06);
    expect(cabinetSceneOrbitOverrides.dampingFactor).toBe(0.15);
    expect(modelViewOrbitOverrides.zoomToCursor).toBe(true);
    expect("zoomToCursor" in cabinetSceneOrbitOverrides).toBe(false);
  });
});
