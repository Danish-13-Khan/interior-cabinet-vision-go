import { describe, expect, it } from "vitest";
import {
  defaultCabinetProject,
  getDefaultCabinetConfig,
  type CabinetInstance,
} from "../cabinetDimensions";
import { createDefaultProjectRoom } from "../projectRooms";
import { DEFAULT_ROOM } from "../roomModel";
import {
  buildSceneTree,
  findSceneTreeNode,
  flattenSceneTree,
  formatCabinetStructuredName,
  packRunPlacementsInOrder,
  reorderCabinetInRun,
  resolveIsolateSet,
} from "./index";
import { detectCabinetRuns } from "../cabinetLibrary";

function makeCabinet(
  id: string,
  name: string,
  x: number,
  overrides: Partial<CabinetInstance> = {},
): CabinetInstance {
  return {
    id,
    name,
    placement: {
      x,
      y: 0,
      z: -1700,
      rotation: 0,
      attachment: "back-wall",
    },
    config: getDefaultCabinetConfig("base"),
    layerId: "layer-default",
    ...overrides,
  };
}

describe("sceneTree", () => {
  it("builds room > wall > run > cabinet > opening hierarchy", () => {
    const cabinets = [
      makeCabinet("c1", "Base A", -900),
      makeCabinet("c2", "Base B", 0),
    ];
    const room = createDefaultProjectRoom(cabinets, DEFAULT_ROOM, "Kitchen", "room-1");
    const tree = buildSceneTree([room]);

    expect(tree).toHaveLength(1);
    expect(tree[0]!.kind).toBe("room");
    expect(tree[0]!.label).toBe("Kitchen");

    const walls = tree[0]!.children;
    expect(walls.some((node) => node.kind === "wall")).toBe(true);

    const flat = flattenSceneTree(tree);
    expect(flat.some((node) => node.kind === "run")).toBe(true);
    expect(flat.some((node) => node.kind === "cabinet")).toBe(true);
    expect(flat.some((node) => node.kind === "opening")).toBe(true);

    const cabinetNode = findSceneTreeNode(
      tree,
      (node) => node.cabinetId === "c1",
    );
    expect(cabinetNode?.label).toContain("C01");
    expect(cabinetNode?.icon).toBe("B");
    expect(cabinetNode?.children.length).toBeGreaterThan(0);
  });

  it("formats structured cabinet names with mark and family", () => {
    const cabinet = makeCabinet("c1", "Island Base", 0);
    const named = formatCabinetStructuredName(cabinet, 0);
    expect(named.label).toBe("C01 · Island Base");
    expect(named.detail).toContain("Base");
    expect(named.detail).toMatch(/\d+×\d+/);
  });

  it("reorders cabinets within a run and packs placements", () => {
    const cabinets = [
      makeCabinet("c1", "A", -900),
      makeCabinet("c2", "B", 0),
      makeCabinet("c3", "C", 900),
    ];
    const project = {
      ...defaultCabinetProject,
      cabinets,
    };
    const bounds = {
      widthMm: 6000,
      depthMm: 4000,
      heightMm: 2800,
    };
    const run = detectCabinetRuns(cabinets, bounds)[0]!;
    expect(run.cabinetIds).toEqual(["c1", "c2", "c3"]);

    const next = reorderCabinetInRun(run, project, bounds, "c1", 1);
    expect(next).not.toBeNull();
    const ordered = ["c2", "c1", "c3"]
      .map((id) => next!.cabinets.find((cabinet) => cabinet.id === id)!)
      .sort((a, b) => a.placement.x - b.placement.x);
    expect(ordered.map((cabinet) => cabinet.id)).toEqual(["c2", "c1", "c3"]);

    const packed = packRunPlacementsInOrder(
      run,
      ["c3", "c2", "c1"],
      project,
      bounds,
    );
    expect(Object.keys(packed)).toHaveLength(3);
    expect(packed.c3!.x).toBeLessThan(packed.c2!.x);
    expect(packed.c2!.x).toBeLessThan(packed.c1!.x);
  });

  it("toggles isolate set", () => {
    expect(resolveIsolateSet(null, ["a", "b"])).toEqual(["a", "b"]);
    expect(resolveIsolateSet(["a", "b"], ["b", "a"])).toBeNull();
    expect(resolveIsolateSet(["a"], ["a", "b"])).toEqual(["a", "b"]);
  });
});
