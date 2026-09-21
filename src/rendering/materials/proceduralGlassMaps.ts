import type { RenderQuality } from "../../domain/interiorProject";
import type { RenderMode, RenderModeQuality } from "../../domain/livingRoom/renderAssetContracts";
import { textureDetailForRenderMode } from "./materialScale";
import { noiseMapPixelSize } from "./proceduralMapQuality";
import { finishTexture, type ProceduralSurfaceMaps } from "./proceduralMapGenerators";

export type GlassMapVariant = "fluted" | "rough";

export function glassMapVariantFromName(name: string): GlassMapVariant | null {
  const lower = name.toLowerCase();
  if (lower.includes("fluted")) return "fluted";
  if (lower.includes("rough")) return "rough";
  return null;
}

export function glassMaps(
  variant: GlassMapVariant,
  uvScaleMm: number,
  mode: RenderMode,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
): ProceduralSurfaceMaps {
  const size = noiseMapPixelSize("paint", mode, quality, modeQuality);
  const colorCanvas = document.createElement("canvas");
  const bumpCanvas = document.createElement("canvas");
  colorCanvas.width = bumpCanvas.width = size;
  colorCanvas.height = bumpCanvas.height = size;
  const color = colorCanvas.getContext("2d")!;
  const bump = bumpCanvas.getContext("2d")!;
  color.fillStyle = "#f2f6f5";
  color.fillRect(0, 0, size, size);
  bump.fillStyle = "#808080";
  bump.fillRect(0, 0, size, size);
  if (variant === "fluted") {
    paintFlutedRibs(color, bump, size);
  } else {
    paintRoughNoise(color, bump, size, textureDetailForRenderMode(mode, quality, modeQuality) === "high");
  }
  return {
    map: finishTexture(colorCanvas, uvScaleMm, mode, true, quality, modeQuality),
    bumpMap: finishTexture(bumpCanvas, uvScaleMm, mode, false, quality, modeQuality),
    bumpScale: variant === "fluted" ? 0.028 : 0.018,
  };
}

function paintFlutedRibs(
  color: CanvasRenderingContext2D,
  bump: CanvasRenderingContext2D,
  size: number,
) {
  const pitch = Math.max(4, Math.round(size / 18));
  for (let x = 0; x < size; x += pitch) {
    color.fillStyle = "rgba(255,255,255,0.16)";
    color.fillRect(x, 0, 1, size);
    color.fillStyle = "rgba(90,110,108,0.08)";
    color.fillRect(x + Math.floor(pitch * 0.45), 0, Math.max(1, pitch - 2), size);
    bump.fillStyle = "#9a9a9a";
    bump.fillRect(x, 0, 2, size);
    bump.fillStyle = "#6e6e6e";
    bump.fillRect(x + Math.floor(pitch * 0.4), 0, Math.max(1, pitch - 3), size);
  }
}

/** Deterministic 0..1 hash so every texel gets independent roughness. */
export function roughGlassNoiseAt(x: number, y: number): number {
  let n = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function clampByte(value: number) {
  return Math.max(0, Math.min(255, value));
}

function paintRoughNoise(
  color: CanvasRenderingContext2D,
  bump: CanvasRenderingContext2D,
  size: number,
  highDetail: boolean,
) {
  const colorImg = color.getImageData(0, 0, size, size);
  const bumpImg = bump.getImageData(0, 0, size, size);
  const amp = highDetail ? 18 : 12;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const delta = Math.round((roughGlassNoiseAt(x, y) - 0.5) * 2 * amp);
      const i = (y * size + x) * 4;
      colorImg.data[i] = clampByte(colorImg.data[i] + delta);
      colorImg.data[i + 1] = clampByte(colorImg.data[i + 1] + delta);
      colorImg.data[i + 2] = clampByte(colorImg.data[i + 2] + delta);
      const bumpValue = clampByte(128 + delta);
      bumpImg.data[i] = bumpValue;
      bumpImg.data[i + 1] = bumpValue;
      bumpImg.data[i + 2] = bumpValue;
      bumpImg.data[i + 3] = 255;
    }
  }
  color.putImageData(colorImg, 0, 0);
  bump.putImageData(bumpImg, 0, 0);
}
