import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetInstance } from "./cabinetDimensions";
import { resolveCabinetComposition } from "./cabinetComposition";
import { createCabinetConstruction } from "./cabinetConstruction";
import { createCabinetGeometry } from "./cabinetGeometry";
import {
  collectOpeningLeaves,
  deleteOpening,
  mergeOpening,
  setOpeningContentType,
  setOpeningRatio,
  splitOpening,
  updateOpeningLeaf,
} from "./cabinetOpeningStructure";
import { summarizeCabinetAssembly, validateCabinetAssembly } from "./cabinetAssembly";
import { buildHardwareLines } from "./hardwareSystem";
import { DEFAULT_COSTING_SETTINGS } from "./costingSettings";

function mixedBase() {
  const config = getDefaultCabinetConfig("base");
  let structure = resolveCabinetComposition(config).openingStructure!;
  structure = splitOpening(
    structure,
    structure.activeOpeningId,
    "horizontal",
    "base",
    config.dimensions.width,
  );
  const leaves = collectOpeningLeaves(structure.root);
  structure = updateOpeningLeaf(
    structure,
    leaves[0]!.id,
    { drawerCount: 3 },
    "base",
    config.dimensions.width,
  );
  structure = setOpeningContentType(
    structure,
    leaves[1]!.id,
    "door",
    "base",
    config.dimensions.width,
  );
  return {
    ...config,
    composition: {
      ...resolveCabinetComposition(config),
      openingStructure: structure,
    },
  };
}

describe("cabinet assembly vertical slice", () => {
  it("creates a three-drawer opening over a lower door opening", () => {
    const config = mixedBase();
    const leaves = collectOpeningLeaves(
      resolveCabinetComposition(config).openingStructure!.root,
    );
    expect(leaves.map((leaf) => leaf.contentType)).toEqual([
      "drawer-stack",
      "door",
    ]);
    expect(leaves[0]?.drawerCount).toBe(3);

    const summary = summarizeCabinetAssembly(config);
    expect(summary.openingCount).toBe(2);
    expect(summary.drawerCount).toBe(3);
    expect(summary.doorCount).toBe(2);

    const parts = createCabinetConstruction(config).parts;
    expect(parts.some((part) => part.category === "DrawerFront" && part.quantity === 3)).toBe(true);
    expect(parts.some((part) => part.category === "Door" && part.quantity === 2)).toBe(true);
    expect(parts.some((part) => part.label === "Fixed Partition")).toBe(true);

    const geometry = createCabinetGeometry(config);
    expect(geometry.filter((panel) => panel.name.includes("drawer-")).length).toBe(3);
    expect(geometry.filter((panel) => panel.name.startsWith("door-")).length).toBe(2);
  });

  it("resizes sibling openings while preserving a normalized total", () => {
    const config = mixedBase();
    const structure = resolveCabinetComposition(config).openingStructure!;
    const leaves = collectOpeningLeaves(structure.root);
    const resized = setOpeningRatio(
      structure,
      leaves[0]!.id,
      0.35,
      "base",
      900,
    );
    const resizedLeaves = collectOpeningLeaves(resized.root);
    expect(resizedLeaves[0]?.ratio).toBeCloseTo(0.35, 2);
    expect(resizedLeaves[1]?.ratio).toBeCloseTo(0.65, 2);
    expect(resizedLeaves.reduce((sum, leaf) => sum + leaf.ratio, 0)).toBeCloseTo(1, 2);
  });

  it("merges and deletes openings without replacing the surviving stable id", () => {
    const config = mixedBase();
    const structure = resolveCabinetComposition(config).openingStructure!;
    const leaves = collectOpeningLeaves(structure.root);
    const survivorId = leaves[0]!.id;
    const merged = mergeOpening(structure, survivorId, "base", 900);
    expect(collectOpeningLeaves(merged.root)).toHaveLength(1);
    expect(merged.activeOpeningId).toBe(survivorId);

    const deleted = deleteOpening(structure, leaves[1]!.id, "base", 900);
    expect(collectOpeningLeaves(deleted.root)).toHaveLength(1);
    expect(collectOpeningLeaves(deleted.root)[0]?.id).toBe(survivorId);
  });

  it("returns understandable validation and height-aware hinge quantities", () => {
    const config = mixedBase();
    const structure = resolveCabinetComposition(config).openingStructure!;
    const leaves = collectOpeningLeaves(structure.root);
    const unsafe = setOpeningRatio(structure, leaves[0]!.id, 0.1, "base", 900);
    const unsafeConfig = {
      ...config,
      composition: {
        ...resolveCabinetComposition(config),
        openingStructure: unsafe,
      },
    };
    expect(validateCabinetAssembly(unsafeConfig).some((issue) => issue.severity === "error")).toBe(true);

    const tallConfig = getDefaultCabinetConfig("tall");
    const cabinet: CabinetInstance = {
      id: "tall-1",
      name: "Tall 1",
      config: tallConfig,
      placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
    };
    const construction = createCabinetConstruction(tallConfig);
    const hardware = buildHardwareLines(cabinet, construction, DEFAULT_COSTING_SETTINGS);
    expect(hardware.find((line) => line.kind === "hinge")?.quantity).toBeGreaterThan(4);
  });

  it("propagates custom drawer-front proportions into separate cut parts", () => {
    const config = mixedBase();
    const structure = resolveCabinetComposition(config).openingStructure!;
    const drawer = collectOpeningLeaves(structure.root).find(
      (leaf) => leaf.contentType === "drawer-stack",
    )!;
    const custom = updateOpeningLeaf(
      structure,
      drawer.id,
      { drawerRatios: [0.2, 0.3, 0.5] },
      "base",
      900,
    );
    const customConfig = {
      ...config,
      composition: {
        ...resolveCabinetComposition(config),
        openingStructure: custom,
      },
    };
    const fronts = createCabinetConstruction(customConfig).parts.filter(
      (part) => part.category === "DrawerFront",
    );
    expect(fronts).toHaveLength(3);
    expect(new Set(fronts.map((part) => part.lengthMm)).size).toBe(3);
  });
});
