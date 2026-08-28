import { describe, expect, it } from "vitest";
import {
  describeModelViewHonesty,
  describeModelViewRuntimeProfile,
  modelViewProjectLightScale,
  modelViewWindowKeyScale,
  resolveModelViewLightingQuality,
  resolveModelViewMaterialQuality,
  resolveModelViewRenderMode,
} from "./modelViewPreviewDefaults";
import { resolveEnvironmentLightingQuality } from "./environmentLightingQuality";
import { getRenderModeQuality } from "./heroRenderQuality";

describe("modelViewPreviewDefaults", () => {
  it("keeps model view on preview render mode", () => {
    expect(resolveModelViewRenderMode()).toBe("preview");
  });

  it("softens preview lighting beyond the generic preview resolver", () => {
    const draft = resolveModelViewLightingQuality("draft");
    const generic = resolveEnvironmentLightingQuality("preview", "draft");
    expect(draft.mode).toBe("preview");
    expect(draft.preferHdri).toBe(true);
    expect(draft.shadowRadius).toBeGreaterThan(generic.shadowRadius);
    expect(draft.contactShadowBlurScale).toBeGreaterThan(generic.contactShadowBlurScale);

    const standard = resolveModelViewLightingQuality("standard");
    expect(standard.shadowMapSize).toBeGreaterThanOrEqual(draft.shadowMapSize);
    expect(standard.contactShadowOpacityScale).toBeGreaterThan(draft.contactShadowOpacityScale);
  });

  it("boosts designed material response without hero mode", () => {
    const draft = resolveModelViewMaterialQuality("draft");
    const generic = getRenderModeQuality("preview", "draft");
    expect(draft.mode).toBe("preview");
    expect(draft.envMapIntensityScale).toBeGreaterThan(generic.envMapIntensityScale);
    expect(draft.clearcoatScale).toBeGreaterThan(generic.clearcoatScale);

    const standard = resolveModelViewMaterialQuality("standard");
    expect(standard.textureDetail).toBe("high");
    expect(standard.anisotropy).toBeGreaterThan(draft.anisotropy);
  });

  it("labels model view honesty as preview-only review", () => {
    const draft = describeModelViewHonesty("draft");
    expect(draft.headline).toBe("Designed Preview");
    expect(draft.shortBadge).toContain("PREVIEW");
    expect(draft.shortBadge).not.toContain("HERO");
    expect(draft.subline).toMatch(/not client export/i);

    const standard = describeModelViewHonesty("standard");
    expect(standard.headline).toBe("Rich Preview");
    expect(standard.shortBadge).toContain("STANDARD · PREVIEW");
  });

  it("scales project and window keys for soft review lighting", () => {
    expect(modelViewProjectLightScale("draft")).toBeLessThan(modelViewProjectLightScale("standard"));
    expect(modelViewWindowKeyScale("standard")).toBeGreaterThan(modelViewWindowKeyScale("draft"));
  });

  it("exposes stable runtime metadata that diverges by viewport quality", () => {
    const draft = describeModelViewRuntimeProfile("draft");
    const standard = describeModelViewRuntimeProfile("standard");
    expect(draft.renderMode).toBe("preview");
    expect(standard.renderMode).toBe("preview");
    expect(draft.textureDetail).toBe("low");
    expect(standard.textureDetail).toBe("high");
    expect(draft.modelViewPreview).toBe(true);
    expect(draft.anisotropy).toBe(6);
    expect(draft.proceduralMapWidth).toBe(128);
    expect(standard.anisotropy).toBe(10);
    expect(standard.proceduralMapWidth).toBe(256);
    expect(standard.shadowMapSize).toBeGreaterThan(draft.shadowMapSize);
    expect(standard.envMapIntensityScale).toBeGreaterThan(draft.envMapIntensityScale);
    expect(standard.proceduralMapWidth).toBeGreaterThan(draft.proceduralMapWidth);
    expect(standard.anisotropy).toBeGreaterThan(draft.anisotropy);
  });
});
