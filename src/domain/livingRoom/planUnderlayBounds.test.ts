import { describe, expect, it } from "vitest";
import { EMPTY_PLAN_SITE_BOUNDS } from "../interiorProject/roomPlanBounds";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";
import {
  planCanvasFitBounds,
  planSiteBoundsForCanvas,
  planUnderlayFitKey,
  underlayPlanBounds,
} from "./planUnderlayBounds";

function sample(patch: Partial<LivingRoomPlanUnderlay> = {}): LivingRoomPlanUnderlay {
  return {
    fileName: "house.png",
    dataUrl: "data:image/png;base64,xx",
    widthMm: 12000,
    heightMm: 9000,
    opacity: 0.42,
    xMm: 0,
    zMm: 0,
    rotationDeg: 0,
    ...patch,
  };
}

describe("planSiteBoundsForCanvas", () => {
  it("fits a blank job to the imported plan instead of the empty 8 m site", () => {
    const site = planSiteBoundsForCanvas(null, sample());
    expect(site.widthMm).toBe(12000);
    expect(site.depthMm).toBe(9000);
    expect(site.widthMm).toBeGreaterThan(EMPTY_PLAN_SITE_BOUNDS.widthMm);
  });

  it("keeps a tall house plan from spilling out of the 8 m site", () => {
    const tall = sample({ widthMm: 6200, heightMm: 18600 });
    const site = planSiteBoundsForCanvas(null, tall);
    expect(site.minZ).toBe(-9300);
    expect(site.maxZ).toBe(9300);
    expect(site.depthMm).toBeGreaterThan(EMPTY_PLAN_SITE_BOUNDS.depthMm);
  });

  it("unions a drawn room with a larger house underlay so Fit keeps both", () => {
    const room = {
      ...EMPTY_PLAN_SITE_BOUNDS,
      minX: -3100,
      maxX: 3100,
      minZ: -2300,
      maxZ: 2300,
      widthMm: 6200,
      depthMm: 4600,
    };
    const site = planSiteBoundsForCanvas(room, sample());
    expect(site.minX).toBe(-6000);
    expect(site.maxZ).toBe(4500);
  });

  it("ignores a hidden underlay", () => {
    expect(planSiteBoundsForCanvas(null, sample({ hidden: true }))).toBe(EMPTY_PLAN_SITE_BOUNDS);
    expect(underlayPlanBounds(sample({ hidden: true }))).toBeNull();
  });
});

describe("planCanvasFitBounds / fit key", () => {
  it("exposes the underlay box for the camera", () => {
    expect(planCanvasFitBounds(null, sample())).toEqual({
      minX: -6000,
      minZ: -4500,
      maxX: 6000,
      maxZ: 4500,
    });
  });

  it("changes when the file is replaced or calibrated, not when hidden", () => {
    expect(planUnderlayFitKey(sample())).toBe("house.png:12000x9000");
    expect(planUnderlayFitKey(sample({ widthMm: 18000, heightMm: 13500 }))).toBe("house.png:18000x13500");
    expect(planUnderlayFitKey(sample({ hidden: true }))).toBe("none");
  });
});
