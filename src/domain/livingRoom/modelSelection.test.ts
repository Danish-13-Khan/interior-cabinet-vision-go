import { describe, expect, it } from "vitest";
import type { CompiledSceneNode } from "./sceneTypes";
import { modelSelectionTarget } from "./modelSelection";

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

  it("ignores architecture nodes without an editable entity", () => {
    expect(modelSelectionTarget(node({ metadata: { role: "wall" } }))).toBeNull();
  });
});
