import { describe, expect, it } from "vitest";
import {
  clientToPlanPoint,
  fitPlanViewToBounds,
  panPlanViewByScreen,
  planPointerSnapThresholdMm,
  planViewBoxString,
  planViewWorldPerPx,
  screenPxToWorldMm,
  zoomPlanViewToward,
  type PlanViewBox,
} from "./planViewTransform";

const base: PlanViewBox = { minX: 0, minZ: 0, width: 4000, height: 3000 };

describe("planViewTransform", () => {
  it("zooms toward a world point without drifting that point under the cursor", () => {
    const originX = 1000;
    const originZ = 750;
    const next = zoomPlanViewToward(base, 2, originX, originZ);
    expect(next.width).toBeCloseTo(2000, 5);
    expect(next.height).toBeCloseTo(1500, 5);
    const tXBefore = (originX - base.minX) / base.width;
    const tXAfter = (originX - next.minX) / next.width;
    const tZBefore = (originZ - base.minZ) / base.height;
    const tZAfter = (originZ - next.minZ) / next.height;
    expect(tXAfter).toBeCloseTo(tXBefore, 6);
    expect(tZAfter).toBeCloseTo(tZBefore, 6);
  });

  it("fits bounds into the CSS viewport aspect", () => {
    const fitted = fitPlanViewToBounds(
      { minX: 0, minZ: 0, maxX: 4000, maxZ: 2000 },
      800,
      600,
      0,
      0,
    );
    expect(fitted.width / fitted.height).toBeCloseTo(800 / 600, 5);
    expect(fitted.minX + fitted.width / 2).toBeCloseTo(2000, 5);
    expect(fitted.minZ + fitted.height / 2).toBeCloseTo(1000, 5);
  });

  it("pans by screen pixels with uniform meet scale", () => {
    const next = panPlanViewByScreen(base, 100, 0, 800, 600);
    expect(next.minX).toBeCloseTo(-500, 5);
    expect(next.minZ).toBe(0);
  });

  it("maps client coordinates with xMidYMid meet letterboxing", () => {
    const view: PlanViewBox = { minX: 0, minZ: 0, width: 4000, height: 3000 };
    const rect = { left: 0, top: 0, width: 1000, height: 600 };
    const scale = Math.min(1000 / 4000, 600 / 3000);
    const contentW = 4000 * scale;
    const offsetX = (1000 - contentW) / 2;
    const left = clientToPlanPoint(view, offsetX, 300, rect);
    expect(left.x).toBeCloseTo(0, 5);
    expect(left.z).toBeCloseTo(1500, 5);
    const mid = clientToPlanPoint(view, 500, 300, rect);
    expect(mid.x).toBeCloseTo(2000, 5);
    expect(mid.z).toBeCloseTo(1500, 5);
    const naiveWouldBe = 0;
    expect(clientToPlanPoint(view, 0, 300, rect).x).not.toBeCloseTo(naiveWouldBe, 0);
  });

  it("uses the same mm/px for pan and meet mapping", () => {
    expect(planViewWorldPerPx(base, 800, 600)).toBeCloseTo(5, 5);
  });

  it("serializes viewBox", () => {
    expect(planViewBoxString(base)).toBe("0 0 4000 3000");
  });

  it("converts a stable screen snap radius to world mm that scales with zoom", () => {
    const cssW = 800;
    const cssH = 600;
    const zoomedOut: PlanViewBox = { minX: 0, minZ: 0, width: 8000, height: 6000 };
    const zoomedIn: PlanViewBox = { minX: 0, minZ: 0, width: 2000, height: 1500 };
    const outMm = planPointerSnapThresholdMm(zoomedOut, cssW, cssH, 8);
    const inMm = planPointerSnapThresholdMm(zoomedIn, cssW, cssH, 8);
    expect(outMm).toBeGreaterThan(inMm);
    expect(outMm / inMm).toBeCloseTo(4, 5);
    expect(outMm).toBeCloseTo(screenPxToWorldMm(8, planViewWorldPerPx(zoomedOut, cssW, cssH)), 9);
    // High zoom → smaller world threshold (less sticky); low zoom → larger (still usable).
    expect(inMm).toBeCloseTo(20, 5); // 8px * (2000/800)
    expect(outMm).toBeCloseTo(80, 5); // 8px * (8000/800)
  });

  it("marquee click threshold from px also scales with world-per-pixel", () => {
    const view: PlanViewBox = { minX: 0, minZ: 0, width: 4000, height: 3000 };
    const worldPerPx = planViewWorldPerPx(view, 800, 600); // 5 mm/px
    expect(screenPxToWorldMm(5, worldPerPx)).toBeCloseTo(25, 5);
    expect(screenPxToWorldMm(5, worldPerPx * 0.5)).toBeCloseTo(12.5, 5);
  });
});
