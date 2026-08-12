import type { RenderQuality } from "../interiorProject";
import type { RenderMode, RenderModeQuality } from "./renderAssetContracts";

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

const BASE_RENDER_SCALE: Record<RenderQuality, number> = {
  draft: 1,
  standard: 1.25,
  presentation: 1.5,
};

/** Preview stays light; hero boosts texture/material response for exports only. */
export function getRenderModeQuality(mode: RenderMode): RenderModeQuality {
  if (mode === "hero") {
    return {
      mode,
      anisotropy: 16,
      textureDetail: "high",
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
  return BASE_RENDER_SCALE[quality] * resolveHeroCaptureTuning(mode, quality).renderScaleBoost;
}
