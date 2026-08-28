import { describe, expect, it } from "vitest";
import type { CompiledSceneNode } from "./sceneTypes";
import { filterModelReviewNodes } from "./modelReviewNodes";

function node(id: string, role: string, wallSide = "front"): CompiledSceneNode {
  return {
    id,
    name: id,
    sourceObjectId: null,
    adapterId: "test",
    positionMm: { x: 0, y: 0, z: 0 },
    rotationDegrees: { x: 0, y: 0, z: 0 },
    primitives: [],
    placeholder: false,
    metadata: { role, wallSide, ...(role === "opening" ? { openingId: id } : {}) },
    renderBinding: { strategy: "procedural", materialBindings: {} },
  };
}

describe("model review node filtering", () => {
  it("keeps a selected opening visible on a cutaway side", () => {
    const nodes = [node("wall", "wall"), node("door", "opening"), node("sofa", "object")];
    expect(filterModelReviewNodes(nodes, true, new Set(["front"]), "door").map((item) => item.id))
      .toEqual(["door", "sofa"]);
  });

  it("uses normal cutaway filtering when no opening is selected", () => {
    const nodes = [node("wall", "wall"), node("door", "opening"), node("sofa", "object")];
    expect(filterModelReviewNodes(nodes, true, new Set(["front"]), null).map((item) => item.id))
      .toEqual(["sofa"]);
  });
});
