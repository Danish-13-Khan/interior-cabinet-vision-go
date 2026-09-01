import { describe, expect, it } from "vitest";
import type { CompiledSceneNode } from "./sceneTypes";
import { modelNodeIsSelected, modelSelectionTarget } from "./modelSelection";

function node(patch: Partial<CompiledSceneNode>): CompiledSceneNode {
  return {
    id: "node",
    name: "Node",
    sourceObjectId: null,
    adapterId: "test",
    positionMm: { x: 0, y: 0, z: 0 },
    rotationDegrees: { x: 0, y: 0, z: 0 },
    primitives: [],
    placeholder: false,
    metadata: {},
    renderBinding: { strategy: "procedural", materialBindings: {} },
    ...patch,
  };
}

describe("model selection target", () => {
  it("maps object and opening nodes to editable entities", () => {
    expect(modelSelectionTarget(node({ sourceObjectId: "object-1" }))).toEqual({
      kind: "object", id: "object-1",
    });
    expect(modelSelectionTarget(node({ metadata: { openingId: "opening-1" } }))).toEqual({
      kind: "opening", id: "opening-1",
    });
  });

  it("maps wall nodes and ignores architecture without an editable entity", () => {
    expect(modelSelectionTarget(node({ metadata: { role: "wall", wallId: "wall-1" } }))).toEqual({
      kind: "wall", id: "wall-1",
    });
    expect(modelSelectionTarget(node({ metadata: { role: "floor" } }))).toBeNull();
  });

  it("does not select a hosted opening when its wall is selected", () => {
    const wall = node({ metadata: { role: "wall", wallId: "wall-1" } });
    const opening = node({ metadata: { role: "opening", openingId: "door-1", wallId: "wall-1" } });
    const wallSelection = { objectIds: [], openingId: null, wallId: "wall-1" };
    expect(modelNodeIsSelected(wall, wallSelection)).toBe(true);
    expect(modelNodeIsSelected(opening, wallSelection)).toBe(false);
    expect(modelNodeIsSelected(opening, { ...wallSelection, openingId: "door-1", wallId: null })).toBe(true);
  });
});
