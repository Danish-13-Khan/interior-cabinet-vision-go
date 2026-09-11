import { describe, expect, it } from "vitest";
import {
  easeInOutCubic,
  lerpNumber,
  lerpPoint3,
  MODEL_VIEW_CAMERA_EASE_MS,
  resolveModelViewCameraFarMeters,
  resolveModelViewMinPolarAngle,
  resolveModelViewOrbitMaxDistance,
} from "./modelViewCameraEase";

describe("modelViewCameraEase Phase E", () => {
  it("eases in the 200–400 ms band and lerps points", () => {
    expect(MODEL_VIEW_CAMERA_EASE_MS).toBeGreaterThanOrEqual(200);
    expect(MODEL_VIEW_CAMERA_EASE_MS).toBeLessThanOrEqual(400);
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 5);
    expect(lerpNumber(0, 10, 0.25)).toBe(2.5);
    expect(lerpPoint3({ x: 0, y: 0, z: 0 }, { x: 4, y: 8, z: 12 }, 0.5)).toEqual({
      x: 2, y: 4, z: 6,
    });
  });

  it("scales far clip and orbit max distance with room span", () => {
    expect(resolveModelViewCameraFarMeters(8)).toBe(100);
    expect(resolveModelViewCameraFarMeters(20)).toBeGreaterThan(100);
    expect(resolveModelViewOrbitMaxDistance(20)).toBeGreaterThan(
      resolveModelViewOrbitMaxDistance(8),
    );
  });

  it("keeps dollhouse/top freer than authoring polar limits", () => {
    expect(resolveModelViewMinPolarAngle("perspective")).toBeGreaterThan(
      resolveModelViewMinPolarAngle("dollhouse"),
    );
    expect(resolveModelViewMinPolarAngle("top")).toBeLessThan(
      resolveModelViewMinPolarAngle("front"),
    );
  });
});
