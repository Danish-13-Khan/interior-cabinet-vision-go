import type { RenderQuality } from "../interiorProject";
import type { EnvironmentLightingQuality } from "./environmentLightingQuality";
import { resolveEnvironmentLightingQuality } from "./environmentLightingQuality";
import {
  describePresetHonesty,
  type PresetHonestyDescription,
} from "./presetHonesty";
import type { RenderMode, RenderModeQuality } from "./renderAssetContracts";
import {
  resolveModelViewProjectShadow,
  resolveModelViewWindowKeyShadow,
} from "./shadowCameraTuning";
import { resolveGlbCastShadow } from "./glbCastShadow";
import {
  MODEL_VIEW_MSAA,
  resolveModelViewMaxDpr,
} from "./modelViewSharpness";

/** Model view never uses hero/photoreal — review stays honest preview. */
export function resolveModelViewRenderMode(): RenderMode {
  return "preview";
}

/**
 * Soft studio lighting for 3D review — designed, not client export.
 * Prefer HDRI (preferHdri) over ambient: slightly lower hemisphere, higher IBL scale.
 * After Standard GLB castShadow, contact scales stay lighter so map + contact
 * do not double-muddy the floor (Policy A shadow cameras attached).
 */
export function resolveModelViewLightingQuality(
  quality: RenderQuality,
): EnvironmentLightingQuality {
  const base = resolveEnvironmentLightingQuality("preview", quality);
  const rich = quality === "standard";
  return {
    ...base,
    intensityScale: rich ? 1.06 : 0.94,
    shadowMapSize: rich ? Math.max(base.shadowMapSize, 768) : 640,
    shadowRadius: base.shadowRadius + (rich ? 3 : 2),
    contactShadowOpacityScale: rich ? 1.08 : 1.1,
    contactShadowBlurScale: rich ? 1.05 : 1.14,
    hemisphereScale: rich ? 0.68 : 0.78,
    preferHdri: true,
    projectShadow: resolveModelViewProjectShadow(quality),
    windowKeyShadow: resolveModelViewWindowKeyShadow(quality),
    maxDirectionalCasters: rich ? 2 : 1,
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
    envMapIntensityScale: rich ? 1.1 : 0.96,
    bumpScale: rich ? 0.84 : 0.7,
    clearcoatScale: rich ? 1.16 : 1.1,
    sheenScale: rich ? 1.14 : 1.08,
    specularScale: rich ? 1.05 : 1.02,
    roughnessLift: rich ? -0.02 : -0.01,
  };
}

export function modelViewProjectLightScale(quality: RenderQuality) {
  return quality === "standard" ? 0.92 : 0.86;
}

export function modelViewWindowKeyScale(quality: RenderQuality) {
  return quality === "standard" ? 1.05 : 0.98;
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
  glbCastShadow: boolean;
  projectShadowFrustum: number | undefined;
  maxDpr: number;
  msaa: boolean;
  maxDirectionalCasters: number | undefined;
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
    glbCastShadow: resolveGlbCastShadow({
      renderMode: "preview",
      modelViewPreview: true,
      modelViewQuality: quality,
    }),
    projectShadowFrustum: lighting.projectShadow?.frustumHalfExtent,
    maxDpr: resolveModelViewMaxDpr(quality),
    msaa: MODEL_VIEW_MSAA,
    maxDirectionalCasters: lighting.maxDirectionalCasters,
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
