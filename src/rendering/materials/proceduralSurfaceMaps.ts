import type { CompiledMaterial } from "../../domain/livingRoom";
import type { RenderQuality } from "../../domain/interiorProject";
import type { RenderMode, RenderModeQuality } from "../../domain/livingRoom/renderAssetContracts";
import {
  anisotropyForRenderMode,
  textureDetailForRenderMode,
} from "./materialScale";
import {
  fabricMaps,
  noiseMaps,
  woodMaps,
  type ProceduralSurfaceMaps,
} from "./proceduralMapGenerators";

export type { ProceduralSurfaceMaps };

const cache = new Map<string, ProceduralSurfaceMaps>();

/** Deterministic local surface detail routed through the material asset contract. */
export function createProceduralSurfaceMaps(
  material: CompiledMaterial,
  mode: RenderMode,
  quality?: RenderQuality,
  modeQuality?: RenderModeQuality,
): ProceduralSurfaceMaps {
  if (typeof document === "undefined") return {};
  const detail = textureDetailForRenderMode(mode, quality, modeQuality);
  const anisotropy = anisotropyForRenderMode(mode, quality, modeQuality);
  const key = `${material.materialAssetId}:${mode}:${detail}:${anisotropy}:${material.uvScaleMm}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const maps = material.kind === "wood" || material.kind === "laminate"
    ? woodMaps(material.uvScaleMm, mode, quality, modeQuality)
    : material.kind === "fabric"
      ? material.name.toLowerCase().includes("rug")
        ? noiseMaps("rug", material.id, material.uvScaleMm, mode, quality, modeQuality)
        : fabricMaps(material.uvScaleMm, mode, false, quality, modeQuality)
      : material.kind === "paint"
        ? noiseMaps("paint", material.id, material.uvScaleMm, mode, quality, modeQuality)
        : {};
  cache.set(key, maps);
  return maps;
}
