import type { RenderQuality } from "../interiorProject";
import type { RenderMode } from "./renderAssetContracts";
import { getRenderQualityPreset } from "./renderStudio";
import { resolveHeroContactShadowTuning } from "./heroRenderQuality";

export type EnvironmentLightingQuality = {
  mode: RenderMode;
  resolution: number;
  intensityScale: number;
  shadowMapSize: number;
  shadowRadius: number;
  contactShadowResolution: number;
  contactShadowOpacityScale: number;
  contactShadowBlurScale: number;
  preferHdri: boolean;
  hemisphereScale: number;
};

/**
 * Map renderMode + quality preset into lighting knobs.
 * Preset shadow/env values are honored (no longer flattened to presentation max).
 */
export function resolveEnvironmentLightingQuality(
  mode: RenderMode,
  quality: RenderQuality,
): EnvironmentLightingQuality {
  const preset = getRenderQualityPreset(quality);
  const contact = resolveHeroContactShadowTuning(mode);
  if (mode === "hero") {
    return {
      mode,
      resolution: preset.environmentResolution,
      intensityScale: quality === "draft" ? 1.05 : 1.25,
      shadowMapSize: preset.shadowMapSize,
      shadowRadius: preset.shadowRadius + (quality === "draft" ? 1 : 2),
      contactShadowResolution: preset.contactShadowResolution,
      contactShadowOpacityScale: contact.opacityScale,
      contactShadowBlurScale: contact.blurScale,
      preferHdri: quality !== "draft",
      hemisphereScale: 0.5,
    };
  }
  return {
    mode,
    resolution: Math.min(preset.environmentResolution, 128),
    intensityScale: 0.88,
    shadowMapSize: Math.min(preset.shadowMapSize, 1024),
    shadowRadius: Math.max(1, preset.shadowRadius - 1),
    contactShadowResolution: Math.min(preset.contactShadowResolution, 512),
    contactShadowOpacityScale: contact.opacityScale,
    contactShadowBlurScale: contact.blurScale,
    preferHdri: quality !== "draft",
    hemisphereScale: 0.64,
  };
}
