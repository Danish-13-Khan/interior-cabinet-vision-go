import { describe, expect, it } from "vitest";
import type { DwgDatabase } from "@mlightcad/libredwg-web";
import { buildDwgPreview, dwgPreviewDataUrl } from "./dwgGeometry";
import {
  defaultDwgSuggestLayerNames,
  dwgSuggestSegmentHitsRegion,
  normalizeDwgSuggestRegion,
  resolveDwgSuggestLayerNames,
  visibleDwgLayerNames,
} from "./dwgSuggestSelection";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";

function underlay(hiddenLayers: string[] = []): LivingRoomPlanUnderlay {
  const preview = buildDwgPreview({
    header: { INSUNITS: 4 },
    entities: [
      { type: "LINE", layer: "Walls", startPoint: { x: 0, y: 0 }, endPoint: { x: 4000, y: 0 } },
      { type: "LINE", layer: "Notes", startPoint: { x: 0, y: 100 }, endPoint: { x: 10, y: 100 } },
    ],
  } as DwgDatabase);
  return {
    sourceType: "dwg",
    fileName: "layers.dxf",
    dataUrl: dwgPreviewDataUrl(preview),
    widthMm: 4000,
    heightMm: 3000,
    opacity: 0.4,
    dwg: { preview, hiddenLayers },
  };
}

describe("DWG suggest layer selection", () => {
  it("defaults to visible wall-named layers", () => {
    expect(visibleDwgLayerNames(underlay())).toEqual(["Walls", "Notes"]);
    expect(defaultDwgSuggestLayerNames(underlay())).toEqual(["Walls"]);
    expect(resolveDwgSuggestLayerNames(underlay())).toEqual(["Walls"]);
  });

  it("drops hidden layers even when they are named explicitly", () => {
    const hidden = underlay(["Walls"]);
    expect(visibleDwgLayerNames(hidden)).toEqual(["Notes"]);
    expect(resolveDwgSuggestLayerNames(hidden, ["Walls", "Notes"])).toEqual(["Notes"]);
    expect(resolveDwgSuggestLayerNames(hidden, ["Walls"])).toEqual([]);
  });

  it("treats an empty name list as no layers, not as defaults", () => {
    expect(resolveDwgSuggestLayerNames(underlay(), [])).toEqual([]);
  });
});

describe("DWG suggest plan region", () => {
  it("normalizes a drag and rejects a click", () => {
    expect(normalizeDwgSuggestRegion({ x: 10, z: 20 }, { x: 4, z: 8 })).toEqual({
      minX: 4, maxX: 10, minZ: 8, maxZ: 20,
    });
    expect(normalizeDwgSuggestRegion({ x: 0, z: 0 }, { x: 0.4, z: 0.4 })).toBeNull();
  });

  it("keeps segments that only cross the region", () => {
    const region = { minX: 0, maxX: 100, minZ: 0, maxZ: 100 };
    expect(dwgSuggestSegmentHitsRegion({ x: -20, z: 50 }, { x: 120, z: 50 }, region)).toBe(true);
    expect(dwgSuggestSegmentHitsRegion({ x: 200, z: 200 }, { x: 300, z: 200 }, region)).toBe(false);
  });
});
