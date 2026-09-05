import { describe, expect, it } from "vitest";
import { calibrateUnderlayScale, parseKnownLengthMm } from "./planUnderlayCalibrate";
import type { LivingRoomPlanUnderlay } from "./planUnderlay";

function sampleUnderlay(overrides: Partial<LivingRoomPlanUnderlay> = {}): LivingRoomPlanUnderlay {
  return {
    fileName: "plan.png",
    dataUrl: "data:image/png;base64,cGxhbg==",
    widthMm: 4000,
    heightMm: 3000,
    opacity: 0.4,
    xMm: 120,
    zMm: -40,
    rotationDeg: 15,
    locked: false,
    hidden: false,
    calibrated: false,
    ...overrides,
  };
}

/** World position of a feature after scale-about-centre with updated centre. */
function featureWorldAfter(
  oldC: { x: number; z: number },
  newC: { x: number; z: number },
  feature: { x: number; z: number },
  factor: number,
) {
  return {
    x: newC.x + factor * (feature.x - oldC.x),
    z: newC.z + factor * (feature.z - oldC.z),
  };
}

describe("parseKnownLengthMm", () => {
  it("parses plain millimetre values", () => {
    expect(parseKnownLengthMm("3200")).toBe(3200);
  });

  it("strips thousands separators", () => {
    expect(parseKnownLengthMm("3,200")).toBe(3200);
    expect(parseKnownLengthMm("3 200")).toBe(3200);
  });

  it("strips trailing mm unit suffix", () => {
    expect(parseKnownLengthMm("3200 mm")).toBe(3200);
    expect(parseKnownLengthMm("3200MM")).toBe(3200);
  });

  it("accepts legitimate scientific notation via Number", () => {
    expect(parseKnownLengthMm("1e3")).toBe(1000);
  });

  it("rejects negative, non-numeric, and empty input", () => {
    expect(() => parseKnownLengthMm("-3200")).toThrow(/known length/i);
    expect(() => parseKnownLengthMm("abc")).toThrow(/known length/i);
    expect(() => parseKnownLengthMm("")).toThrow(/known length/i);
  });
});

describe("calibrateUnderlayScale", () => {
  it("scales width/height so screen segment equals known mm and preserves aspect", () => {
    const underlay = sampleUnderlay();
    const pointA = { x: 0, z: 0 };
    const pointB = { x: 2000, z: 0 };
    // Current world distance 2000 mm; known is 4000 → 2× scale
    const next = calibrateUnderlayScale(underlay, pointA, pointB, 4000);
    expect(next.widthMm).toBeCloseTo(8000, 5);
    expect(next.heightMm).toBeCloseTo(6000, 5);
    expect(next.heightMm / next.widthMm).toBeCloseTo(underlay.heightMm / underlay.widthMm, 8);
    expect(next.calibrated).toBe(true);
    // Centre shifts so point A stays fixed: C' = A - factor*(A - C)
    expect(next.xMm).toBeCloseTo(0 - 2 * (0 - 120), 5); // 240
    expect(next.zMm).toBeCloseTo(0 - 2 * (0 - -40), 5); // -80
    expect(next.rotationDeg).toBe(15);
    expect(next.opacity).toBe(0.4);
    expect(next.dataUrl).toBe(underlay.dataUrl);
  });

  it("preserves point A world position after scale (anchor does not drift)", () => {
    const underlay = sampleUnderlay({ xMm: 500, zMm: 200 });
    const pointA = { x: 100, z: 50 };
    const pointB = { x: 1100, z: 50 };
    const factor = 3200 / 1000; // 3.2
    const next = calibrateUnderlayScale(underlay, pointA, pointB, 3200);
    expect(next.widthMm).toBeCloseTo(4000 * factor, 5);
    const afterA = featureWorldAfter(
      { x: 500, z: 200 },
      { x: next.xMm!, z: next.zMm! },
      pointA,
      factor,
    );
    expect(afterA.x).toBeCloseTo(pointA.x, 6);
    expect(afterA.z).toBeCloseTo(pointA.z, 6);
  });

  it("leaves centre unchanged when point A is already the underlay centre", () => {
    const underlay = sampleUnderlay({ xMm: 100, zMm: 200 });
    const next = calibrateUnderlayScale(
      underlay,
      { x: 100, z: 200 },
      { x: 2100, z: 200 },
      4000,
    );
    expect(next.xMm).toBeCloseTo(100, 5);
    expect(next.zMm).toBeCloseTo(200, 5);
    expect(next.widthMm).toBeCloseTo(8000, 5);
  });

  it("shrinks when known length is shorter than current segment and keeps A fixed", () => {
    const underlay = sampleUnderlay({ widthMm: 6000, heightMm: 4500, xMm: 0, zMm: 0 });
    const pointA = { x: 500, z: 0 };
    const next = calibrateUnderlayScale(underlay, pointA, { x: 3500, z: 0 }, 1500);
    // factor = 1500/3000 = 0.5
    expect(next.widthMm).toBeCloseTo(3000, 5);
    expect(next.heightMm).toBeCloseTo(2250, 5);
    expect(next.xMm).toBeCloseTo(500 - 0.5 * (500 - 0), 5); // 250
    expect(next.zMm).toBeCloseTo(0, 5);
    expect(next.calibrated).toBe(true);
  });

  it("rejects near-zero segment and non-positive known length", () => {
    const underlay = sampleUnderlay();
    expect(() => calibrateUnderlayScale(underlay, { x: 0, z: 0 }, { x: 0.1, z: 0 }, 1000))
      .toThrow(/too close/i);
    expect(() => calibrateUnderlayScale(underlay, { x: 0, z: 0 }, { x: 1000, z: 0 }, 0))
      .toThrow(/known length/i);
    expect(() => calibrateUnderlayScale(underlay, { x: 0, z: 0 }, { x: 1000, z: 0 }, Number.NaN))
      .toThrow(/known length/i);
  });

  it("rejects calibration that would shrink a dimension below 100 mm (preserves aspect)", () => {
    const underlay = sampleUnderlay({ widthMm: 4000, heightMm: 500 });
    expect(() =>
      calibrateUnderlayScale(underlay, { x: 0, z: 0 }, { x: 1000, z: 0 }, 100),
    ).toThrow(/too small/i);
  });

  it("accepts shrink that stays at or above 100 mm on both axes", () => {
    const next = calibrateUnderlayScale(
      sampleUnderlay({ widthMm: 4000, heightMm: 3000 }),
      { x: 0, z: 0 },
      { x: 2000, z: 0 },
      100,
    );
    expect(next.widthMm).toBeCloseTo(200, 5);
    expect(next.heightMm).toBeCloseTo(150, 5);
    expect(next.heightMm / next.widthMm).toBeCloseTo(3000 / 4000, 8);
  });
});
