import { describe, expect, it } from "vitest";
import { centerlineFromWall, ringLooksDiagonal } from "./wallGraph";

describe("diagonal detection", () => {
  it("flags skewed footprint that AABB would flatten", () => {
    const skewed: [number, number][] = [[0, 0], [4, 0.4], [4, 0.6], [0, 0.2]];
    expect(ringLooksDiagonal(skewed)).toBe(true);
    const cl = centerlineFromWall(skewed);
    expect(cl.diagonalCollapsed).toBe(true);
  });

  it("allows axis-aligned thin walls", () => {
    const axis: [number, number][] = [[0, 0], [4, 0], [4, 0.2], [0, 0.2]];
    expect(ringLooksDiagonal(axis)).toBe(false);
    expect(centerlineFromWall(axis).diagonalCollapsed).toBe(false);
  });
});
