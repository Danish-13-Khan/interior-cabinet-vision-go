import { describe, expect, it, vi } from "vitest";
import { cloneProceduralMaps, placeProceduralMaps } from "./cloneProceduralMaps";
import type { ProceduralSurfaceMaps } from "./proceduralMapGenerators";

function fakeTexture(rotation = 0) {
  return {
    clone: vi.fn(function clone(this: { rotation: number }) {
      return fakeTexture(this.rotation);
    }),
    center: { set: vi.fn() },
    rotation,
    offset: { set: vi.fn() },
  };
}

describe("cloneProceduralMaps", () => {
  it("clones maps so later UV edits do not mutate the cache", () => {
    const map = fakeTexture();
    const maps = cloneProceduralMaps({ map: map as never, bumpScale: 0.01 });
    expect(map.clone).toHaveBeenCalledTimes(1);
    expect(maps.map).not.toBe(map);
    expect(maps.bumpScale).toBe(0.01);
  });
});

describe("placeProceduralMaps", () => {
  it("applies grain quarter-turn on top of authored rotation", () => {
    const map = fakeTexture();
    placeProceduralMaps(
      { map: map as never } as ProceduralSurfaceMaps,
      { uvRotationDeg: 15, grainDirection: "crosswise" } as never,
    );
    expect(map.center.set).toHaveBeenCalledWith(0.5, 0.5);
    expect(map.rotation).toBeCloseTo((105 * Math.PI) / 180);
    expect(map.offset.set).toHaveBeenCalledWith(0, 0);
  });
});
