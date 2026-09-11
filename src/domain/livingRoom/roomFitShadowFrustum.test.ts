import { describe, expect, it } from "vitest";
import {
  resolveRoomFitFrustumHalfExtent,
  roomSpanMetersFromSizeMm,
} from "./roomFitShadowFrustum";
import { STUDIO_PROJECT_SHADOW } from "./shadowCameraTuning";

describe("roomFitShadowFrustum Policy A", () => {
  it("derives span from plan size in meters", () => {
    expect(roomSpanMetersFromSizeMm({ widthMm: 6000, depthMm: 4000 })).toBe(6);
  });

  it("grows frustum for large rooms above Studio ±7 baseline", () => {
    const studio = STUDIO_PROJECT_SHADOW.frustumHalfExtent ?? 7;
    const small = resolveRoomFitFrustumHalfExtent(5, studio);
    const large = resolveRoomFitFrustumHalfExtent(16, studio);
    expect(small).toBeGreaterThanOrEqual(studio);
    expect(large).toBeGreaterThan(studio);
    expect(large).toBeGreaterThan(small);
  });

  it("clamps extreme spans", () => {
    expect(resolveRoomFitFrustumHalfExtent(100)).toBe(22);
    expect(resolveRoomFitFrustumHalfExtent(0)).toBe(7);
  });
});
