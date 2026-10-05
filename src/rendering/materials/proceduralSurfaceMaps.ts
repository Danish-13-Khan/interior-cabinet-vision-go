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
import { cloneProceduralMaps, placeProceduralMaps } from "./cloneProceduralMaps";
import { glassMaps, glassMapVariantFromName } from "./proceduralGlassMaps";
import { laminateTexture, surfaceFinishIsSolid } from "../../domain/livingRoom/surfaceFinishes";

export type { ProceduralSurfaceMaps };

const cache = new Map<string, ProceduralSurfaceMaps>();

/** Keep the relief and drop the tint: the nap generator's colour map is beige and would stain a white sheet. */
function bumpOnly(maps: ProceduralSurfaceMaps): ProceduralSurfaceMaps {
  maps.map?.dispose();
  return { bumpMap: maps.bumpMap, bumpScale: maps.bumpScale };
}

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
  const key = `${material.materialAssetId}:${material.id}:${material.kind}:${material.name}:${material.surfaceFinish ?? ""}:${mode}:${detail}:${anisotropy}:${material.uvScaleMm}`;
  const cached = cache.get(key);
  if (cached) return placeProceduralMaps(cloneProceduralMaps(cached), material);
  // Laminate and acrylic fronts read as solid colour; extra grain reads as dirt on them.
  const solid = surfaceFinishIsSolid(material.surfaceFinish) || material.kind === "acrylic";
  const glassVariant = material.kind === "glass" ? glassMapVariantFromName(material.name) : null;
  // Suede is a fine even nap; linen is a tight woven emboss. Both keep the sheet's own colour.
  const texture = laminateTexture(material.surfaceFinish);
  const maps = solid ? {} : texture === "suede"
    ? bumpOnly(noiseMaps("rug", material.id, material.uvScaleMm, mode, quality, modeQuality))
    : texture === "linen"
      ? fabricMaps(material.uvScaleMm, mode, true, quality, modeQuality)
      : material.kind === "wood" || material.kind === "laminate"
    ? woodMaps(material.uvScaleMm, mode, quality, modeQuality)
    : material.kind === "fabric"
      ? material.name.toLowerCase().includes("rug")
        ? noiseMaps("rug", material.id, material.uvScaleMm, mode, quality, modeQuality)
        : fabricMaps(material.uvScaleMm, mode, false, quality, modeQuality)
      : material.kind === "paint" || material.kind === "stone" || material.kind === "tile"
        || material.kind === "wallpaper"
        ? noiseMaps("paint", material.id, material.uvScaleMm, mode, quality, modeQuality)
        : glassVariant
          ? glassMaps(glassVariant, material.uvScaleMm, mode, quality, modeQuality)
          : {};
  cache.set(key, maps);
  return placeProceduralMaps(cloneProceduralMaps(maps), material);
}
