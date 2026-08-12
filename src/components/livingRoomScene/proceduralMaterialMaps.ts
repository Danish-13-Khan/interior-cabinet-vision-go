import {
  CanvasTexture,
  RepeatWrapping,
  SRGBColorSpace,
  type Texture,
} from "three";
import type { CompiledMaterial } from "../../domain/livingRoom";

type ProceduralMaterialMaps = {
  map?: Texture;
  bumpMap?: Texture;
  bumpScale?: number;
};

const materialMapCache = new Map<string, ProceduralMaterialMaps>();

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

function textureFromCanvas(canvas: HTMLCanvasElement, color = false) {
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(4, 3);
  texture.anisotropy = 8;
  if (color) texture.colorSpace = SRGBColorSpace;
  return texture;
}

function noiseMaps(kind: "paint" | "rug", seed: string): ProceduralMaterialMaps {
  const random = seededRandom(`${kind}:${seed}`);
  const colorCanvas = document.createElement("canvas");
  const bumpCanvas = document.createElement("canvas");
  const size = kind === "paint" ? 192 : 160;
  colorCanvas.width = bumpCanvas.width = size;
  colorCanvas.height = bumpCanvas.height = size;
  const color = colorCanvas.getContext("2d")!;
  const bump = bumpCanvas.getContext("2d")!;
  color.fillStyle = kind === "paint" ? "#f1eee8" : "#d9cfbd";
  color.fillRect(0, 0, size, size);
  bump.fillStyle = "#808080";
  bump.fillRect(0, 0, size, size);

  for (let i = 0; i < size * size * 0.18; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const alpha = kind === "paint" ? 0.035 : 0.06;
    color.fillStyle = random() > 0.5
      ? `rgba(255,255,255,${alpha})`
      : `rgba(72,64,55,${alpha})`;
    color.fillRect(x, y, 1, 1);
    bump.fillStyle = random() > 0.5 ? "#8b8b8b" : "#777777";
    bump.fillRect(x, y, 1, 1);
  }

  const map = textureFromCanvas(colorCanvas, true);
  const bumpMap = textureFromCanvas(bumpCanvas);
  const repeat = kind === "paint" ? 5 : 11;
  map.repeat.set(repeat, repeat);
  bumpMap.repeat.set(repeat, repeat);
  return { map, bumpMap, bumpScale: kind === "paint" ? 0.003 : 0.014 };
}

function woodMaps(): ProceduralMaterialMaps {
  const colorCanvas = document.createElement("canvas");
  const bumpCanvas = document.createElement("canvas");
  colorCanvas.width = bumpCanvas.width = 256;
  colorCanvas.height = bumpCanvas.height = 256;
  const color = colorCanvas.getContext("2d")!;
  const bump = bumpCanvas.getContext("2d")!;
  color.fillStyle = "#eee5d8";
  color.fillRect(0, 0, 256, 256);
  bump.fillStyle = "#808080";
  bump.fillRect(0, 0, 256, 256);

  for (let x = -20; x < 280; x += 6) {
    color.beginPath();
    bump.beginPath();
    for (let y = 0; y <= 256; y += 8) {
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
  const map = textureFromCanvas(colorCanvas, true);
  const bumpMap = textureFromCanvas(bumpCanvas);
  map.repeat.set(7, 3);
  bumpMap.repeat.set(7, 3);
  return {
    map,
    bumpMap,
    bumpScale: 0.008,
  };
}

function fabricMaps(dense: boolean): ProceduralMaterialMaps {
  const colorCanvas = document.createElement("canvas");
  const bumpCanvas = document.createElement("canvas");
  colorCanvas.width = bumpCanvas.width = 128;
  colorCanvas.height = bumpCanvas.height = 128;
  const color = colorCanvas.getContext("2d")!;
  const bump = bumpCanvas.getContext("2d")!;
  color.fillStyle = "#f2efea";
  color.fillRect(0, 0, 128, 128);
  bump.fillStyle = "#777777";
  bump.fillRect(0, 0, 128, 128);
  const spacing = dense ? 3 : 5;
  for (let offset = 0; offset < 128; offset += spacing) {
    color.fillStyle = offset % (spacing * 2) === 0 ? "rgba(255,255,255,0.18)" : "rgba(60,55,48,0.06)";
    color.fillRect(offset, 0, 1, 128);
    color.fillRect(0, offset, 128, 1);
    bump.fillStyle = offset % (spacing * 2) === 0 ? "#929292" : "#6d6d6d";
    bump.fillRect(offset, 0, 1, 128);
    bump.fillRect(0, offset, 128, 1);
  }
  const map = textureFromCanvas(colorCanvas, true);
  const bumpMap = textureFromCanvas(bumpCanvas);
  const repeat = dense ? 14 : 9;
  map.repeat.set(repeat, repeat);
  bumpMap.repeat.set(repeat, repeat);
  return { map, bumpMap, bumpScale: dense ? 0.012 : 0.02 };
}

/** Generate deterministic local surface detail without external texture assets. */
export function getProceduralMaterialMaps(material: CompiledMaterial) {
  const cached = materialMapCache.get(material.id);
  if (cached) return cached;
  const maps = material.kind === "wood" || material.kind === "laminate"
    ? woodMaps()
    : material.kind === "fabric"
      ? material.name.toLowerCase().includes("rug") ? noiseMaps("rug", material.id) : fabricMaps(false)
      : material.kind === "paint"
        ? noiseMaps("paint", material.id)
        : {};
  materialMapCache.set(material.id, maps);
  return maps;
}
