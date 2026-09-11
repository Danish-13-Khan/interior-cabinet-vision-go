import { describe, expect, it } from "vitest";
import {
  MODEL_VIEW_ANISOTROPY_FROZEN,
  MODEL_VIEW_MSAA,
  resolveModelViewDprRange,
  resolveModelViewMaxDpr,
} from "./modelViewSharpness";
import { resolveModelViewMaterialQuality } from "./modelViewPreviewDefaults";

describe("modelViewSharpness Phase B", () => {
  it("keeps Draft max DPR at 1 and Standard at 1.5", () => {
    expect(resolveModelViewMaxDpr("draft")).toBe(1);
    expect(resolveModelViewMaxDpr("standard")).toBe(1.5);
    expect(resolveModelViewDprRange("draft")).toEqual([1, 1]);
    expect(resolveModelViewDprRange("standard")).toEqual([1, 1.5]);
  });

  it("clamps non–model-view-safe qualities to Standard DPR", () => {
    expect(resolveModelViewMaxDpr("presentation")).toBe(1.5);
    expect(resolveModelViewMaxDpr("client-preview")).toBe(1.5);
  });

  it("documents MSAA-on and frozen anisotropy after Phase D maps", () => {
    expect(MODEL_VIEW_MSAA).toBe(true);
    expect(resolveModelViewMaterialQuality("draft").anisotropy).toBe(
      MODEL_VIEW_ANISOTROPY_FROZEN.draft,
    );
    expect(resolveModelViewMaterialQuality("standard").anisotropy).toBe(
      MODEL_VIEW_ANISOTROPY_FROZEN.standard,
    );
  });
});
