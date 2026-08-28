import type { RenderQuality } from "../../domain/interiorProject";
import type { RenderMode, RenderModeQuality } from "../../domain/livingRoom/renderAssetContracts";
import { getRenderModeQuality } from "../../domain/livingRoom/heroRenderQuality";

function resolveModeQuality(
  mode: RenderMode,
  quality?: RenderQuality,
  override?: RenderModeQuality,
): RenderModeQuality {
  return override ?? getRenderModeQuality(mode, quality);
}

/** Convert millimetre tile size into Three.js texture repeat factors. */
export function textureRepeatFromUvScaleMm(uvScaleMm: number, axisMm = 1000) {
  const scale = Math.max(120, uvScaleMm);
  const repeat = axisMm / scale;
  return {
    x: Math.max(0.35, repeat),
    y: Math.max(0.35, repeat * 0.85),
  };
}

export function anisotropyForRenderMode(
  mode: RenderMode,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
) {
  return resolveModeQuality(mode, quality, modeQuality).anisotropy;
}

export function bumpScaleForRenderMode(
  mode: RenderMode,
  base = 0.01,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
) {
  return base * resolveModeQuality(mode, quality, modeQuality).bumpScale;
}

export function envIntensityForRenderMode(
  mode: RenderMode,
  base: number,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
) {
  return base * resolveModeQuality(mode, quality, modeQuality).envMapIntensityScale;
}

export function clearcoatForRenderMode(
  mode: RenderMode,
  base: number,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
) {
  return base * resolveModeQuality(mode, quality, modeQuality).clearcoatScale;
}

export function sheenForRenderMode(
  mode: RenderMode,
  base: number,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
) {
  return base * resolveModeQuality(mode, quality, modeQuality).sheenScale;
}

export function specularForRenderMode(
  mode: RenderMode,
  base: number,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
) {
  return base * resolveModeQuality(mode, quality, modeQuality).specularScale;
}

export function roughnessForRenderMode(
  mode: RenderMode,
  base: number,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
) {
  const lift = resolveModeQuality(mode, quality, modeQuality).roughnessLift;
  return Math.min(1, Math.max(0.02, base + lift));
}

export function textureDetailForRenderMode(
  mode: RenderMode,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
) {
  return resolveModeQuality(mode, quality, modeQuality).textureDetail;
}
