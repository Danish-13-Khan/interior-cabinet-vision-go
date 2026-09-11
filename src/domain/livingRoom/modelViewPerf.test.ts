import { describe, expect, it } from "vitest";
import {
  MODEL_VIEW_ADAPTIVE_DPR,
  MODEL_VIEW_FRAMELOOP,
  MODEL_VIEW_WALKTHROUGH_MAX_DELTA_S,
  clampWalkthroughMoveDelta,
  resolveModelViewMaxGlbCasters,
} from "./modelViewPerf";

describe("modelViewPerf Phase G", () => {
  it("uses demand frameloop and keeps adaptive DPR off", () => {
    expect(MODEL_VIEW_FRAMELOOP).toBe("demand");
    expect(MODEL_VIEW_ADAPTIVE_DPR).toBe(false);
  });

  it("caps Model View Standard GLB casters and keeps Draft at zero", () => {
    expect(resolveModelViewMaxGlbCasters("draft")).toBe(0);
    expect(resolveModelViewMaxGlbCasters("standard")).toBe(10);
    expect(resolveModelViewMaxGlbCasters(null)).toBe(0);
  });

  it("clamps walkthrough deltas so idle demand gaps cannot teleport", () => {
    expect(MODEL_VIEW_WALKTHROUGH_MAX_DELTA_S).toBeCloseTo(1 / 30, 6);
    expect(clampWalkthroughMoveDelta(10)).toBe(MODEL_VIEW_WALKTHROUGH_MAX_DELTA_S);
    expect(clampWalkthroughMoveDelta(1 / 60)).toBeCloseTo(1 / 60, 6);
    expect(clampWalkthroughMoveDelta(0)).toBe(0);
    expect(clampWalkthroughMoveDelta(-1)).toBe(0);
  });
});
