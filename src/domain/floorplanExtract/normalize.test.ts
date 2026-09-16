import { describe, expect, it } from "vitest";
import { normalizeExtraction } from "./normalize";
import type { ExtractionResult } from "./types";

function rect(id: string, x0: number, y0: number, x1: number, y1: number): ExtractionResult["polygons"]["walls"][0] {
  return { id, outer: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] };
}

describe("normalizeExtraction", () => {
  it("blocks thin walls unless accepted", () => {
    // 80mm thick horizontal strip
    const raw: ExtractionResult = {
      schema_version: "1.0",
      units: "meters",
      polygons: {
        rooms: [],
        walls: [rect("wall-0", 0, 0, 4, 0.08)],
        doors: [],
        windows: [],
      },
    };
    const blocked = normalizeExtraction(raw);
    expect(blocked.issues.some((i) => i.code === "thin_wall" && i.blocksApply)).toBe(true);
    const allowed = normalizeExtraction(raw, { acceptThinWalls: true });
    expect(allowed.issues.some((i) => i.code === "thin_wall" && i.blocksApply)).toBe(false);
  });
});
