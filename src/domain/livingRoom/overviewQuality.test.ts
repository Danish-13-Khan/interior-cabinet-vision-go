import { describe, expect, it } from "vitest";
import { OVERVIEW_DEFAULT_QUALITY, overviewQualityStep } from "./overviewQuality";

describe("overview quality", () => {
  it("opens in Draft and restores the room view's quality on leaving", () => {
    const enter = overviewQualityStep(true, "standard", null);
    expect(enter).toEqual({ set: OVERVIEW_DEFAULT_QUALITY, saved: "standard" });
    const leave = overviewQualityStep(false, "draft", enter.saved);
    expect(leave).toEqual({ set: "standard", saved: null });
  });

  it("keeps a quality picked inside the overview until leaving", () => {
    expect(overviewQualityStep(true, "standard", "draft")).toEqual({ set: null, saved: "draft" });
    expect(overviewQualityStep(false, "standard", "draft")).toEqual({ set: "draft", saved: null });
  });

  it("does nothing when the quality already matches, or outside the overview", () => {
    expect(overviewQualityStep(true, "draft", null)).toEqual({ set: null, saved: "draft" });
    expect(overviewQualityStep(false, "draft", "draft")).toEqual({ set: null, saved: null });
    expect(overviewQualityStep(false, "standard", null)).toEqual({ set: null, saved: null });
  });
});
