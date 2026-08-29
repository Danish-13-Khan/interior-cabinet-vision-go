import type { CompiledSceneNode } from "./sceneTypes";

/**
 * Applies architectural cutaway. Openings on cutaway sides are removed unless
 * selected; the selected opening's exact host wall (by wallId) is retained.
 */
export function filterModelReviewNodes(
  nodes: readonly CompiledSceneNode[],
  cutawayWalls: boolean,
  cutawaySides: ReadonlySet<string>,
  selectedOpeningId: string | null,
): CompiledSceneNode[] {
  if (!cutawayWalls) return [...nodes];
  const selectedOpening = selectedOpeningId
    ? nodes.find((node) => node.metadata.openingId === selectedOpeningId)
    : undefined;
  const hostWallId = selectedOpening && typeof selectedOpening.metadata.wallId === "string"
    ? selectedOpening.metadata.wallId
    : null;
  return nodes.filter((node) => {
    if (node.metadata.openingId === selectedOpeningId) return true;
    const role = String(node.metadata.role);
    const wallSide = String(node.metadata.wallSide);
    if (hostWallId && role === "wall" && node.metadata.wallId === hostWallId) return true;
    return !["wall", "opening"].includes(role) || !cutawaySides.has(wallSide);
  });
}
