import { describe, expect, it } from "vitest";
import { ensureCollisionFreeIds } from "./ids";
import type { ExtractionResult } from "./types";

function base(): ExtractionResult {
  return {
    schema_version: "1.0",
    units: "meters",
    polygons: {
      rooms: [],
      walls: [
        { id: "wall-0", outer: [[0, 0], [2, 0], [2, 0.2], [0, 0.2]] },
        { outer: [[2, 0], [4, 0], [4, 0.2], [2, 0.2]] },
      ],
      doors: [],
      windows: [],
    },
  };
}

describe("ensureCollisionFreeIds", () => {
  it("skips reserved wall-0 for unnamed wall", () => {
    const out = ensureCollisionFreeIds(base());
    expect(out.polygons.walls[0].id).toBe("wall-0");
    expect(out.polygons.walls[1].id).toBe("wall-1");
  });

  it("renames a later duplicate wall id", () => {
    const raw = base();
    raw.polygons.walls.push({
      id: "wall-0",
      outer: [[4, 0], [6, 0], [6, 0.2], [4, 0.2]],
    });
    const out = ensureCollisionFreeIds(raw);
    expect(out.polygons.walls.map((w) => w.id)).toEqual(["wall-0", "wall-1", "wall-2"]);
  });
});
