import type { CompiledSceneNode } from "./sceneTypes";

export type ModelSelectionTarget =
  | { kind: "object"; id: string }
  | { kind: "opening"; id: string }
  | null;

/** Resolves a compiled node back to the editable project entity it represents. */
export function modelSelectionTarget(node: CompiledSceneNode): ModelSelectionTarget {
  if (node.sourceObjectId) return { kind: "object", id: node.sourceObjectId };
  const openingId = node.metadata.openingId;
  return typeof openingId === "string" && openingId.length > 0
    ? { kind: "opening", id: openingId }
    : null;
}
