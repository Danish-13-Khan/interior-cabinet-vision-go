import { describe, expect, it } from "vitest";
import type { DwgDatabase } from "@mlightcad/libredwg-web";
import { buildDwgPreview, dwgPreviewDataUrl } from "./dwgGeometry";
import { extractDwgSuggestCenterlines } from "./dwgSuggestCenterlines";
import { clipSegmentToBox } from "./dwgSuggestClip";
import { clipPlanSegmentToRegion, normalizeDwgSuggestSegments } from "./dwgSuggestNormalize";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";

function drawing(entities: unknown[]): DwgDatabase {
  return { header: { INSUNITS: 4 }, entities } as DwgDatabase;
}

function underlayFrom(entities: unknown[], pose: Partial<LivingRoomPlanUnderlay> = {}): LivingRoomPlanUnderlay {
  const preview = buildDwgPreview(drawing(entities));
  return {
    sourceType: "dwg",
    fileName: "clip.dxf",
    dataUrl: dwgPreviewDataUrl(preview),
    widthMm: preview.bounds.maxX - preview.bounds.minX,
    heightMm: preview.bounds.maxY - preview.bounds.minY,
    opacity: 0.4,
    dwg: { preview, hiddenLayers: [] },
    ...pose,
  };
}

const roomLines = [
  { type: "LINE", layer: "Walls", startPoint: { x: 0, y: 0, z: 0 }, endPoint: { x: 4000, y: 0, z: 0 } },
  { type: "LINE", layer: "Walls", startPoint: { x: 4000, y: 0, z: 0 }, endPoint: { x: 4000, y: 3000, z: 0 } },
  { type: "LINE", layer: "Walls", startPoint: { x: 4000, y: 3000, z: 0 }, endPoint: { x: 0, y: 3000, z: 0 } },
  { type: "LINE", layer: "Walls", startPoint: { x: 0, y: 3000, z: 0 }, endPoint: { x: 0, y: 0, z: 0 } },
];

describe("DWG suggest clip", () => {
  it("clips a crossing segment to the box including the boundary", () => {
    expect(clipSegmentToBox({ x: -50, y: 10 }, { x: 150, y: 10 }, { minX: 0, maxX: 100, minY: 0, maxY: 20 }))
      .toEqual({ a: { x: 0, y: 10 }, b: { x: 100, y: 10 } });
  });

  it("drops leftover CAD outside preview.bounds even when the underlay is rotated", () => {
    const far = {
      type: "LINE", layer: "Walls",
      startPoint: { x: 1e7, y: 1e7, z: 0 }, endPoint: { x: 1e7 + 400, y: 1e7, z: 0 },
    };
    const underlay = underlayFrom([...roomLines, far], { rotationDeg: 35, xMm: 80, zMm: -40 });
    const { segments } = extractDwgSuggestCenterlines(underlay);
    expect(segments).toHaveLength(4);
    const span = Math.max(...segments.flatMap((s) => [Math.hypot(s.a.x, s.a.z), Math.hypot(s.b.x, s.b.z)]));
    expect(span).toBeLessThan(5000);
  });

  it("clips a crossing wall to the selected plan region", () => {
    const underlay = underlayFrom(roomLines);
    const { segments } = extractDwgSuggestCenterlines(underlay, ["Walls"], {
      minX: -1900, maxX: 1900, minZ: 1400, maxZ: 1600,
    });
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      a: { x: -1900, z: 1500 },
      b: { x: 1900, z: 1500 },
    });
  });
});

describe("DWG suggest normalize", () => {
  it("removes reversed duplicates and welds near endpoints", () => {
    const segments = normalizeDwgSuggestSegments([
      { layer: "Walls", a: { x: 0, z: 0 }, b: { x: 1000, z: 0 } },
      { layer: "Walls", a: { x: 1000, z: 0 }, b: { x: 0, z: 0 } },
      { layer: "Walls", a: { x: 1000.2, z: 0 }, b: { x: 2000, z: 0 } },
    ]);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ a: { x: 0, z: 0 }, b: { x: 2000, z: 0 } });
  });

  it("keeps a corner instead of merging perpendicular walls", () => {
    const segments = normalizeDwgSuggestSegments([
      { layer: "Walls", a: { x: 0, z: 0 }, b: { x: 1000, z: 0 } },
      { layer: "Walls", a: { x: 1000, z: 0 }, b: { x: 1000, z: 800 } },
    ]);
    expect(segments).toHaveLength(2);
  });

  it("unions overlapping collinear segments instead of dropping the overlap", () => {
    const segments = normalizeDwgSuggestSegments([
      { layer: "Walls", a: { x: 0, z: 0 }, b: { x: 1000, z: 0 } },
      { layer: "Walls", a: { x: 0, z: 0 }, b: { x: 500, z: 0 } },
    ]);
    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ a: { x: 0, z: 0 }, b: { x: 1000, z: 0 } });
  });

  it("snaps reconstructed collinear endpoints onto the weld grid", () => {
    const segments = normalizeDwgSuggestSegments([
      { layer: "Walls", a: { x: 0, z: 0 }, b: { x: 1310, z: 0 } },
      { layer: "Walls", a: { x: 655, z: 0 }, b: { x: 1310, z: 0 } },
    ]);
    expect(segments).toHaveLength(1);
    expect(segments[0]?.a).toEqual({ x: 0, z: 0 });
    expect(segments[0]?.b).toEqual({ x: 1310, z: 0 });
  });

  it("clips a plan segment that only crosses the region", () => {
    expect(clipPlanSegmentToRegion(
      { x: -50, z: 10 },
      { x: 150, z: 10 },
      { minX: 0, maxX: 100, minZ: 0, maxZ: 20 },
    )).toEqual({ a: { x: 0, z: 10 }, b: { x: 100, z: 10 } });
  });
});
