import type { RenderQuality } from "../interiorProject";
import { getRenderPresetBehavior } from "./renderPresets";

/**
 * Phase B sharpness contract for Model View.
 * MSAA stays on Canvas; DPR stays at preset caps; anisotropy waits for Phase D maps.
 */

export const MODEL_VIEW_MSAA = true as const;

/** Draft stays soft on retina (battery); Standard already 1.5 — no raise without measure. */
export function resolveModelViewMaxDpr(quality: RenderQuality): number {
  const preset = getRenderPresetBehavior(quality);
  if (!preset.modelViewSafe) {
    return getRenderPresetBehavior("standard").pixelRatio;
  }
  return preset.pixelRatio;
}

/** Canvas dpr prop: floor 1, ceiling = Model View max for the viewport quality. */
export function resolveModelViewDprRange(quality: RenderQuality): [number, number] {
  return [1, resolveModelViewMaxDpr(quality)];
}

/**
 * Anisotropy stays at Model View 6 / 10 after Phase D curated maps.
 * Bump only if Standard still reads soft with full normal/rough sets.
 */
export const MODEL_VIEW_ANISOTROPY_FROZEN = {
  draft: 6,
  standard: 10,
} as const;
