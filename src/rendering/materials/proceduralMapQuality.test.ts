import { describe, expect, it } from "vitest";
import { resolveModelViewMaterialQuality } from "../../domain/livingRoom/modelViewPreviewDefaults";
import { anisotropyForRenderMode } from "./materialScale";
import {
  fabricMapPixelSize,
  noiseMapPixelSize,
  woodMapPixelSize,
} from "./proceduralMapQuality";

describe("proceduralMapQuality modeQuality integration", () => {
  it("derives wood, fabric, and noise pixel sizes from model-view modeQuality", () => {
    const draft = resolveModelViewMaterialQuality("draft");
    const standard = resolveModelViewMaterialQuality("standard");
    expect(woodMapPixelSize("preview", "draft", draft)).toBe(128);
    expect(woodMapPixelSize("preview", "standard", standard)).toBe(256);
    expect(fabricMapPixelSize("preview", "draft", draft)).toBe(64);
    expect(fabricMapPixelSize("preview", "standard", standard)).toBe(128);
    expect(noiseMapPixelSize("paint", "preview", "draft", draft)).toBe(96);
    expect(noiseMapPixelSize("paint", "preview", "standard", standard)).toBe(192);
    expect(anisotropyForRenderMode("preview", "draft", draft)).toBe(6);
    expect(anisotropyForRenderMode("preview", "standard", standard)).toBe(10);
  });
});
