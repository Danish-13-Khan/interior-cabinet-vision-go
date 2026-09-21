import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseAsciiDxf } from "./dwgDxfParse";
import { buildDwgPreview, dwgPreviewDataUrl } from "./dwgGeometry";
import { dwgSuggestHighlightStrokes } from "./dwgSuggestHighlight";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";

function roomUnderlay(hiddenLayers: string[] = []): LivingRoomPlanUnderlay {
  const preview = buildDwgPreview(parseAsciiDxf(readFileSync("tests/fixtures/dwg/room_4000x3000.dxf", "utf8")));
  return {
    sourceType: "dwg",
    fileName: "room_4000x3000.dxf",
    dataUrl: dwgPreviewDataUrl(preview),
    widthMm: 4000,
    heightMm: 3000,
    opacity: 0.42,
    dwg: { preview, hiddenLayers },
  };
}

describe("DWG suggest highlight", () => {
  it("highlights default Walls geometry in plan millimetres", () => {
    const strokes = dwgSuggestHighlightStrokes(roomUnderlay());
    expect(strokes.every((stroke) => stroke.layer === "Walls")).toBe(true);
    expect(strokes).toHaveLength(6);
    const ends = strokes.flatMap((stroke) => stroke.points.map((point) => `${point.x},${point.z}`));
    expect(ends).toContain("-2000,1500");
    expect(ends).toContain("2000,1500");
  });

  it("does not highlight a hidden Walls layer even when named", () => {
    expect(dwgSuggestHighlightStrokes(roomUnderlay(["Walls"]), ["Walls"])).toEqual([]);
  });

  it("limits highlight to strokes that meet a plan region", () => {
    const south = dwgSuggestHighlightStrokes(roomUnderlay(), ["Walls"], {
      minX: -1900, maxX: 1900, minZ: 1400, maxZ: 1600,
    });
    expect(south).toHaveLength(1);
    expect(south[0]?.points).toEqual([
      { x: -2000, z: 1500 },
      { x: 2000, z: 1500 },
    ]);
  });
});
