import { describe, expect, it } from "vitest";
import { planCanvasCssSize } from "./planCanvasCssSize";

describe("planCanvasCssSize", () => {
  it("rejects collapsed frames that would explode Fit", () => {
    expect(planCanvasCssSize({ width: 1918, height: 10 })).toBeNull();
    expect(planCanvasCssSize({ width: 0, height: 730 })).toBeNull();
    expect(planCanvasCssSize(null)).toBeNull();
  });

  it("accepts a real plan canvas", () => {
    expect(planCanvasCssSize({ width: 1918, height: 730 })).toEqual({ width: 1918, height: 730 });
  });
});
