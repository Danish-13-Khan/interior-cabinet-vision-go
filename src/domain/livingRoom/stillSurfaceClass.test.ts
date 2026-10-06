import { describe, expect, it } from "vitest";
import { classifyStillSurface, nearestStillSurface, summarizeStillSurfaces, stillLuma } from "./stillSurfaceClass";

describe("still surface classes", () => {
  it("names floor, wall, and cabinet fronts", () => {
    expect(classifyStillSurface({ primitiveId: "flooring" })).toBe("floor");
    expect(classifyStillSurface({ primitiveId: "floor" })).toBe("floor");
    expect(classifyStillSurface({ primitiveId: "wall-panel" })).toBe("wall");
    expect(classifyStillSurface({ pickKind: "wall" })).toBe("wall");
    expect(classifyStillSurface({ primitiveId: "front-1" })).toBe("door");
    expect(classifyStillSurface({ primitiveId: "left-door" })).toBe("door");
    expect(classifyStillSurface({ primitiveId: "drawer-front-1" })).toBe("door");
    expect(classifyStillSurface({ primitiveId: "ceiling" })).toBeNull();
  });

  it("reports the darker half of the door hits", () => {
    const reading = summarizeStillSurfaces([
      { kind: "door", rgb: { r: 240, g: 240, b: 240, luma: stillLuma(240, 240, 240) } },
      { kind: "door", rgb: { r: 60, g: 40, b: 30, luma: stillLuma(60, 40, 30) } },
      { kind: "wall", rgb: { r: 180, g: 180, b: 180, luma: 180 } },
    ]);
    expect(reading.counts.door).toBe(2);
    expect(reading.door!.luma).toBeCloseTo(stillLuma(60, 40, 30), 5);
    expect(reading.wall!.r).toBe(180);
    expect(reading.floor).toBeNull();
  });

  it("stops on the nearest visible mesh", () => {
    expect(nearestStillSurface([
      { tags: { primitiveId: "opening-pick" }, helper: true },
      { tags: { primitiveId: "wall-panel" } },
    ])).toBe("wall");
    expect(nearestStillSurface([
      { tags: { primitiveId: "television" } },
      { tags: { primitiveId: "wall-panel" } },
    ])).toBeNull();
    expect(nearestStillSurface([
      { tags: {}, helper: true },
      { tags: { primitiveId: "front-1" } },
      { tags: { primitiveId: "wall-panel" } },
    ])).toBe("door");
  });
});
