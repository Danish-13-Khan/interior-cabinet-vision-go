import { describe, expect, it } from "vitest";
import {
  appendMeasurePoint,
  collectMeasureSnapPoints,
  formatMeasureLengthMm,
  measureLengthMm,
  measureSegmentsFromPoints,
  snapMeasurePoint,
  type MeasureSnapPoint,
} from "./planMeasure";
import { createLivingRoomStarterProject } from "./preset";

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

  it("snaps to nearest higher-priority candidate", () => {
    const candidates: MeasureSnapPoint[] = [
      { x: 10, z: 0, kind: "grid", label: "Grid" },
      { x: 5, z: 0, kind: "wall-end", label: "Wall end" },
    ];
    const hit = snapMeasurePoint({ x: 7, z: 0 }, candidates, 20, 50);
    expect(hit.kind).toBe("wall-end");
    expect(hit.x).toBe(5);
  });

  it("rounds to grid on demand without materializing a lattice", () => {
    const hit = snapMeasurePoint({ x: 53, z: 47 }, [], 40, 50);
    expect(hit.kind).toBe("grid");
    expect(hit.x).toBe(50);
    expect(hit.z).toBe(50);
  });

  it("collects only semantic geometry points (no quadratic grid)", () => {
    const project = createLivingRoomStarterProject({ now: "2026-08-31T00:00:00.000Z" });
    const points = collectMeasureSnapPoints(project, 25);
    expect(points.every((p) => p.kind !== "grid")).toBe(true);
    expect(points.length).toBeLessThan(500);
    expect(points.some((p) => p.kind === "wall-end" || p.kind === "corner")).toBe(true);
  });
});
