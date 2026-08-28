import type { RenderQuality } from "../interiorProject";
import type { EnvironmentLightingQuality } from "./environmentLightingQuality";
import { resolveEnvironmentLightingQuality } from "./environmentLightingQuality";
import {
  describePresetHonesty,
  type PresetHonestyDescription,
} from "./presetHonesty";
import type { RenderMode, RenderModeQuality } from "./renderAssetContracts";

/** Model view never uses hero/photoreal — review stays honest preview. */
export function resolveModelViewRenderMode(): RenderMode {
  return "preview";
}

/** Soft studio lighting tuned for 3D review — designed, not client export. */
export function resolveModelViewLightingQuality(
  quality: RenderQuality,
): EnvironmentLightingQuality {
  const base = resolveEnvironmentLightingQuality("preview", quality);
  const rich = quality === "standard";
  return {
    ...base,
    intensityScale: rich ? 0.98 : 0.9,
    shadowMapSize: rich ? Math.max(base.shadowMapSize, 768) : 640,
    shadowRadius: base.shadowRadius + (rich ? 3 : 2),
    contactShadowOpacityScale: rich ? 1.2 : 1.1,
    contactShadowBlurScale: rich ? 1.1 : 1.14,
    hemisphereScale: rich ? 0.78 : 0.84,
    preferHdri: true,
  };
}

/** Material response for model view — readable finishes without hero polish. */
export function resolveModelViewMaterialQuality(
  quality: RenderQuality,
): RenderModeQuality {
  const rich = quality === "standard";
  return {
    mode: "preview",
    anisotropy: rich ? 10 : 6,
    textureDetail: rich ? "high" : "low",
    envMapIntensityScale: rich ? 1.06 : 0.94,
    bumpScale: rich ? 0.84 : 0.7,
    clearcoatScale: rich ? 1.16 : 1.1,
    sheenScale: rich ? 1.14 : 1.08,
    specularScale: rich ? 1.05 : 1.02,
    roughnessLift: rich ? -0.02 : -0.01,
  };
}

export function modelViewProjectLightScale(quality: RenderQuality) {
  return quality === "standard" ? 0.94 : 0.88;
}

export function modelViewWindowKeyScale(quality: RenderQuality) {
  return quality === "standard" ? 1.08 : 0.98;
}

export type ModelViewMaterialBuildContext = {
  quality?: RenderQuality;
  modeQuality?: RenderModeQuality;
  modelViewPreview: boolean;
};

/** Resolve material options for model-view vs render-studio paths. */
export function resolveModelViewMaterialBuildContext(
  modelViewQuality: RenderQuality | null | undefined,
  renderQuality?: RenderQuality,
): ModelViewMaterialBuildContext {
  if (!modelViewQuality) {
    return { quality: renderQuality, modeQuality: undefined, modelViewPreview: false };
  }
  return {
    quality: modelViewQuality,
    modeQuality: resolveModelViewMaterialQuality(modelViewQuality),
    modelViewPreview: true,
  };
}

export type ModelViewRuntimeProfile = {
  renderMode: RenderMode;
  quality: RenderQuality;
  textureDetail: RenderModeQuality["textureDetail"];
  shadowMapSize: number;
  envMapIntensityScale: number;
  projectLightScale: number;
  windowKeyScale: number;
  anisotropy: number;
  proceduralMapWidth: number;
  modelViewPreview: boolean;
};

/** Stable runtime metadata for tests and diagnostics — not persisted on project JSON. */
export function describeModelViewRuntimeProfile(
  quality: RenderQuality,
): ModelViewRuntimeProfile {
  const material = resolveModelViewMaterialQuality(quality);
  const lighting = resolveModelViewLightingQuality(quality);
  return {
    renderMode: "preview",
    quality,
    textureDetail: material.textureDetail,
    shadowMapSize: lighting.shadowMapSize,
    envMapIntensityScale: material.envMapIntensityScale,
    projectLightScale: modelViewProjectLightScale(quality),
    windowKeyScale: modelViewWindowKeyScale(quality),
    anisotropy: material.anisotropy,
    proceduralMapWidth: material.textureDetail === "high" ? 256 : 128,
    modelViewPreview: true,
  };
}

/** Honesty copy for interactive review — preview tier, not render export. */
export function describeModelViewHonesty(
  quality: RenderQuality,
): PresetHonestyDescription {
  const base = describePresetHonesty(quality, "preview");
  const rich = quality === "standard";
  return {
    ...base,
    mode: "preview",
    role: "balanced",
    headline: rich ? "Rich Preview" : "Designed Preview",
    subline: "Soft studio lighting · interactive review · not client export",
    shortBadge: `${base.qualityName.toUpperCase()} · PREVIEW`,
  };
}
