import { describe, expect, it } from "vitest";
import { coerceExtractionToMeters } from "./units";
import type { ExtractionResult } from "./types";

describe("coerceExtractionToMeters", () => {
  it("scales centimetre responses down by 100", () => {
    const raw: ExtractionResult = {
      schema_version: "1.0",
      units: "centimeters",
      pixel_scale: 1,
      defaults: { wall_height_m: 2.7 },
      polygons: {
        rooms: [],
        walls: [{ id: "wall-0", outer: [[0, 0], [100, 0], [100, 20], [0, 20]] }],
        doors: [],
        windows: [],
      },
    };
    const m = coerceExtractionToMeters(raw);
    expect(m.units).toBe("meters");
    expect(m.polygons.walls[0].outer[1][0]).toBeCloseTo(1);
    expect(m.pixel_scale).toBeCloseTo(0.01);
    expect(m.defaults?.wall_height_m).toBe(2.7);
  });
});
