import { describe, expect, it } from "vitest";
import { glassMapVariantFromName, roughGlassNoiseAt } from "./proceduralGlassMaps";

describe("glassMapVariantFromName", () => {
  it("routes fluted and rough names, and leaves clear/toughened unmapped", () => {
    expect(glassMapVariantFromName("Fluted Glass")).toBe("fluted");
    expect(glassMapVariantFromName("Rough Finish Glass")).toBe("rough");
    expect(glassMapVariantFromName("Clear Glass")).toBeNull();
    expect(glassMapVariantFromName("Toughened Clear Glass")).toBeNull();
    expect(glassMapVariantFromName("Matte Glass")).toBeNull();
  });
});

describe("roughGlassNoiseAt", () => {
  it("covers the full texture instead of a width-sized cycle", () => {
    const size = 192;
    const values = new Set<number>();
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        values.add(Math.round(roughGlassNoiseAt(x, y) * 1e6));
      }
    }
    expect(values.size).toBeGreaterThan(size);
  });
});
