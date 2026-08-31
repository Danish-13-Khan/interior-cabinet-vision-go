import { describe, expect, it } from "vitest";
import {
  modelViewShowsHeightSlider,
  resolveModelViewCameraOverrides,
  WALKTHROUGH_EYE_HEIGHT_MM,
} from "./modelViewCameraOverrides";

describe("resolveModelViewCameraOverrides", () => {
  it("passes dollhouse height and FOV in dollhouse mode", () => {
    expect(resolveModelViewCameraOverrides("dollhouse", 3300, 42)).toEqual({
      cameraHeightMm: 3300,
      fieldOfViewDegrees: 42,
    });
    expect(modelViewShowsHeightSlider("dollhouse")).toBe(true);
  });

  it("applies FOV to perspective, orbit, and elevations without changing height", () => {
    expect(resolveModelViewCameraOverrides("perspective", 3300, 42)).toEqual({
      fieldOfViewDegrees: 42,
    });
    expect(resolveModelViewCameraOverrides("front", 3300, 42)).toEqual({
      fieldOfViewDegrees: 42,
    });
    expect(resolveModelViewCameraOverrides("orbit", 3300, 42)).toEqual({
      fieldOfViewDegrees: 42,
    });
    expect(modelViewShowsHeightSlider("perspective")).toBe(false);
  });

  it("uses a fixed eye height in walkthrough mode and still accepts FOV", () => {
    expect(resolveModelViewCameraOverrides("walkthrough", 3300, 42)).toEqual({
      cameraHeightMm: WALKTHROUGH_EYE_HEIGHT_MM,
      fieldOfViewDegrees: 42,
    });
  });
});
