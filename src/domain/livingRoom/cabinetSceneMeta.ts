import { readCabinetIdentity } from "../cabinetIdentity";
import type { InteriorObjectEntity } from "../interiorProject";
import { isCabinetGeometryFallback } from "./sceneAdaptersCabinet";
import type { CompiledPrimitive } from "./sceneTypes";

export const SHARED_CABINET_GEOMETRY = "shared-cabinet";
export const CABINET_FALLBACK_GEOMETRY = "cabinet-fallback";

export function cabinetSceneMetadata(
  object: InteriorObjectEntity,
  primitives: readonly CompiledPrimitive[],
): Record<string, string | number | boolean> {
  const identity = readCabinetIdentity(object);
  const fallback = isCabinetGeometryFallback(primitives);
  return {
    ...(identity ? { familyId: identity.familyId, cabinetType: identity.cabinetType } : {}),
    geometry: fallback ? CABINET_FALLBACK_GEOMETRY : SHARED_CABINET_GEOMETRY,
    ...(fallback ? { geometryFallback: true } : {}),
  };
}

export function cabinetGeometryFallbackObjectIds(
  objects: readonly InteriorObjectEntity[],
  compileNode: (object: InteriorObjectEntity) => { sourceObjectId: string | null; placeholder: boolean; metadata: Record<string, string | number | boolean> },
): string[] {
  return objects
    .filter((object) => object.kind === "cabinet")
    .map(compileNode)
    .filter((node) => node.placeholder || node.metadata.geometryFallback === true)
    .map((node) => node.sourceObjectId)
    .filter((id): id is string => Boolean(id));
}
