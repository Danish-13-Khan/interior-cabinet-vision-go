import { describe, expect, it } from "vitest";
import { normalizeExtraction } from "./normalize";
import type { ExtractionResult } from "./types";

function rect(id: string, x0: number, y0: number, x1: number, y1: number) {
  return { id, outer: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] as [number, number][] };
}

describe("normalizeExtraction export draft", () => {
  it("does not bake synth walls into draft.polygons (GLB stays raw-extract)", () => {
    const raw: ExtractionResult = {
      schema_version: "1.0",
      units: "meters",
      polygons: {
        rooms: [{
          id: "room-0",
          outer: [[1.14, 5.14], [3.96, 5.14], [3.96, 12.07], [1.14, 12.07]],
        }],
        walls: [rect("wall-3", 3.725, 9.8, 3.905, 12.02)],
        doors: [],
        windows: [],
      },
    };
    const wallCount = raw.polygons.walls.length;
    const out = normalizeExtraction(raw, { acceptThinWalls: true });
    expect(out.draft.polygons.walls.length).toBe(wallCount);
    expect(out.graph.edges.length).toBeGreaterThan(wallCount);
    expect(out.canApply).toBe(true);
  });
});
