import type { ExtractionResult } from "./types";

function rect(id: string, x0: number, y0: number, x1: number, y1: number) {
  return { id, outer: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] as [number, number][] };
}

/** Centerlines in the paired `fixtures/floorplanExtract/kitchen.dxf` (INSUNITS mm). */
export const GOLDEN_KITCHEN_DXF_LINES_MM = [
  { x1: 0, y1: 0, x2: 4000, y2: 0 },
  { x1: 4000, y1: 0, x2: 4000, y2: 4000 },
  { x1: 4000, y1: 4000, x2: 0, y2: 4000 },
  { x1: 0, y1: 4000, x2: 0, y2: 0 },
] as const;

/** Axis-aligned single-room kitchen used as the Phase 1 import fixture. */
export function goldenKitchenExtraction(): ExtractionResult {
  return {
    schema_version: "1.0",
    units: "meters",
    pixel_scale: 0.001,
    source: { filename: "kitchen.dxf", content_type: "image/vnd.dxf", mode: "vector", notes: "phase-01-golden" },
    defaults: { wall_height_m: 2.7 },
    polygons: {
      rooms: [rect("kitchen", 0.15, 0.15, 3.85, 3.85)],
      walls: [
        rect("wall-front", 0, -0.1, 4, 0.1),
        rect("wall-right", 3.9, 0, 4.1, 4),
        rect("wall-back", 0, 3.9, 4, 4.1),
        rect("wall-left", -0.1, 0, 0.1, 4),
      ],
      doors: [],
      windows: [],
    },
  };
}
