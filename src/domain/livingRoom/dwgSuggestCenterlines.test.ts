import { describe, expect, it } from "vitest";
import type { DwgDatabase } from "@mlightcad/libredwg-web";
import { cadToPlanPoint } from "./dwgPlanMap";
import { buildDwgPreview, dwgPreviewDataUrl } from "./dwgGeometry";
import { dwgStrokeCadPoints } from "./dwgStrokeCadPoints";
import { extractDwgSuggestCenterlines } from "./dwgSuggestCenterlines";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";

function drawing(entities: unknown[], tables?: DwgDatabase["tables"]): DwgDatabase {
  return { header: { INSUNITS: 4 }, entities, tables } as DwgDatabase;
}

function underlayFrom(entities: unknown[], tables?: DwgDatabase["tables"]): LivingRoomPlanUnderlay {
  const preview = buildDwgPreview(drawing(entities, tables));
  const width = preview.bounds.maxX - preview.bounds.minX;
  const height = preview.bounds.maxY - preview.bounds.minY;
  return {
    sourceType: "dwg",
    fileName: "centerlines.dxf",
    dataUrl: dwgPreviewDataUrl(preview),
    widthMm: width,
    heightMm: height,
    opacity: 0.4,
    dwg: { preview, hiddenLayers: [] },
  };
}

describe("DWG suggest centerlines", () => {
  it("maps a LINE through the stroke matrix into plan millimetres", () => {
    const underlay = underlayFrom([{
      type: "LINE", layer: "Walls", startPoint: { x: 0, y: 0, z: 0 }, endPoint: { x: 4000, y: 3000, z: 0 },
    }]);
    const { segments, skippedCurves } = extractDwgSuggestCenterlines(underlay);
    expect(skippedCurves).toBe(0);
    expect(segments).toHaveLength(1);
    const stroke = underlay.dwg!.preview.layers[0]!.paths[0]!;
    const cad = dwgStrokeCadPoints(stroke.d, stroke.matrix);
    const bounds = underlay.dwg!.preview.bounds;
    expect(segments[0]).toMatchObject({
      layer: "Walls",
      a: cadToPlanPoint(cad[0]!, underlay, bounds),
      b: cadToPlanPoint(cad[1]!, underlay, bounds),
    });
  });

  it("splits a straight polyline into one segment per edge", () => {
    const underlay = underlayFrom([{
      type: "LWPOLYLINE", layer: "Walls",
      vertices: [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }],
    }]);
    const { segments } = extractDwgSuggestCenterlines(underlay, ["Walls"]);
    expect(segments).toHaveLength(2);
    expect(segments.map((s) => [s.a, s.b])).toEqual([
      [{ x: -2000, z: 1500 }, { x: 2000, z: 1500 }],
      [{ x: 2000, z: 1500 }, { x: 2000, z: -1500 }],
    ]);
  });

  it("skips arc commands and reports them instead of fabricating chords", () => {
    const underlay = underlayFrom([
      { type: "LINE", layer: "Walls", startPoint: { x: 0, y: 0 }, endPoint: { x: 10, y: 0 } },
      { type: "ARC", layer: "Walls", center: { x: 0, y: 0 }, radius: 10, startAngle: 0, endAngle: Math.PI / 2 },
    ]);
    const extracted = extractDwgSuggestCenterlines(underlay);
    expect(extracted.segments).toHaveLength(1);
    expect(extracted.skippedCurves).toBeGreaterThan(0);
  });

  it("keeps straight edges of a mixed polyline and counts bulge arcs as skipped", () => {
    const underlay = underlayFrom([{
      type: "LWPOLYLINE", layer: "Walls",
      vertices: [{ x: 0, y: 0, bulge: 1 }, { x: 10, y: 0 }, { x: 20, y: 0 }],
    }]);
    const extracted = extractDwgSuggestCenterlines(underlay);
    const stroke = underlay.dwg!.preview.layers[0]!.paths[0]!;
    expect(stroke.d).toContain(" A");
    expect(extracted.skippedCurves).toBeGreaterThan(0);
    expect(extracted.segments).toHaveLength(1);
    const bounds = underlay.dwg!.preview.bounds;
    expect(extracted.segments[0]?.a).toEqual(cadToPlanPoint({ x: 10, y: 0 }, underlay, bounds));
    expect(extracted.segments[0]?.b).toEqual(cadToPlanPoint({ x: 20, y: 0 }, underlay, bounds));
  });

  it("uses the stored block matrix once and does not re-expand inserts", () => {
    const tables = {
      BLOCK_RECORD: { entries: [{
        name: "wall", flags: 0, basePoint: { x: 0, y: 0 },
        entities: [{ type: "LINE", layer: "0", startPoint: { x: 0, y: 0, z: 0 }, endPoint: { x: 5, y: 10, z: 0 } }],
      }] },
    } as DwgDatabase["tables"];
    const underlay = underlayFrom([{
      type: "INSERT", name: "wall", layer: "Walls",
      insertionPoint: { x: 100, y: 50 }, xScale: 2, yScale: 2, rotation: 0,
    }], tables);
    const stroke = underlay.dwg!.preview.layers[0]!.paths[0]!;
    const cad = dwgStrokeCadPoints(stroke.d, stroke.matrix);
    const { segments, skippedCurves } = extractDwgSuggestCenterlines(underlay);
    const bounds = underlay.dwg!.preview.bounds;
    expect(skippedCurves).toBe(0);
    expect(segments).toHaveLength(1);
    expect(segments[0]?.a).toEqual(cadToPlanPoint(cad[0]!, underlay, bounds));
    expect(segments[0]?.b).toEqual(cadToPlanPoint(cad[1]!, underlay, bounds));
  });
});
