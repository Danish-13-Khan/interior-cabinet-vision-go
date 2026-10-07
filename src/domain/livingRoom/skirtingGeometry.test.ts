import { describe, expect, it } from "vitest";
import { floorPanelCuts, skirtingKeepSpans } from "./skirtingGeometry";
import type { InteriorObjectEntity, OpeningEntity, WallEntity } from "../interiorProject";

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

  it("stops the skirting behind a floor-standing wall panel", () => {
    const wall = { id: "wall", start: { x: 0, z: 0 }, end: { x: 5000, z: 0 } } as unknown as WallEntity;
    const panel = {
      id: "panel", category: "wall-panel", roomId: "room", position: { x: 2500, y: 0, z: 9 },
      dimensions: { widthMm: 2000, heightMm: 2400, depthMm: 18 },
      extensions: { wallAttachment: { wallId: "wall", alongMm: 2500, floorOffsetMm: 0 } },
    } as unknown as InteriorObjectEntity;
    const raised = { ...panel, id: "shelf", position: { x: 2500, y: 1200, z: 9 },
      extensions: { wallAttachment: { wallId: "wall", alongMm: 2500, floorOffsetMm: 1200 } } } as unknown as InteriorObjectEntity;
    expect(floorPanelCuts(wall, [panel])).toEqual([{ start: 1500, end: 3500 }]);
    expect(floorPanelCuts(wall, [raised])).toEqual([]);
    expect(skirtingKeepSpans(5000, [], floorPanelCuts(wall, [panel]))).toEqual([
      { from: 10, to: 1500 },
      { from: 3500, to: 4990 },
    ]);
  });
});
