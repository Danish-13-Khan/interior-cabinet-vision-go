import { describe, expect, it } from "vitest";
import {
  resolveModelViewCameraOverrides,
  WALKTHROUGH_EYE_HEIGHT_MM,
} from "./modelViewCameraOverrides";

describe("resolveModelViewCameraOverrides", () => {
  it("passes dollhouse height and FOV only in dollhouse mode", () => {
    expect(resolveModelViewCameraOverrides("dollhouse", 3300, 42)).toEqual({
      cameraHeightMm: 3300,
      fieldOfViewDegrees: 42,
    });
  });

  it("keeps project and fixed poses untouched for other presets", () => {
    expect(resolveModelViewCameraOverrides("perspective", 3300, 42)).toEqual({});
    expect(resolveModelViewCameraOverrides("front", 3300, 42)).toEqual({});
    expect(resolveModelViewCameraOverrides("orbit", 3300, 42)).toEqual({});
  });

  it("uses a fixed eye height in walkthrough mode", () => {
    expect(resolveModelViewCameraOverrides("walkthrough", 3300, 42)).toEqual({
      cameraHeightMm: WALKTHROUGH_EYE_HEIGHT_MM,
    });
  });
});
