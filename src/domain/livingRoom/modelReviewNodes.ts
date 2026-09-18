import type { CompiledSceneNode } from "./sceneTypes";

export type CutawayCameraPosition = { x: number; z: number };
export type CutawayRoomCenter = { x: number; z: number };

/**
 * Hide the nearest envelope wall so orbiting a side does not leave that wall
 * blocking the room. Kitchen runs on the far side stay visible.
 */
export function resolveModelCutawaySides(
  camera: CutawayCameraPosition | null | undefined,
  center: CutawayRoomCenter,
): Set<string> {
  if (!camera) return new Set(["front"]);
  const dx = camera.x - center.x;
  const dz = camera.z - center.z;
  if (Math.abs(dx) > Math.abs(dz)) {
    return new Set([dx < 0 ? "left" : "right"]);
  }
  return new Set([dz < 0 ? "back" : "front"]);
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
