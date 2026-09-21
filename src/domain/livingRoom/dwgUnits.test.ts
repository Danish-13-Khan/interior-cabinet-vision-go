import { describe, expect, it } from "vitest";
import { dwgMillimetersPerUnit, dwgPlanDimensionsMm } from "./dwgUnits";

describe("DWG scale foundation", () => {
  it.each([[1, 25.4], [2, 304.8], [4, 1], [5, 10], [6, 1000]])(
    "converts architectural INSUNITS %s to millimeters", (code, factor) => {
      expect(dwgMillimetersPerUnit(code)).toBe(factor);
    });
  it.each([undefined, null, "4", 0, -1, 4.5, 999, NaN, Infinity, 18, 19, 20])(
    "requires explicit scale for missing or unsupported units %s", value => {
      expect(dwgMillimetersPerUnit(value)).toBeNull();
    });
  it("distinguishes historical survey feet from international feet", () => {
    expect(dwgMillimetersPerUnit(21)).toBeCloseTo(304.8006096, 7);
    expect(dwgMillimetersPerUnit(21)).not.toBe(dwgMillimetersPerUnit(2));
  });
  it("preserves a 20 by 10 foot room with an offset drawing origin", () => {
    expect(dwgPlanDimensionsMm({ minX: 1000, minY: -500, maxX: 1020, maxY: -490 }, 304.8))
      .toEqual({ widthMm: 6096, heightMm: 3048 });
  });
  it.each([0, -1, NaN, Infinity])("rejects invalid scale %s", scale => {
    expect(() => dwgPlanDimensionsMm({ minX: 0, minY: 0, maxX: 1, maxY: 1 }, scale)).toThrow();
  });
  it("rejects empty, inverted, non-finite and overflowing bounds", () => {
    for (const maxX of [0, -1, NaN, Infinity, Number.MAX_VALUE]) {
      expect(() => dwgPlanDimensionsMm({ minX: 0, minY: 0, maxX, maxY: 1 }, 1000)).toThrow();
    }
  });
});
