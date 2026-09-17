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

  it("applies a two-room plan with a door swing after accepting thin walls", () => {
    const raw: ExtractionResult = {
      schema_version: "1.0",
      units: "meters",
      polygons: {
        rooms: [
          { id: "room-0", outer: [[0.2, 0.2], [3.8, 0.2], [3.8, 2.8], [0.2, 2.8]] },
          { id: "room-1", outer: [[0.2, 3.2], [3.8, 3.2], [3.8, 5.8], [0.2, 5.8]] },
        ],
        walls: [
          rect("south", 0, -0.1, 4, 0.1),
          rect("north", 0, 5.9, 4, 6.1),
          rect("west", -0.1, 0, 0.1, 6),
          rect("east", 3.9, 0, 4.1, 6),
          rect("mid", 0.3, 2.9, 3.7, 3.1),
        ],
        doors: [{ id: "door-0", outer: [[0, 1], [0.8, 1], [0.8, 1.8], [0, 1.8]] }],
        windows: [{ id: "window-0", outer: [[1.2, -0.05], [2.0, -0.05], [2.0, 0.15], [1.2, 0.15]] }],
      },
    };
    const out = normalizeExtraction(raw, { acceptThinWalls: true });
    expect(out.roomMatches["room-0"]?.status).toBe("matched");
    expect(out.roomMatches["room-1"]?.status).toBe("matched");
    expect(out.openingAttachments["door-0"]?.status).toBe("matched");
    expect(out.openingAttachments["window-0"]?.status).toBe("matched");
    expect(out.canApply).toBe(true);
  });
});
