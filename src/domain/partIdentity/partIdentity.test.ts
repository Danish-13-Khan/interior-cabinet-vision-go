import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetInstance } from "../cabinetDimensions";
import { resolveCabinetComposition } from "../cabinetComposition";
import { collectOpeningLeaves, resetOpeningIdCounterForTests, splitOpening } from "../cabinetOpeningStructure";
import { createCabinetProductionCutlist } from "../productionCutlist";
import {
  buildCabinetPartIndex,
  parseCutlistKey,
  resolveFromCutlistKey,
  resolveFromGeometryName,
  resolveFromTreePartId,
} from "./index";

function cabinet(id: string, type: "base" | "drawer"): CabinetInstance {
  return {
    id,
    name: type === "base" ? "Base" : "Drawers",
    placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
    config: getDefaultCabinetConfig(type),
  };
}

describe("part identity", () => {
  it("maps a base side from tree, mesh, and cut list", () => {
    const index = buildCabinetPartIndex(cabinet("cab-base", "base"), 1, "room-1");
    const side = index.links.find((link) => link.constructionKey === "left-side");
    expect(side?.cutlistKey).toBe("cab-base:left-side");
    expect(side?.geometryNames).toEqual(["left-side-panel"]);
    expect(resolveFromTreePartId(index, side!.treePartId)?.cutlistKey).toBe("cab-base:left-side");
    expect(resolveFromCutlistKey(index, "cab-base:left-side")?.geometryNames).toEqual(["left-side-panel"]);
    expect(resolveFromGeometryName(index, "left-side-panel")?.treePartId).toBe(side!.treePartId);
    expect(parseCutlistKey("cab-base:left-side")).toEqual({
      cabinetId: "cab-base",
      constructionKey: "left-side",
    });
  });

  it("collapses double-door meshes onto one cut-list door line", () => {
    const index = buildCabinetPartIndex(cabinet("cab-base", "base"));
    const door = resolveFromGeometryName(index, "left-door");
    expect(door?.constructionKey).toBe("door");
    expect(door?.geometryNames).toEqual(expect.arrayContaining(["left-door", "right-door"]));
    expect(resolveFromCutlistKey(index, "cab-base:door")?.geometryNames.length).toBeGreaterThan(1);
  });

  it("maps drawer fronts and records box parts without meshes", () => {
    const index = buildCabinetPartIndex(cabinet("cab-drawer", "drawer"));
    const front = resolveFromGeometryName(index, "drawer-front-1");
    expect(front?.constructionKey).toBe("drawer-front");
    const box = index.links.find((link) => link.constructionKey === "drawer-side");
    expect(box?.geometryNames).toEqual([]);
    expect(index.gaps.some((gap) => gap.ref === "drawer-side" && gap.kind === "cutlist-without-geometry")).toBe(true);
  });

  it("documents shelf and door suffix changes when openings split", () => {
    resetOpeningIdCounterForTests();
    const before = cabinet("cab-base", "base");
    const beforeIds = createCabinetProductionCutlist(before).map((line) => line.partId);
    expect(beforeIds).toContain("door");
    expect(beforeIds).toContain("shelf");

    const composition = resolveCabinetComposition(before.config);
    const structure = composition.openingStructure;
    expect(structure).toBeTruthy();
    const leaf = collectOpeningLeaves(structure!.root)[0]!;
    const split = splitOpening(structure!, leaf.id, "vertical", before.config.type, before.config.dimensions.width);
    const after = createCabinetProductionCutlist({
      ...before,
      config: { ...before.config, composition: { ...composition, openingStructure: split } },
    }).map((line) => line.partId);

    expect(after).not.toContain("door");
    expect(after).not.toContain("shelf");
    expect(after.filter((id) => id.startsWith("door-")).length).toBeGreaterThan(1);
    expect(after.filter((id) => id.startsWith("shelf-")).length).toBeGreaterThan(1);
  });
});
