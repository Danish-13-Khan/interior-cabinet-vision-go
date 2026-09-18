import { describe, expect, it } from "vitest";
import { skirtingKeepSpans } from "./skirtingGeometry";
import type { OpeningEntity } from "../interiorProject";

function opening(offsetMm: number, widthMm: number, sillHeightMm: number): OpeningEntity {
  return {
    id: `${offsetMm}`,
    wallId: "wall",
    kind: sillHeightMm < 90 ? "door" : "window",
    offsetMm,
    widthMm,
    heightMm: 2100,
    sillHeightMm,
  };
}

describe("skirtingKeepSpans", () => {
  it("merges overlapping door cuts and clips cuts at wall ends", () => {
    expect(skirtingKeepSpans(4000, [
      opening(-100, 500, 0), opening(300, 600, 0), opening(3500, 900, 0),
    ])).toEqual([{ from: 900, to: 3500 }]);
  });

  it("does not cut skirting for hidden or zero-height openings", () => {
    expect(skirtingKeepSpans(4000, [
      { ...opening(500, 900, 0), extensions: { layerVisible: false } },
      { ...opening(2000, 900, 0), heightMm: 0 },
    ])).toEqual([{ from: 10, to: 3990 }]);
  });
  it("breaks a continuous wall around a floor-level door and keeps windows", () => {
    const spans = skirtingKeepSpans(6200, [
      opening(650, 900, 0),
      opening(1350, 1800, 750),
    ]);
    expect(spans).toEqual([
      { from: 10, to: 650 },
      { from: 1550, to: 6190 },
    ]);
  });

  it("returns one inset span when nothing cuts the floor", () => {
    expect(skirtingKeepSpans(4000, [opening(500, 1200, 900)])).toEqual([
      { from: 10, to: 3990 },
    ]);
  });
});
