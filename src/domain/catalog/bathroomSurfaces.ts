import type { InteriorProject } from "../interiorProject";
import { lookupBuiltInCatalogMaterial } from "./catalogLookup";
import { ensureCatalogMaterialSnapshot } from "./materialSnapshots";

export const BATHROOM_TILE_CATALOG_MATERIAL_ID = "material:core:tile-ceramic-soft-gray:v1";

/** Apply wet-room tile floor/wall finishes for the Bathroom catalog template. */
export function finalizeBathroomTemplate(
  project: InteriorProject,
  options: { roomId: string },
): InteriorProject {
  const tile = lookupBuiltInCatalogMaterial(BATHROOM_TILE_CATALOG_MATERIAL_ID);
  if (!tile) {
    throw new Error(`Missing bathroom tile material ${BATHROOM_TILE_CATALOG_MATERIAL_ID}`);
  }
  const ensured = ensureCatalogMaterialSnapshot(project, tile);
  const { materialId } = ensured;
  return {
    ...ensured.project,
    rooms: ensured.project.rooms.map((room) =>
      room.id === options.roomId
        ? {
            ...room,
            extensions: {
              ...room.extensions,
              floorMaterialId: materialId,
            },
          }
        : room
    ),
    walls: ensured.project.walls.map((wall) =>
      wall.roomId === options.roomId ? { ...wall, materialId } : wall
    ),
  };
}
