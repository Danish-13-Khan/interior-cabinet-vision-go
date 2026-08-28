import { describe, expect, it } from "vitest";
import {
  meanAbsoluteChannelDiff,
  STILL_DETERMINISTIC_RERUN_MAD_LIMIT,
  validateDeterministicRerun,
} from "./validateStillOutput";

function rgba(w: number, h: number, fill: [number, number, number]) {
  const pixels = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = fill[0];
    pixels[i + 1] = fill[1];
    pixels[i + 2] = fill[2];
    pixels[i + 3] = 255;
  }
  return pixels;
}

describe("validateDeterministicRerun", () => {
  it("passes identical pixel buffers", () => {
    const pixels = rgba(4, 4, [120, 90, 60]);
    const gate = validateDeterministicRerun(pixels, pixels);
    expect(gate.pass).toBe(true);
    expect(gate.id).toBe("deterministic_rerun");
  });

  it("fails when mean channel drift exceeds the §3.1 limit", () => {
    const base = rgba(4, 4, [100, 100, 100]);
    const shifted = rgba(4, 4, [140, 140, 140]);
    const mad = meanAbsoluteChannelDiff(base, shifted);
    expect(mad).toBeGreaterThan(STILL_DETERMINISTIC_RERUN_MAD_LIMIT);
    expect(validateDeterministicRerun(base, shifted).pass).toBe(false);
  });

  it("passes a tiny deterministic grade delta within tolerance", () => {
    const base = rgba(8, 8, [100, 100, 100]);
    const near = new Uint8ClampedArray(base);
    near[0] = 102;
    expect(validateDeterministicRerun(base, near).pass).toBe(true);
  });

  it("fails when RGBA buffers differ in length", () => {
    const small = rgba(2, 2, [100, 100, 100]);
    const large = rgba(4, 4, [100, 100, 100]);
    expect(validateDeterministicRerun(small, large).pass).toBe(false);
    expect(validateDeterministicRerun(small, large).detail).toMatch(/length mismatch/i);
    expect(Number.isNaN(meanAbsoluteChannelDiff(small, large))).toBe(true);
  });

  it("fails on empty buffers instead of reporting MAD 0", () => {
    const empty = new Uint8ClampedArray(0);
    expect(validateDeterministicRerun(empty, empty).pass).toBe(false);
    expect(validateDeterministicRerun(empty, empty).detail).toMatch(/empty/i);
  });
});
