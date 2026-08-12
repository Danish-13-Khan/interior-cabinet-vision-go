import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { getRenderModeQuality } from "../../domain/livingRoom/renderAssetBindings";

/** Convert millimetre tile size into Three.js texture repeat factors. */
export function textureRepeatFromUvScaleMm(uvScaleMm: number, axisMm = 1000) {
  const scale = Math.max(120, uvScaleMm);
  const repeat = axisMm / scale;
  return {
    x: Math.max(0.35, repeat),
    y: Math.max(0.35, repeat * 0.85),
  };
}

export function anisotropyForRenderMode(mode: RenderMode) {
  return getRenderModeQuality(mode).anisotropy;
}

export function bumpScaleForRenderMode(mode: RenderMode, base = 0.01) {
  return base * getRenderModeQuality(mode).bumpScale;
}

export function envIntensityForRenderMode(mode: RenderMode, base: number) {
  return base * getRenderModeQuality(mode).envMapIntensityScale;
}
