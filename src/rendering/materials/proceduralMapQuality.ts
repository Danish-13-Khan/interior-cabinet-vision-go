import type { RenderQuality } from "../../domain/interiorProject";
import type { RenderMode, RenderModeQuality } from "../../domain/livingRoom/renderAssetContracts";
import { textureDetailForRenderMode } from "./materialScale";

function detailLevel(
  mode: RenderMode,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
) {
  return textureDetailForRenderMode(mode, quality, modeQuality);
}

export function woodMapPixelSize(
  mode: RenderMode,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
) {
  return detailLevel(mode, quality, modeQuality) === "high" ? 256 : 128;
}

export function fabricMapPixelSize(
  mode: RenderMode,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
) {
  return detailLevel(mode, quality, modeQuality) === "high" ? 128 : 64;
}

export function noiseMapPixelSize(
  kind: "paint" | "rug",
  mode: RenderMode,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
) {
  const high = detailLevel(mode, quality, modeQuality) === "high";
  if (kind === "paint") return high ? 192 : 96;
  return high ? 160 : 80;
}
