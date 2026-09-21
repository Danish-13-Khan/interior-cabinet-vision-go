import { describe, expect, it } from "vitest";
import { clusterEntityBounds, entityBox, clusterPlanBounds, gapClusterRange } from "./dwgPreviewCluster";

describe("DWG preview cluster", () => {
  it("keeps a compact run when one leftover sits far away", () => {
    expect(gapClusterRange([0, 10, 20, 1_000_000])).toEqual({ min: 0, max: 20 });
    expect(clusterPlanBounds([
      { x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }, { x: 0, y: 3000 },
      { x: 1e7, y: 1e7 }, { x: 1e7 + 8, y: 1e7 },
    ])).toEqual({ minX: 0, minY: 0, maxX: 4000, maxY: 3000 });
  });

  it("does not crop a normal room whose gaps are wall lengths", () => {
    expect(clusterPlanBounds([
      { x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 1800 },
      { x: 2200, y: 1800 }, { x: 2200, y: 3000 }, { x: 0, y: 3000 },
    ])).toEqual({ minX: 0, minY: 0, maxX: 4000, maxY: 3000 });
  });

  it("keeps a bulge extent when chord vertices repeat the same Y", () => {
    expect(clusterPlanBounds([
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: -5 },
    ])).toEqual({ minX: 0, minY: -5, maxX: 10, maxY: 0 });
  });

  it("drops a sparse side margin so dense ink fills the preview", () => {
    const points = Array.from({ length: 80 }, (_, index) => ({
      x: index % 8,
      y: Math.floor(index / 8),
    }));
    points.push({ x: 80, y: 4 }, { x: 82, y: 5 });
    const bounds = clusterPlanBounds(points);
    expect(bounds?.maxX).toBeLessThan(20);
    expect(bounds?.minX).toBeLessThanOrEqual(0);
  });
});

describe("distributed distant CAD objects", () => {
  it("fits the room even when no single gap dominates the global span", () => {
    const boxes = Array.from({ length: 100 }, (_, i) => entityBox([
      { x: 100 + i * 5, y: 60 + i * 3 },
      { x: 110 + i * 5, y: 70 + i * 3 },
    ])!);
    const expected = clusterEntityBounds(boxes);
    for (const [x, y] of [[1_859_030, 6_978_130], [1_859_040, 6_978_140], [4_723_921, 2_285_027], [6_271_120, 8_853_646]]) {
      boxes.push(entityBox([{ x, y }, { x: x + 10, y: y + 10 }])!);
    }
    expect(clusterEntityBounds(boxes)).toEqual(expected);
  });

  it("preserves equally populated separate drawings", () => {
    expect(gapClusterRange([0, 10, 1e7, 1e7 + 10])).toEqual({ min: 0, max: 1e7 + 10 });
  });
});
