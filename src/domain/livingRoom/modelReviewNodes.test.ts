import { describe, expect, it } from "vitest";
import type { CompiledSceneNode } from "./sceneTypes";
import { filterModelReviewNodes, resolveModelCutawaySides } from "./modelReviewNodes";

function node(
  id: string,
  role: string,
  wallSide = "front",
  extras: Record<string, string> = {},
): CompiledSceneNode {
  return {
    id,
    name: id,
    sourceObjectId: null,
    adapterId: "test",
    positionMm: { x: 0, y: 0, z: 0 },
    rotationDegrees: { x: 0, y: 0, z: 0 },
    primitives: [],
    placeholder: false,
    metadata: {
      role,
      wallSide,
      ...(role === "opening" ? { openingId: id } : {}),
      ...extras,
    },
    renderBinding: { strategy: "procedural", materialBindings: {} },
  };
}

describe("model review node filtering", () => {
  it("hides openings on cutaway sides when none are selected", () => {
    const nodes = [node("wall", "wall"), node("door", "opening"), node("sofa", "object")];
    expect(filterModelReviewNodes(nodes, true, new Set(["front"]), null).map((item) => item.id))
      .toEqual(["sofa"]);
  });

  it("keeps only the selected opening's host wall by wallId", () => {
    const nodes = [
      node("wall-a", "wall", "custom", { wallId: "w-a" }),
      node("wall-b", "wall", "custom", { wallId: "w-b" }),
      node("door", "opening", "custom", { wallId: "w-a" }),
      node("sofa", "object"),
    ];
    expect(filterModelReviewNodes(nodes, true, new Set(["custom"]), "door").map((item) => item.id))
      .toEqual(["wall-a", "door", "sofa"]);
  });

  it("still cuts away walls on other cutaway sides", () => {
    const nodes = [node("wall", "wall"), node("back-wall", "wall", "back"), node("sofa", "object")];
    expect(filterModelReviewNodes(nodes, true, new Set(["front"]), null).map((item) => item.id))
      .toEqual(["back-wall", "sofa"]);
  });

  it("hides the ceiling in dollhouse review so the room reads as a hollow shell", () => {
    const nodes = [node("ceiling", "architecture", "front", { surface: "ceiling" }), node("sofa", "object")];
    expect(filterModelReviewNodes(nodes, false, new Set(), null, true).map((item) => item.id))
      .toEqual(["sofa"]);
  });

  it("keeps a selected wall even when its side is cut away", () => {
    const nodes = [
      node("back-wall", "wall", "back", { wallId: "w-back" }),
      node("front-wall", "wall", "front", { wallId: "w-front" }),
      node("sofa", "object"),
    ];
    expect(
      filterModelReviewNodes(nodes, true, new Set(["back"]), null, false, "w-back").map((item) => item.id),
    ).toEqual(["back-wall", "front-wall", "sofa"]);
  });
});

describe("resolveModelCutawaySides", () => {
  const center = { x: 0, z: 0 };

  it("opens only the near front/back face so side walls stay for kitchen runs", () => {
    expect([...resolveModelCutawaySides({ x: 1000, z: 2000 }, center)].sort()).toEqual(["front"]);
    expect([...resolveModelCutawaySides({ x: -1000, z: -2000 }, center)].sort()).toEqual(["back"]);
  });

  it("defaults to front when no camera is available", () => {
    expect([...resolveModelCutawaySides(null, center)]).toEqual(["front"]);
  });
});
