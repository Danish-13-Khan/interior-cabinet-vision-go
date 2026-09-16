import { describe, expect, it } from "vitest";
import { wrapSingleFloorBuilding } from "./building";
import type { ExtractionResult } from "./types";

const extract: ExtractionResult = {
  schema_version: "1.0",
  units: "meters",
  polygons: { rooms: [], walls: [], doors: [], windows: [] },
};

describe("wrapSingleFloorBuilding", () => {
  it("wraps one extract as L0", () => {
    const b = wrapSingleFloorBuilding(extract);
    expect(b.floors).toHaveLength(1);
    expect(b.floors[0].id).toBe("L0");
    expect(b.floors[0].elevation_m).toBe(0);
    expect(b.floors[0].extract).toBe(extract);
  });
});
