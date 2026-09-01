import type { CompiledSceneNode } from "./sceneTypes";

export type ModelSelectionTarget =
  | { kind: "object"; id: string }
  | { kind: "opening"; id: string }
  | { kind: "wall"; id: string }
  | null;

export type ModelSelectionState = {
  objectIds: readonly string[];
  openingId: string | null;
  wallId: string | null;
};

/** Resolves a compiled node back to the editable project entity it represents. */
export function modelSelectionTarget(node: CompiledSceneNode): ModelSelectionTarget {
  if (node.sourceObjectId) return { kind: "object", id: node.sourceObjectId };
  const openingId = node.metadata.openingId;
  if (typeof openingId === "string" && openingId.length > 0) {
    return { kind: "opening", id: openingId };
  }
  const wallId = node.metadata.wallId;
  return typeof wallId === "string" && wallId.length > 0
    ? { kind: "wall", id: wallId }
    : null;
}

/** Matches only the node's editable entity, not related host metadata. */
export function modelNodeIsSelected(node: CompiledSceneNode, selection: ModelSelectionState) {
  const target = modelSelectionTarget(node);
  if (!target) return false;
  if (target.kind === "object") return selection.objectIds.includes(target.id);
  if (target.kind === "opening") return selection.openingId === target.id;
  return selection.wallId === target.id;
}
