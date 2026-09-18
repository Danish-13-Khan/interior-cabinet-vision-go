import { describe, expect, it } from "vitest";
import {
  aabbFitDistanceMm,
  dollyBlockedByMinDistance,
  frustumFitDistanceMm,
  orbitWheelZoomScale,
  selectionFitDistanceMm,
} from "./modelViewFitDistance";

describe("modelViewFitDistance", () => {
  it("pulls the camera closer for a wider FOV and a tighter frame", () => {
    const narrow = frustumFitDistanceMm({
      widthMm: 800, heightMm: 600, fovDegrees: 28, aspect: 16 / 10,
    });
    const wide = frustumFitDistanceMm({
      widthMm: 800, heightMm: 600, fovDegrees: 50, aspect: 16 / 10,
    });
    expect(narrow).toBeGreaterThan(wide);
  });

  it("fits a flat slab in top view using all eight corners, not world height", () => {
    const bounds = { min: { x: -1000, y: 0, z: -1000 }, max: { x: 1000, y: 100, z: 1000 } };
    const axisAligned = frustumFitDistanceMm({
      widthMm: 2000, heightMm: 100, fovDegrees: 38, aspect: 16 / 10,
    });
    const corners = aabbFitDistanceMm({
      ...bounds,
      viewFromTarget: { x: 0, y: 1, z: 0.02 },
      fovDegrees: 38,
      aspect: 16 / 10,
    });
    expect(corners).toBeGreaterThan(axisAligned);
  });

  it("falls back to span scaling when the viewport is unknown", () => {
    expect(selectionFitDistanceMm(
      { widthMm: 1000, heightMm: 800, depthMm: 400 },
      undefined,
      1000,
      42,
    )).toBe(1350);
  });

  it("returns the zoom travel that minDistance would otherwise swallow", () => {
    expect(dollyBlockedByMinDistance(0.5, 0.95, 0.08)).toBe(0);
    expect(dollyBlockedByMinDistance(0.08, 0.95, 0.08)).toBeCloseTo(0.08 - 0.08 * 0.95, 8);
    expect(dollyBlockedByMinDistance(0.08, 1.05, 0.08)).toBe(0);
  });

  it("sizes extra dolly from the pre-clamp distance so one wheel step is not counted twice", () => {
    const before = 0.081;
    const min = 0.08;
    const scale = orbitWheelZoomScale(1.05);
    const extra = dollyBlockedByMinDistance(before, scale, min);
    expect(before - min + extra).toBeCloseTo(before * (1 - scale), 8);
    const afterClamp = min;
    const doubled = before - min + dollyBlockedByMinDistance(afterClamp, scale, min);
    expect(doubled).toBeGreaterThan(before * (1 - scale) + 0.0008);
  });
});
