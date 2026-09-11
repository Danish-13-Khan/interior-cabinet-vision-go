import { describe, expect, it } from "vitest";
import {
  computeFrameTimeMeanMs,
  computeFrameTimeP95Ms,
  exceedsFrameTimeBudget,
} from "./frameTimeStats";

describe("frameTimeStats", () => {
  it("computes nearest-rank p95 from sorted deltas", () => {
    const deltas = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(computeFrameTimeP95Ms(deltas)).toBe(95);
    expect(computeFrameTimeP95Ms([])).toBeNull();
  });

  it("computes optional mean from the same list", () => {
    expect(computeFrameTimeMeanMs([10, 20, 30])).toBe(20);
    expect(computeFrameTimeMeanMs([])).toBeNull();
  });

  it("flags budget fail at 1.25× baseline or absolute ceiling", () => {
    expect(
      exceedsFrameTimeBudget({ baselineP95Ms: 16, measuredP95Ms: 20 }),
    ).toBe(false);
    expect(
      exceedsFrameTimeBudget({ baselineP95Ms: 16, measuredP95Ms: 21 }),
    ).toBe(true);
    expect(
      exceedsFrameTimeBudget({
        baselineP95Ms: 16,
        measuredP95Ms: 18,
        absoluteCeilingMs: 17,
      }),
    ).toBe(true);
  });
});
