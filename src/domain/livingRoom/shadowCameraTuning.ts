import type { RenderQuality } from "../interiorProject";
import { isRichModelViewQuality } from "./modelViewTier";

/** Orthographic directional shadow-camera knobs (meters / bias units). */
export type ShadowCameraTuning = {
  bias: number;
  normalBias: number;
  near: number;
  far: number;
  /** Project directional lights: orthographic half-extent (±meters). */
  frustumHalfExtent?: number;
  /** Window keys: pad override; omit to keep descriptor.shadowPadMeters. */
  padMeters?: number;
  /** Added to EnvironmentLightingQuality.shadowRadius for this light path. */
  radiusExtra: number;
};

/** Shared Studio defaults — Policy B if these constants change. */
export const STUDIO_PROJECT_SHADOW: ShadowCameraTuning = {
  bias: -0.00028,
  normalBias: 0.04,
  near: 0.1,
  far: 30,
  frustumHalfExtent: 7,
  radiusExtra: 2,
};

export const STUDIO_WINDOW_KEY_SHADOW: ShadowCameraTuning = {
  bias: -0.0003,
  normalBias: 0.035,
  near: 0.2,
  far: 28,
  radiusExtra: 1,
};

/**
 * Model View–scoped shadow cameras (Policy A).
 * Every tier above Draft gets the larger frustum + bias for GLB casters; Studio unchanged.
 * The stills scripts pin client-preview, so that tier must match Standard here too.
 */
export function resolveModelViewProjectShadow(
  quality: RenderQuality,
): ShadowCameraTuning {
  const rich = isRichModelViewQuality(quality);
  return {
    ...STUDIO_PROJECT_SHADOW,
    bias: rich ? -0.00034 : -0.00028,
    normalBias: rich ? 0.048 : 0.04,
    frustumHalfExtent: rich ? 8 : 7,
    radiusExtra: rich ? 3 : 2,
  };
}

export function resolveModelViewWindowKeyShadow(
  quality: RenderQuality,
): ShadowCameraTuning {
  const rich = isRichModelViewQuality(quality);
  return {
    ...STUDIO_WINDOW_KEY_SHADOW,
    bias: rich ? -0.00036 : -0.0003,
    normalBias: rich ? 0.04 : 0.035,
    far: rich ? 30 : 28,
    radiusExtra: rich ? 2 : 1,
  };
}
