import { describe, expect, it } from "vitest";
import { grainQuarterTurns, grainRotationDeg } from "./grainRotation";

describe("grainQuarterTurns", () => {
  it("turns crosswise grain a quarter turn and leaves lengthwise alone", () => {
    expect(grainQuarterTurns("crosswise")).toBe(1);
    expect(grainQuarterTurns("lengthwise")).toBe(0);
  });

  it("accepts the shorter room-preset vocabulary", () => {
    expect(grainQuarterTurns("length")).toBe(0);
    expect(grainQuarterTurns("width")).toBe(1);
  });

  it("treats none, unknown and missing values as no rotation", () => {
    expect(grainQuarterTurns("none")).toBe(0);
    expect(grainQuarterTurns("diagonal")).toBe(0);
    expect(grainQuarterTurns(undefined)).toBe(0);
  });
});

describe("grainRotationDeg", () => {
  it("adds the grain turn on top of an authored rotation", () => {
    expect(grainRotationDeg({ uvRotationDeg: 15, grainDirection: "crosswise" })).toBe(105);
    expect(grainRotationDeg({ uvRotationDeg: 15, grainDirection: "lengthwise" })).toBe(15);
  });

  it("defaults to zero when nothing is authored", () => {
    expect(grainRotationDeg({})).toBe(0);
  });
});
