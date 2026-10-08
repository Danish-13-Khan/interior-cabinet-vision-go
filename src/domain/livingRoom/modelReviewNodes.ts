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
 * Exterior presets hide the ceiling so the shell is open. Walkthrough stays
 * enclosed, and the toolbar's Ceiling toggle (`showCeiling`) keeps it in any preset.
 */
export function modelViewHidesCeiling(preset: string | undefined, showCeiling = false) {
  if (showCeiling) return false;
  return Boolean(preset) && preset !== "walkthrough";
}

/** Eye-level exterior views cut the near wall; overhead presets already see the floor. */
export function modelViewCutsNearWall(preset: string | undefined) {
  return preset === "perspective" || preset === "front" || preset === "side";
}

/**
 * Nodes the architectural cutaway takes out of the way: walls and openings on
 * the near side. Openings stay when selected; the selected opening's host wall
 * and any selected wall stay too. The live viewport draws these as ghosts so
 * the room still reads as a closed shell; captures and exports drop them.
 */
export function modelCutawayNodeIds(
  nodes: readonly CompiledSceneNode[],
  cutawaySides: ReadonlySet<string>,
  selectedOpeningId: string | null,
  selectedWallId: string | null = null,
): Set<string> {
  const selectedOpening = selectedOpeningId
    ? nodes.find((node) => node.metadata.openingId === selectedOpeningId)
    : undefined;
  const hostWallId = selectedOpening && typeof selectedOpening.metadata.wallId === "string"
    ? selectedOpening.metadata.wallId
    : null;
  const ids = new Set<string>();
  for (const node of nodes) {
    const role = String(node.metadata.role);
    if (role !== "wall" && role !== "opening") continue;
    if (!cutawaySides.has(String(node.metadata.wallSide))) continue;
    if (node.metadata.openingId === selectedOpeningId) continue;
    if (role === "wall" && selectedWallId && node.metadata.wallId === selectedWallId) continue;
    if (role === "wall" && hostWallId && node.metadata.wallId === hostWallId) continue;
    ids.add(node.id);
  }
  return ids;
}

/**
 * Applies architectural cutaway by removal. Openings on cutaway sides are
 * removed unless selected; the selected opening's host wall and any selected
 * wall stay visible.
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
  const cut = cutawayWalls
    ? modelCutawayNodeIds(nodes, cutawaySides, selectedOpeningId, selectedWallId)
    : new Set<string>();
  return nodes.filter((node) => {
    if (hideCeiling && node.metadata.surface === "ceiling") return false;
    return !cut.has(node.id);
  });
}
