import {
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";
import type { RenderQuality } from "../../domain/interiorProject";
import type { RenderMode, RenderModeQuality } from "../../domain/livingRoom/renderAssetContracts";
import {
  anisotropyForRenderMode,
  textureDetailForRenderMode,
  textureRepeatFromUvScaleMm,
} from "./materialScale";
import {
  fabricMapPixelSize,
  noiseMapPixelSize,
  woodMapPixelSize,
} from "./proceduralMapQuality";

export type ProceduralSurfaceMaps = {
  map?: Texture;
  bumpMap?: Texture;
  bumpScale?: number;
};

function seededRandom(seed: string) {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function finishTexture(
  canvas: HTMLCanvasElement,
  uvScaleMm: number,
  mode: RenderMode,
  colorSpace: boolean,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
) {
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  const repeat = textureRepeatFromUvScaleMm(uvScaleMm);
  texture.repeat.set(repeat.x, repeat.y);
  texture.anisotropy = anisotropyForRenderMode(mode, quality, modeQuality);
  if (colorSpace) texture.colorSpace = SRGBColorSpace;
  return texture;
}

function noiseMaps(
  kind: "paint" | "rug",
  seed: string,
  uvScaleMm: number,
  mode: RenderMode,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
): ProceduralSurfaceMaps {
  const size = noiseMapPixelSize(kind, mode, quality, modeQuality);
  const detail = textureDetailForRenderMode(mode, quality, modeQuality);
  const random = seededRandom(`${kind}:${seed}:${detail}`);
  const colorCanvas = document.createElement("canvas");
  const bumpCanvas = document.createElement("canvas");
  colorCanvas.width = bumpCanvas.width = size;
  colorCanvas.height = bumpCanvas.height = size;
  const color = colorCanvas.getContext("2d")!;
  const bump = bumpCanvas.getContext("2d")!;
  color.fillStyle = kind === "paint" ? "#f1eee8" : "#d9cfbd";
  color.fillRect(0, 0, size, size);
  bump.fillStyle = "#808080";
  bump.fillRect(0, 0, size, size);
  for (let i = 0; i < size * size * (detail === "high" ? 0.18 : 0.1); i += 1) {
    const x = random() * size;
    const y = random() * size;
    const alpha = kind === "paint" ? 0.035 : 0.06;
    color.fillStyle = random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(72,64,55,${alpha})`;
    color.fillRect(x, y, 1, 1);
    bump.fillStyle = random() > 0.5 ? "#8b8b8b" : "#777777";
    bump.fillRect(x, y, 1, 1);
  }
  return {
    map: finishTexture(colorCanvas, uvScaleMm, mode, true, quality, modeQuality),
    bumpMap: finishTexture(bumpCanvas, uvScaleMm, mode, false, quality, modeQuality),
    bumpScale: kind === "paint" ? 0.003 : 0.014,
  };
}

export function woodMaps(
  uvScaleMm: number,
  mode: RenderMode,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
): ProceduralSurfaceMaps {
  const size = woodMapPixelSize(mode, quality, modeQuality);
  const colorCanvas = document.createElement("canvas");
  const bumpCanvas = document.createElement("canvas");
  colorCanvas.width = bumpCanvas.width = size;
  colorCanvas.height = bumpCanvas.height = size;
  const color = colorCanvas.getContext("2d")!;
  const bump = bumpCanvas.getContext("2d")!;
  color.fillStyle = "#eee5d8";
  color.fillRect(0, 0, size, size);
  bump.fillStyle = "#808080";
  bump.fillRect(0, 0, size, size);
  for (let x = -20; x < size + 24; x += 6) {
    color.beginPath();
    bump.beginPath();
    for (let y = 0; y <= size; y += 8) {
      const wave = Math.sin(y * 0.055 + x * 0.12) * 0.8 + Math.sin(y * 0.017) * 0.45;
      if (y === 0) {
        color.moveTo(x + wave, y);
        bump.moveTo(x + wave, y);
      } else {
        color.lineTo(x + wave, y);
        bump.lineTo(x + wave, y);
      }
    }
    color.strokeStyle = x % 18 === 0 ? "rgba(104,74,43,0.16)" : "rgba(92,66,42,0.06)";
    color.lineWidth = x % 18 === 0 ? 1.1 : 0.65;
    color.stroke();
    bump.strokeStyle = x % 14 === 0 ? "#949494" : "#898989";
    bump.lineWidth = 1;
    bump.stroke();
  }
  return {
    map: finishTexture(colorCanvas, uvScaleMm, mode, true, quality, modeQuality),
    bumpMap: finishTexture(bumpCanvas, uvScaleMm, mode, false, quality, modeQuality),
    bumpScale: 0.008,
  };
}

export function fabricMaps(
  uvScaleMm: number,
  mode: RenderMode,
  dense: boolean,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
): ProceduralSurfaceMaps {
  const size = fabricMapPixelSize(mode, quality, modeQuality);
  const colorCanvas = document.createElement("canvas");
  const bumpCanvas = document.createElement("canvas");
  colorCanvas.width = bumpCanvas.width = size;
  colorCanvas.height = bumpCanvas.height = size;
  const color = colorCanvas.getContext("2d")!;
  const bump = bumpCanvas.getContext("2d")!;
  color.fillStyle = "#f2efea";
  color.fillRect(0, 0, size, size);
  bump.fillStyle = "#777777";
  bump.fillRect(0, 0, size, size);
  const spacing = dense ? 3 : 5;
  for (let offset = 0; offset < size; offset += spacing) {
    color.fillStyle = offset % (spacing * 2) === 0 ? "rgba(255,255,255,0.18)" : "rgba(60,55,48,0.06)";
    color.fillRect(offset, 0, 1, size);
    color.fillRect(0, offset, size, 1);
    bump.fillStyle = offset % (spacing * 2) === 0 ? "#929292" : "#6d6d6d";
    bump.fillRect(offset, 0, 1, size);
    bump.fillRect(0, offset, size, 1);
  }
  return {
    map: finishTexture(colorCanvas, uvScaleMm, mode, true, quality, modeQuality),
    bumpMap: finishTexture(bumpCanvas, uvScaleMm, mode, false, quality, modeQuality),
    bumpScale: dense ? 0.012 : 0.02,
  };
}

export { noiseMaps };
