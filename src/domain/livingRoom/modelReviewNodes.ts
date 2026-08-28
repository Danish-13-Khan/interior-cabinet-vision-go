import type { CompiledSceneNode } from "./sceneTypes";

/** Applies architectural cutaway while keeping the selected opening reviewable. */
export function filterModelReviewNodes(
  nodes: readonly CompiledSceneNode[],
  cutawayWalls: boolean,
  cutawaySides: ReadonlySet<string>,
  selectedOpeningId: string | null,
): CompiledSceneNode[] {
  if (!cutawayWalls) return [...nodes];
  return nodes.filter((node) => {
    if (node.metadata.openingId === selectedOpeningId) return true;
    const role = String(node.metadata.role);
    return !["wall", "opening"].includes(role)
      || !cutawaySides.has(String(node.metadata.wallSide));
  });
}
