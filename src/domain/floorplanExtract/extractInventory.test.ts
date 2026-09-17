import { describe, expect, it } from "vitest";
import { inventoryExtraction } from "./extractInventory";
import type { ExtractionResult } from "./types";

describe("inventoryExtraction", () => {
  it("flags sparse extracts as incomplete", () => {
    const sparse: ExtractionResult = {
      schema_version: "1.0",
      units: "meters",
      polygons: {
        rooms: [{ id: "r0", outer: [[0, 0], [2, 0], [2, 2], [0, 2]] }],
        walls: [{ id: "w0", outer: [[0, 0], [2, 0], [2, 0.2], [0, 0.2]] }],
        doors: [{ id: "d0", outer: [[0.5, 0], [1.2, 0], [1.2, 0.2], [0.5, 0.2]] }],
        windows: [],
      },
    };
    expect(inventoryExtraction(sparse).looksIncomplete).toBe(true);
  });

  it("accepts lounge-scale counts", () => {
    const walls = Array.from({ length: 23 }, (_, i) => ({
      id: `w${i}`, outer: [[0, 0], [1, 0], [1, 0.2], [0, 0.2]] as [number, number][],
    }));
    const rich: ExtractionResult = {
      schema_version: "1.0",
      units: "meters",
      pixel_scale: 0.001,
      polygons: { rooms: walls.slice(0, 11).map((w, i) => ({ id: `r${i}`, outer: w.outer })), walls, doors: [], windows: [] },
    };
    const inv = inventoryExtraction(rich);
    expect(inv.looksIncomplete).toBe(false);
    expect(inv.walls).toBe(23);
  });
});
