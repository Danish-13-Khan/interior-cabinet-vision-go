import type { RenderQuality } from "../interiorProject";
import type { RenderMode } from "./renderAssetContracts";
import { getRenderQualityPreset } from "./renderStudio";

export type EnvironmentLightingQuality = {
  mode: RenderMode;
  resolution: number;
  intensityScale: number;
  shadowMapSize: number;
  shadowRadius: number;
  contactShadowResolution: number;
  preferHdri: boolean;
  hemisphereScale: number;
};

/** Preview stays light; hero prefers HDRI + softer/higher-res shadows. */
export function resolveEnvironmentLightingQuality(
  mode: RenderMode,
  quality: RenderQuality,
): EnvironmentLightingQuality {
  const preset = getRenderQualityPreset(quality);
  if (mode === "hero") {
    return {
      mode,
      resolution: Math.max(preset.environmentResolution, 256),
      intensityScale: 1.2,
      shadowMapSize: preset.shadowMapSize,
      shadowRadius: preset.shadowRadius + 2,
      contactShadowResolution: preset.contactShadowResolution,
      preferHdri: true,
      hemisphereScale: 0.55,
    };
  }
  return {
    mode,
    resolution: Math.min(preset.environmentResolution, 128),
    intensityScale: 0.88,
    shadowMapSize: Math.min(preset.shadowMapSize, 1024),
    shadowRadius: Math.max(1, preset.shadowRadius - 1),
    contactShadowResolution: Math.min(preset.contactShadowResolution, 512),
    preferHdri: quality !== "draft",
    hemisphereScale: 0.64,
  };
}
