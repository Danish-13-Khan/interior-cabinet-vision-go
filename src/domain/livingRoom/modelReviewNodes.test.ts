import { describe, expect, it } from "vitest";
import type { CompiledSceneNode } from "./sceneTypes";
import { filterModelReviewNodes, modelCutawayNodeIds, modelViewCutsNearWall, modelViewHidesCeiling, resolveModelCutawaySides } from "./modelReviewNodes";

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

  it("cuts a left wall when that side is the near envelope", () => {
    const nodes = [
      node("left-wall", "wall", "left"),
      node("right-wall", "wall", "right"),
      node("sofa", "object"),
    ];
    expect(filterModelReviewNodes(nodes, true, new Set(["left"]), null).map((item) => item.id))
      .toEqual(["right-wall", "sofa"]);
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

describe("modelCutawayNodeIds", () => {
  it("ghosts the near wall and its openings instead of dropping them from the scene", () => {
    const nodes = [
      node("front-wall", "wall", "front", { wallId: "w-front" }),
      node("front-door", "opening", "front", { wallId: "w-front" }),
      node("back-wall", "wall", "back", { wallId: "w-back" }),
      node("sofa", "object"),
    ];
    expect([...modelCutawayNodeIds(nodes, new Set(["front"]), null)].sort())
      .toEqual(["front-door", "front-wall"]);
  });

  it("keeps a selected wall, a selected opening and its host wall solid", () => {
    const nodes = [
      node("front-wall", "wall", "front", { wallId: "w-front" }),
      node("front-door", "opening", "front", { wallId: "w-front" }),
      node("left-wall", "wall", "left", { wallId: "w-left" }),
      node("left-window", "opening", "left", { wallId: "w-left" }),
    ];
    expect([...modelCutawayNodeIds(nodes, new Set(["front", "left"]), "front-door", "w-left")].sort())
      .toEqual(["left-window"]);
  });

  it("matches what removal would have filtered out", () => {
    const nodes = [
      node("front-wall", "wall", "front", { wallId: "w-front" }),
      node("front-door", "opening", "front", { wallId: "w-front" }),
      node("back-wall", "wall", "back", { wallId: "w-back" }),
      node("ceiling", "architecture", "front", { surface: "ceiling" }),
      node("sofa", "object"),
    ];
    const ghost = modelCutawayNodeIds(nodes, new Set(["front"]), null);
    const kept = filterModelReviewNodes(nodes, true, new Set(["front"]), null).map((item) => item.id);
    expect(nodes.filter((item) => !ghost.has(item.id)).map((item) => item.id)).toEqual(kept);
  });
});

describe("resolveModelCutawaySides", () => {
  const center = { x: 0, z: 0 };

  it("opens the nearest envelope wall, including left/right from a side orbit", () => {
    expect([...resolveModelCutawaySides({ x: 1000, z: 2000 }, center)].sort()).toEqual(["front"]);
    expect([...resolveModelCutawaySides({ x: -1000, z: -2000 }, center)].sort()).toEqual(["back"]);
    expect([...resolveModelCutawaySides({ x: 2500, z: 400 }, center)].sort()).toEqual(["right"]);
    expect([...resolveModelCutawaySides({ x: -2500, z: 400 }, center)].sort()).toEqual(["left"]);
  });

  it("defaults to front when no camera is available", () => {
    expect([...resolveModelCutawaySides(null, center)]).toEqual(["front"]);
  });

  it("opens perspective, front, and side, and keeps walkthrough enclosed", () => {
    expect(modelViewHidesCeiling("perspective")).toBe(true);
    expect(modelViewCutsNearWall("perspective")).toBe(true);
    expect(modelViewCutsNearWall("front")).toBe(true);
    expect(modelViewCutsNearWall("side")).toBe(true);
    expect(modelViewCutsNearWall("dollhouse")).toBe(false);
    expect(modelViewHidesCeiling("walkthrough")).toBe(false);
  });

  it("keeps the ceiling in any preset when the Ceiling toggle is on", () => {
    expect(modelViewHidesCeiling("dollhouse", true)).toBe(false);
    expect(modelViewHidesCeiling("perspective", true)).toBe(false);
    expect(modelViewHidesCeiling("dollhouse", false)).toBe(true);
    expect(modelViewHidesCeiling("walkthrough", false)).toBe(false);
  });
});
