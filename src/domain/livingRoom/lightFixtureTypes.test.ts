import { describe, expect, it } from "vitest";
import {
  LIGHT_RENDER_SCALE,
  fixtureEmissiveIntensity,
  fixtureRenderIntensity,
} from "./lightFixtureTypes";

const on = { enabled: true, intensity: 5 };
const off = { enabled: false, intensity: 5 };

describe("light render scale", () => {
  it("keeps the Phase 0 reviewed table, including the old recipe multipliers", () => {
    expect(LIGHT_RENDER_SCALE).toEqual({
      areaNitsPerUnit: 10,
      pointCandelaPerUnit: 8,
      spotCandelaPerUnit: 10,
      emissivePerUnit: 0.22,
      maxEmissive: 4,
      coveWallShare: 0.35,
      recipeAmbientScale: 0.58,
      recipeDirectionalScale: 0.86,
    });
  });

  it("maps fixture brightness into nits or candela and zeros a disabled light", () => {
    expect(fixtureRenderIntensity(on, "area", 0.92)).toBeCloseTo(5 * 10 * 0.92);
    expect(fixtureRenderIntensity(on, "point", 1)).toBe(40);
    expect(fixtureRenderIntensity(on, "spot", 1)).toBe(50);
    expect(fixtureRenderIntensity(off, "area", 1)).toBe(0);
  });

  it("caps emissive glow and ignores a switched-off fixture", () => {
    expect(fixtureEmissiveIntensity({ enabled: true, intensity: 3 })).toBeCloseTo(0.66);
    expect(fixtureEmissiveIntensity({ enabled: true, intensity: 100 })).toBe(4);
    expect(fixtureEmissiveIntensity(off)).toBe(0);
  });
});
