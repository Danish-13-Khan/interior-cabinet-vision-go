import { describe, expect, it } from "vitest";
import {
  appendMeasurePoint,
  formatMeasureLengthMm,
  measureLengthMm,
  measureSegmentsFromPoints,
} from "./planMeasure";

describe("planMeasure", () => {
  it("computes length in mm", () => {
    expect(measureLengthMm({ x: 0, z: 0 }, { x: 3000, z: 4000 })).toBe(5000);
  });

  it("formats with thousands separators", () => {
    expect(formatMeasureLengthMm(2735)).toBe("2,735 mm");
  });

  it("builds running segments", () => {
    const points = appendMeasurePoint([], { x: 0, z: 0 });
    const withB = appendMeasurePoint(points, { x: 600, z: 0 });
    const withC = appendMeasurePoint(withB, { x: 600, z: 900 });
    const segments = measureSegmentsFromPoints(withC);
    expect(segments).toHaveLength(2);
    expect(segments[0]!.lengthMm).toBe(600);
    expect(segments[1]!.lengthMm).toBe(900);
  });

  it("ignores a repeated click on the same point", () => {
    const points = appendMeasurePoint([{ x: 0, z: 0 }], { x: 0.2, z: 0.1 });
    expect(points).toHaveLength(1);
  });
});
