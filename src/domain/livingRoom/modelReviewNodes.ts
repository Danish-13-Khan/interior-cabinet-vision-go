import type { CompiledSceneNode } from "./sceneTypes";

export type CutawayCameraPosition = { x: number; z: number };
export type CutawayRoomCenter = { x: number; z: number };

/**
 * Pick walls to open for review. Only the near front/back face is cut so
 * left/right end walls stay — kitchen runs need that closer on the side.
 */
export function resolveModelCutawaySides(
  camera: CutawayCameraPosition | null | undefined,
  center: CutawayRoomCenter,
): Set<string> {
  if (!camera) return new Set(["front"]);
  return new Set([camera.z < center.z ? "back" : "front"]);
}

/**
 * Applies architectural cutaway. Openings on cutaway sides are removed unless
 * selected; the selected opening's host wall and any selected wall stay visible.
 */
export function filterModelReviewNodes(
  nodes: readonly CompiledSceneNode[],
  cutawayWalls: boolean,
  cutawaySides: ReadonlySet<string>,
  selectedOpeningId: string | null,
  hideCeiling = false,
  selectedWallId: string | null = null,
): CompiledSceneNode[] {
  if (!cutawayWalls && !hideCeiling) return [...nodes];
  const selectedOpening = selectedOpeningId
    ? nodes.find((node) => node.metadata.openingId === selectedOpeningId)
    : undefined;
  const hostWallId = selectedOpening && typeof selectedOpening.metadata.wallId === "string"
    ? selectedOpening.metadata.wallId
    : null;
  return nodes.filter((node) => {
    if (hideCeiling && node.metadata.surface === "ceiling") return false;
    if (!cutawayWalls) return true;
    if (node.metadata.openingId === selectedOpeningId) return true;
    const role = String(node.metadata.role);
    const wallSide = String(node.metadata.wallSide);
    if (role === "wall" && selectedWallId && node.metadata.wallId === selectedWallId) return true;
    if (hostWallId && role === "wall" && node.metadata.wallId === hostWallId) return true;
    return !["wall", "opening"].includes(role) || !cutawaySides.has(wallSide);
  });
}
