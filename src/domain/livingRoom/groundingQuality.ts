import type { RenderQuality } from "../interiorProject";
import type { RenderMode } from "./renderAssetContracts";
import { getRenderPresetBehavior } from "./renderPresets";

export type GroundingQuality = {
  opacityScale: number;
  blurScale: number;
  resolution: number;
  farMeters: number;
  frames: number;
  heightOffsetMeters: number;
};

const LADDER: Record<
  RenderQuality,
  { opacity: number; blur: number; far: number }
> = {
  draft: { opacity: 0.52, blur: 1.02, far: 2.6 },
  standard: { opacity: 0.7, blur: 1.12, far: 3.4 },
  presentation: { opacity: 0.9, blur: 1.24, far: 4.3 },
  "client-preview": { opacity: 0.94, blur: 1.18, far: 4.0 },
};

/**
 * Contact-shadow grounding by preset.
 * Draft stays light/fast; Client Preview must visibly pin furniture to the floor.
 */
export function resolveGroundingQuality(
  mode: RenderMode,
  quality: RenderQuality,
): GroundingQuality {
  const preset = getRenderPresetBehavior(quality);
  const rung = LADDER[quality] ?? LADDER.standard;
  const previewCap = quality === "draft" ? 256 : 512;
  const resolution = mode === "hero"
    ? preset.contactShadowResolution
    : Math.min(preset.contactShadowResolution, previewCap);
  const modeScale = mode === "hero" ? 1 : 0.82;
  return {
    opacityScale: rung.opacity * modeScale,
    blurScale: rung.blur,
    resolution,
    farMeters: rung.far,
    frames: 1,
    heightOffsetMeters: 0.004,
  };
}
