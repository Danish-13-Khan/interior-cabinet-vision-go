import type { CompiledMaterial } from "../../domain/livingRoom";
import { grainRotationDeg } from "./grainRotation";
import type { ProceduralSurfaceMaps } from "./proceduralMapGenerators";

/** Clone cached maps so grain and UV edits cannot leak across materials. */
export function cloneProceduralMaps(maps: ProceduralSurfaceMaps): ProceduralSurfaceMaps {
  return {
    ...(maps.map ? { map: maps.map.clone() } : {}),
    ...(maps.bumpMap ? { bumpMap: maps.bumpMap.clone() } : {}),
    ...(maps.bumpScale !== undefined ? { bumpScale: maps.bumpScale } : {}),
  };
}

/** Apply authored rotation, grain quarter-turn and offset to a cloned map set. */
export function placeProceduralMaps(
  maps: ProceduralSurfaceMaps,
  material: CompiledMaterial,
): ProceduralSurfaceMaps {
  const rotation = (grainRotationDeg(material) * Math.PI) / 180;
  const offsetU = material.uvOffsetU ?? 0;
  const offsetV = material.uvOffsetV ?? 0;
  for (const texture of [maps.map, maps.bumpMap]) {
    if (!texture) continue;
    texture.center.set(0.5, 0.5);
    texture.rotation = rotation;
    texture.offset.set(offsetU, offsetV);
  }
  return maps;
}
