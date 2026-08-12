import type { RenderQuality } from "../../domain/interiorProject";
import type { RenderMode } from "../../domain/livingRoom/renderAssetContracts";
import { getRenderModeQuality } from "../../domain/livingRoom/heroRenderQuality";

/** Convert millimetre tile size into Three.js texture repeat factors. */
export function textureRepeatFromUvScaleMm(uvScaleMm: number, axisMm = 1000) {
  const scale = Math.max(120, uvScaleMm);
  const repeat = axisMm / scale;
  return {
    x: Math.max(0.35, repeat),
    y: Math.max(0.35, repeat * 0.85),
  };
}

export function anisotropyForRenderMode(mode: RenderMode, quality?: RenderQuality) {
  return getRenderModeQuality(mode, quality).anisotropy;
}

export function bumpScaleForRenderMode(
  mode: RenderMode,
  base = 0.01,
  quality?: RenderQuality,
) {
  return base * getRenderModeQuality(mode, quality).bumpScale;
}

export function envIntensityForRenderMode(
  mode: RenderMode,
  base: number,
  quality?: RenderQuality,
) {
  return base * getRenderModeQuality(mode, quality).envMapIntensityScale;
}

export function clearcoatForRenderMode(
  mode: RenderMode,
  base: number,
  quality?: RenderQuality,
) {
  return base * getRenderModeQuality(mode, quality).clearcoatScale;
}

export function sheenForRenderMode(
  mode: RenderMode,
  base: number,
  quality?: RenderQuality,
) {
  return base * getRenderModeQuality(mode, quality).sheenScale;
}

export function specularForRenderMode(
  mode: RenderMode,
  base: number,
  quality?: RenderQuality,
) {
  return base * getRenderModeQuality(mode, quality).specularScale;
}

export function roughnessForRenderMode(
  mode: RenderMode,
  base: number,
  quality?: RenderQuality,
) {
  const lift = getRenderModeQuality(mode, quality).roughnessLift;
  return Math.min(1, Math.max(0.02, base + lift));
}

export function textureDetailForRenderMode(
  mode: RenderMode,
  quality?: RenderQuality,
) {
  return getRenderModeQuality(mode, quality).textureDetail;
}
