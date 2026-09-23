import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetInstance, type CabinetProject } from "../cabinetDimensions";
import { createEmptyInteriorProject, type InteriorObjectEntity } from "../interiorProject";
import { buildCabinetPartIndex, resolveFromCutlistKey } from "../partIdentity";
import { createCabinetProductionCutlist } from "../productionCutlist";
import { cutlistGroups } from "./cutlistView";
import { buildDesignHierarchy } from "./designHierarchy";
import {
  attachManufacturingParts,
  collapseHierarchy,
  manufacturingExportDespiteIsolation,
  visibleHierarchyNodes,
} from "./manufacturingTree";

function cabinet(id: string, objectId: string): CabinetInstance {
  return {
    id,
    name: id,
    interiorObjectId: objectId,
    placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "back-wall" },
    config: getDefaultCabinetConfig("base"),
  };
}

function object(id: string): InteriorObjectEntity {
  return {
    id, roomId: "room-a", kind: "cabinet", category: "base", catalogItemId: id, name: id,
    position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 },
    dimensions: { widthMm: 600, heightMm: 720, depthMm: 560 },
    materialSlots: {}, parameters: {},
  };
}

function interior() {
  const base = createEmptyInteriorProject({ id: "p", name: "Kitchen", now: "2026-09-23T12:00:00.000Z" });
  return {
    ...base,
    activeRoomId: "room-a",
    rooms: [{
      id: "room-a", name: "Kitchen", roomType: "kitchen" as const,
      dimensions: { widthMm: 4000, heightMm: 2700, depthMm: 3000 }, wallThicknessMm: 100,
    }],
    objects: [object("obj-a"), object("obj-b"), { ...object("sofa"), id: "sofa", kind: "furniture" as const, name: "Sofa" }],
  };
}

describe("manufacturing hierarchy", () => {
  const cabinets = [cabinet("cab-a", "obj-a"), cabinet("cab-b", "obj-b")];
  const bounds = { widthMm: 4000, depthMm: 3000, heightMm: 2700 };
  const nodes = attachManufacturingParts(buildDesignHierarchy(interior()), cabinets, bounds);

  it("places construction parts under a run and resolves a cut-list key", () => {
    expect(nodes.some((node) => node.kind === "run")).toBe(true);
    const side = nodes.find((node) => node.cutlistKey === "cab-a:left-side");
    expect(side?.kind).toBe("part");
    expect(side?.constructionKey).toBe("left-side");
    const index = buildCabinetPartIndex(cabinets[0]!, 1, "room-a");
    expect(resolveFromCutlistKey(index, "cab-a:left-side")?.treePartId).toBe(side?.id);
    expect(nodes.some((node) => node.kind === "furniture" && node.detail === "Bought-in")).toBe(true);
    expect(nodes.some((node) => node.kind === "group" && node.label === "Carcass")).toBe(true);
  });

  it("collapses a group and hides an isolated cabinet without dropping export lines", () => {
    const carcass = nodes.find((node) => node.kind === "group" && node.label === "Carcass")!;
    const collapsed = collapseHierarchy(nodes, new Set([carcass.id]));
    expect(collapsed.some((node) => node.cutlistKey === "cab-a:left-side")).toBe(false);
    const isolated = visibleHierarchyNodes(nodes, { isolatedObjectId: "obj-a", hiddenObjectIds: [] });
    expect(isolated.some((node) => node.objectId === "obj-b")).toBe(false);
    expect(isolated.some((node) => node.cutlistKey === "cab-a:left-side")).toBe(true);
    const project: CabinetProject = { version: 1, cabinets };
    const exported = manufacturingExportDespiteIsolation(project, ["cab-a"]);
    expect(exported.viewportIds).toEqual(["cab-a"]);
    expect(exported.exportCabinetIds.sort()).toEqual(["cab-a", "cab-b"]);
    expect(exported.exportLineCount).toBe(createCabinetProductionCutlist(cabinets[0]!).length * 2);
  });

  it("groups the same lines by cabinet, material, and thickness", () => {
    const lines = cabinets.flatMap((item, index) => createCabinetProductionCutlist(item, index + 1));
    expect(cutlistGroups(lines, "cabinet").map((group) => group.key).sort()).toEqual(["cab-a", "cab-b"]);
    expect(cutlistGroups(lines, "material").length).toBeGreaterThan(0);
    expect(cutlistGroups(lines, "thickness").every((group) => group.lines.length > 0)).toBe(true);
  });
});
