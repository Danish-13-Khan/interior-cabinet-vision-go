import { describe, expect, it } from "vitest";
import {
  MODEL_VIEW_ADAPTIVE_DPR,
  MODEL_VIEW_FRAMELOOP,
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
});
