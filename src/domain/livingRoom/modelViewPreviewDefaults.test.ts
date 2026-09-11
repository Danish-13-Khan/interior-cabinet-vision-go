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
    expect(standard.contactShadowOpacityScale).toBeLessThanOrEqual(1.12);
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
    expect(draft.subline).toMatch(/fast draft|not client export/i);

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
    expect(draft.glbCastShadow).toBe(false);
    expect(standard.glbCastShadow).toBe(true);
    expect(draft.maxDpr).toBe(1);
    expect(standard.maxDpr).toBe(1.5);
    expect(draft.msaa).toBe(true);
    expect(draft.maxDirectionalCasters).toBe(1);
    expect(standard.maxDirectionalCasters).toBe(2);
    expect(draft.maxGlbCasters).toBe(0);
    expect(standard.maxGlbCasters).toBe(10);
    expect(standard.frameloop).toBe("demand");
    expect(draft.defaultQualityLocked).toBe(true);
    expect(draft.anisotropy).toBe(6);
    expect(draft.proceduralMapWidth).toBe(128);
    expect(standard.anisotropy).toBe(10);
    expect(standard.proceduralMapWidth).toBe(256);
    expect(standard.shadowMapSize).toBeGreaterThan(draft.shadowMapSize);
    expect(standard.envMapIntensityScale).toBeGreaterThan(draft.envMapIntensityScale);
    expect(standard.proceduralMapWidth).toBeGreaterThan(draft.proceduralMapWidth);
    expect(standard.anisotropy).toBeGreaterThan(draft.anisotropy);
    expect(standard.projectShadowFrustum).toBeGreaterThan(draft.projectShadowFrustum ?? 0);
  });

  it("attaches Policy A shadow cameras only on the Model View lighting path", () => {
    const mv = resolveModelViewLightingQuality("standard");
    const studio = resolveEnvironmentLightingQuality("hero", "standard");
    expect(mv.projectShadow).toBeDefined();
    expect(mv.windowKeyShadow).toBeDefined();
    expect(mv.maxDirectionalCasters).toBe(2);
    expect(studio.projectShadow).toBeUndefined();
    expect(studio.windowKeyShadow).toBeUndefined();
    expect(studio.maxDirectionalCasters).toBeUndefined();
    expect(mv.projectShadow!.frustumHalfExtent).not.toBe(7);
  });

  it("prefers HDRI response over ambient in Model View Standard", () => {
    const draft = resolveModelViewLightingQuality("draft");
    const standard = resolveModelViewLightingQuality("standard");
    expect(standard.preferHdri).toBe(true);
    expect(standard.intensityScale).toBeGreaterThan(draft.intensityScale);
    expect(standard.hemisphereScale).toBeLessThan(draft.hemisphereScale);
  });
});
