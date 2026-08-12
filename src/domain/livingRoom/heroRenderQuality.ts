import type { RenderQuality } from "../interiorProject";
import type { RenderMode, RenderModeQuality } from "./renderAssetContracts";
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

/** Preview stays light; hero boosts texture/material response for exports only. */
export function getRenderModeQuality(
  mode: RenderMode,
  quality?: RenderQuality,
): RenderModeQuality {
  if (mode === "hero") {
    const textureDetail = quality
      ? getRenderPresetBehavior(quality).textureDetail
      : "high";
    return {
      mode,
      anisotropy: 16,
      textureDetail,
      envMapIntensityScale: 1.22,
      bumpScale: 1.05,
      clearcoatScale: 1.18,
      sheenScale: 1.1,
      specularScale: 1.06,
      roughnessLift: -0.03,
    };
  }
  return {
    mode,
    anisotropy: 4,
    textureDetail: "low",
    envMapIntensityScale: 0.85,
    bumpScale: 0.65,
    clearcoatScale: 1,
    sheenScale: 1,
    specularScale: 1,
    roughnessLift: 0,
  };
}

export function resolveHeroContactShadowTuning(mode: RenderMode): HeroContactShadowTuning {
  if (mode === "hero") {
    return { opacityScale: 0.9, blurScale: 1.2 };
  }
  return { opacityScale: 1, blurScale: 1 };
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
