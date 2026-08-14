import type { RenderQuality } from "../interiorProject";
import type { RenderMode, RenderModeQuality } from "./renderAssetContracts";
import { resolveGroundingQuality } from "./groundingQuality";
import { getRenderPresetBehavior } from "./renderPresets";

export type HeroCaptureTuning = {
  renderScaleBoost: number;
  exportContrast: number;
  exportSaturation: number;
  vignetteStrength: number;
};

export type HeroContactShadowTuning = {
  opacityScale: number;
  blurScale: number;
};

/** Preview stays light; hero + richer presets boost texture/material response. */
export function getRenderModeQuality(
  mode: RenderMode,
  quality?: RenderQuality,
): RenderModeQuality {
  if (mode === "hero") {
    const textureDetail = quality
      ? getRenderPresetBehavior(quality).textureDetail
      : "high";
    const isDraft = quality === "draft";
    return {
      mode,
      anisotropy: isDraft ? 8 : 16,
      textureDetail,
      envMapIntensityScale: isDraft ? 1.05 : 1.22,
      bumpScale: isDraft ? 0.85 : 1.05,
      clearcoatScale: isDraft ? 1.06 : 1.18,
      sheenScale: isDraft ? 1.04 : 1.1,
      specularScale: isDraft ? 1.02 : 1.06,
      roughnessLift: isDraft ? -0.01 : -0.03,
    };
  }
  const isDraft = !quality || quality === "draft";
  return {
    mode,
    anisotropy: isDraft ? 4 : 8,
    textureDetail: "low",
    envMapIntensityScale: isDraft ? 0.78 : 0.9,
    bumpScale: isDraft ? 0.55 : 0.72,
    clearcoatScale: 1,
    sheenScale: 1,
    specularScale: 1,
    roughnessLift: isDraft ? 0.02 : 0,
  };
}

/** @deprecated Prefer resolveGroundingQuality — kept for call-site compatibility. */
export function resolveHeroContactShadowTuning(
  mode: RenderMode,
  quality: RenderQuality = "standard",
): HeroContactShadowTuning {
  const grounding = resolveGroundingQuality(mode, quality);
  return {
    opacityScale: grounding.opacityScale,
    blurScale: grounding.blurScale,
  };
}

/** Hero-only PNG capture polish — never written into InteriorProject JSON. */
export function resolveHeroCaptureTuning(
  mode: RenderMode,
  quality: RenderQuality,
): HeroCaptureTuning {
  if (mode !== "hero") {
    return {
      renderScaleBoost: 1,
      exportContrast: 1,
      exportSaturation: 1,
      vignetteStrength: 0,
    };
  }
  if (quality === "presentation") {
    return {
      renderScaleBoost: 1.12,
      exportContrast: 1.05,
      exportSaturation: 1.04,
      vignetteStrength: 0.11,
    };
  }
  if (quality === "client-preview") {
    return {
      renderScaleBoost: 1.08,
      exportContrast: 1.04,
      exportSaturation: 1.03,
      vignetteStrength: 0.09,
    };
  }
  if (quality === "standard") {
    return {
      renderScaleBoost: 1.06,
      exportContrast: 1.03,
      exportSaturation: 1.025,
      vignetteStrength: 0.07,
    };
  }
  return {
    renderScaleBoost: 1.02,
    exportContrast: 1.015,
    exportSaturation: 1.01,
    vignetteStrength: 0.04,
  };
}

export function resolveHeroRenderScale(
  mode: RenderMode,
  quality: RenderQuality,
) {
  const base = getRenderPresetBehavior(quality).renderScale;
  return base * resolveHeroCaptureTuning(mode, quality).renderScaleBoost;
}
