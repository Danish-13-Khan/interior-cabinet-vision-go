import { describe, expect, it } from "vitest";
import { wallPolygonsFromRing } from "./roomRingWalls";

describe("wallPolygonsFromRing", () => {
  it("emits ≥3 axis-aligned walls for a rectangular room", () => {
    const walls = wallPolygonsFromRing(
      [[0, 0], [4, 0], [4, 3], [0, 3]],
      "room-0",
    );
    expect(walls.length).toBeGreaterThanOrEqual(3);
    expect(walls.every((w) => w.id?.startsWith("room-0:edge-"))).toBe(true);
  });
});
