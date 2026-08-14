import type { RenderQuality } from "../interiorProject";
import type { RenderMode } from "./renderAssetContracts";
import { getRenderQualityPreset } from "./renderStudio";
import { resolveGroundingQuality } from "./groundingQuality";

export type EnvironmentLightingQuality = {
  mode: RenderMode;
  resolution: number;
  intensityScale: number;
  shadowMapSize: number;
  shadowRadius: number;
  contactShadowResolution: number;
  contactShadowOpacityScale: number;
  contactShadowBlurScale: number;
  contactShadowFarMeters: number;
  contactShadowFrames: number;
  contactShadowHeightOffsetMeters: number;
  preferHdri: boolean;
  hemisphereScale: number;
};

/**
 * Map renderMode + quality preset into lighting knobs.
 * Draft vs Client Preview must diverge on shadows, HDRI, and contact grounding.
 */
export function resolveEnvironmentLightingQuality(
  mode: RenderMode,
  quality: RenderQuality,
): EnvironmentLightingQuality {
  const preset = getRenderQualityPreset(quality);
  const grounding = resolveGroundingQuality(mode, quality);
  if (mode === "hero") {
    return {
      mode,
      resolution: preset.environmentResolution,
      intensityScale: quality === "draft" ? 1.02 : quality === "standard" ? 1.14 : 1.28,
      shadowMapSize: preset.shadowMapSize,
      shadowRadius: preset.shadowRadius + (quality === "draft" ? 0 : quality === "standard" ? 1 : 2),
      contactShadowResolution: grounding.resolution,
      contactShadowOpacityScale: grounding.opacityScale,
      contactShadowBlurScale: grounding.blurScale,
      contactShadowFarMeters: grounding.farMeters,
      contactShadowFrames: grounding.frames,
      contactShadowHeightOffsetMeters: grounding.heightOffsetMeters,
      preferHdri: quality !== "draft",
      hemisphereScale: quality === "draft" ? 0.58 : 0.48,
    };
  }
  return {
    mode,
    resolution: Math.min(preset.environmentResolution, quality === "draft" ? 64 : 128),
    intensityScale: quality === "draft" ? 0.8 : 0.92,
    shadowMapSize: Math.min(preset.shadowMapSize, quality === "draft" ? 512 : 1024),
    shadowRadius: Math.max(1, preset.shadowRadius - (quality === "draft" ? 2 : 1)),
    contactShadowResolution: grounding.resolution,
    contactShadowOpacityScale: grounding.opacityScale,
    contactShadowBlurScale: grounding.blurScale,
    contactShadowFarMeters: grounding.farMeters,
    contactShadowFrames: grounding.frames,
    contactShadowHeightOffsetMeters: grounding.heightOffsetMeters,
    preferHdri: quality !== "draft",
    hemisphereScale: quality === "draft" ? 0.7 : 0.6,
  };
}
