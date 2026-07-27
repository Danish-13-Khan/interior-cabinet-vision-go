import { beforeEach, describe, expect, it } from "vitest";
import {
  aggregateOpeningMetrics,
  collectOpeningLeaves,
  createDefaultOpeningStructure,
  getActiveOpeningLeaf,
  migrateLegacyOpeningsToStructure,
  normalizeOpeningStructure,
  resetOpeningIdCounterForTests,
  setOpeningContentType,
  splitOpening,
} from "./cabinetOpeningStructure";
import {
  getFamilyOpeningRules,
  listFamilyOpeningSummaries,
} from "./cabinetFamilyRules";
import {
  applyCabinetEditorChange,
  getCabinetEditorSections,
  getCabinetEditorValue,
} from "./cabinetEditorSchema";
import { getDefaultCabinetConfig } from "./cabinetDimensions";
import { resolveCabinetComposition } from "./cabinetComposition";

describe("cabinet opening structure", () => {
  beforeEach(() => {
    resetOpeningIdCounterForTests();
  });

  it("creates family defaults and aggregates metrics", () => {
    const base = createDefaultOpeningStructure("base", 900);
    const drawer = createDefaultOpeningStructure("drawer", 600);
    const openShelf = createDefaultOpeningStructure("open-shelf", 900);

    expect(getActiveOpeningLeaf(base)?.contentType).toBe("door");
    expect(aggregateOpeningMetrics(drawer).drawerCount).toBe(3);
    expect(aggregateOpeningMetrics(openShelf).shelfCount).toBe(3);
  });

  it("supports vertical and horizontal splits within family rules", () => {
    const start = createDefaultOpeningStructure("base", 900);
    const vertical = splitOpening(start, start.activeOpeningId, "vertical", "base", 900);
    expect(collectOpeningLeaves(vertical.root)).toHaveLength(2);
    expect(vertical.root.kind).toBe("split");
    if (vertical.root.kind === "split") {
      expect(vertical.root.axis).toBe("vertical");
    }

    const horizontal = splitOpening(start, start.activeOpeningId, "horizontal", "base", 900);
    expect(collectOpeningLeaves(horizontal.root)).toHaveLength(2);
    if (horizontal.root.kind === "split") {
      expect(horizontal.root.axis).toBe("horizontal");
    }

    const wall = createDefaultOpeningStructure("wall", 900);
    const wallHorizontal = splitOpening(
      wall,
      wall.activeOpeningId,
      "horizontal",
      "wall",
      900,
    );
    expect(collectOpeningLeaves(wallHorizontal.root)).toHaveLength(1);
  });

  it("assigns content types and migrates legacy mixed openings", () => {
    const structure = createDefaultOpeningStructure("base", 900);
    const asDrawer = setOpeningContentType(
      structure,
      structure.activeOpeningId,
      "drawer-stack",
      "base",
      900,
    );
    expect(getActiveOpeningLeaf(asDrawer)?.contentType).toBe("drawer-stack");

    const mixed = migrateLegacyOpeningsToStructure("base", 900, "mixed", 1, 1, true);
    const leaves = collectOpeningLeaves(mixed.root);
    expect(leaves.some((leaf) => leaf.contentType === "door")).toBe(true);
    expect(leaves.some((leaf) => leaf.contentType === "drawer-stack")).toBe(true);
    expect(normalizeOpeningStructure("drawer", mixed, 900).root.kind).toBe("leaf");
  });
});

describe("cabinet family opening rules", () => {
  it("exposes rules for core engineered families", () => {
    const summaries = listFamilyOpeningSummaries();
    expect(summaries.map((item) => item.family)).toEqual([
      "base",
      "wall",
      "tall",
      "drawer",
      "sink",
      "corner",
      "open-shelf",
    ]);

    expect(getFamilyOpeningRules("wall").allowedContentTypes).not.toContain("drawer-stack");
    expect(getFamilyOpeningRules("drawer").allowVerticalSplit).toBe(false);
    expect(getFamilyOpeningRules("corner").maxLeaves).toBe(1);
  });
});

describe("opening structure in property grid", () => {
  it("exposes opening controls and applies split/content edits", () => {
    const base = getDefaultCabinetConfig("base");
    const sections = getCabinetEditorSections(base).map((section) => section.id);
    expect(sections).toContain("openings");

    const split = applyCabinetEditorChange(base, "splitHorizontal", true);
    const composition = resolveCabinetComposition(split);
    expect(collectOpeningLeaves(composition.openingStructure!.root).length).toBeGreaterThan(1);
    expect(getCabinetEditorValue(split, "openingStyle")).toBe("mixed");

    const content = applyCabinetEditorChange(split, "openingContentType", "open-shelf");
    expect(getCabinetEditorValue(content, "openingContentType")).toBe("open-shelf");
  });
});
