import { describe, expect, it } from "vitest";
import { assertExtractionShape } from "./validateExtract";

describe("assertExtractionShape", () => {
  it("rejects empty polygon objects", () => {
    expect(() => assertExtractionShape({
      schema_version: "1.0",
      units: "meters",
      polygons: { rooms: [], walls: [{}], doors: [], windows: [] },
    })).toThrow(/Ring needs/);
  });

  it("accepts a minimal valid wall", () => {
    const shaped = assertExtractionShape({
      schema_version: "1.0",
      units: "meters",
      polygons: {
        rooms: [],
        walls: [{ id: "wall-0", outer: [[0, 0], [2, 0], [2, 0.2], [0, 0.2]] }],
        doors: [],
        windows: [],
      },
    });
    expect(shaped.polygons.walls[0].id).toBe("wall-0");
  });
});
