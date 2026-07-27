import { describe, expect, it } from "vitest";
import {
  createDefaultComposition,
  describeComposition,
  getCompositionCapabilities,
  normalizeComposition,
  resolveCabinetComposition,
  syncFlatFieldsFromComposition,
} from "./cabinetComposition";
import { clampCabinetConfig, getDefaultCabinetConfig } from "./cabinetDimensions";
import {
  applyCabinetEditorChange,
  getCabinetEditorSections,
  getCabinetEditorValue,
} from "./cabinetEditorSchema";
import { getEngineeredCabinetPreset, listEngineeredPresetsForFamily } from "./cabinetPresets";
import { createCabinetConstruction } from "./cabinetConstruction";

describe("cabinet composition", () => {
  it("creates family-specific default composition", () => {
    const wall = createDefaultComposition("wall");
    const drawer = createDefaultComposition("drawer");

    expect(wall.toeKick.enabled).toBe(false);
    expect(drawer.doors.enabled).toBe(false);
    expect(drawer.drawers.count).toBe(3);
    expect(getCompositionCapabilities("wall").toeKick).toBe(false);
    expect(getCompositionCapabilities("base").drawers).toBe(true);
  });

  it("keeps flat fields synchronized from composition", () => {
    const composition = normalizeComposition(
      "base",
      {
        ...createDefaultComposition("base"),
        shelves: { count: 2, adjustable: true },
        doors: { enabled: true, style: "single", hinge: "left", count: 1 },
        drawers: { count: 1, equalHeights: true },
        toeKick: { enabled: true, heightMm: 120, insetMm: 50 },
        endPanels: { left: true, right: false },
        fillers: { leftMm: 40, rightMm: 0 },
        dividers: { count: 1 },
        openings: [{ id: "opening-primary", label: "Mixed Bay", style: "mixed" }],
      },
      900,
    );
    const flat = syncFlatFieldsFromComposition(composition);

    expect(flat.shelfCount).toBe(2);
    expect(flat.hasDoors).toBe(true);
    expect(flat.drawerCount).toBe(1);
    expect(flat.toeKickHeight).toBe(120);
    expect(flat.leftEndPanel).toBe(true);
    expect(describeComposition(composition)).toContain("divider");
  });

  it("clampCabinetConfig persists composition", () => {
    const config = clampCabinetConfig({
      ...getDefaultCabinetConfig("base"),
      shelfCount: 3,
    });

    expect(config.composition).toBeDefined();
    expect(resolveCabinetComposition(config).shelves.count).toBe(config.shelfCount);
  });
});

describe("cabinet editor schema", () => {
  it("exposes family-specific property sections", () => {
    const baseSections = getCabinetEditorSections(getDefaultCabinetConfig("base")).map(
      (section) => section.id,
    );
    const wallSections = getCabinetEditorSections(getDefaultCabinetConfig("wall")).map(
      (section) => section.id,
    );
    const drawerSections = getCabinetEditorSections(getDefaultCabinetConfig("drawer")).map(
      (section) => section.id,
    );

    expect(baseSections).toContain("doors");
    expect(baseSections).toContain("drawers");
    expect(baseSections).toContain("fillers");
    expect(wallSections).not.toContain("toeKick");
    expect(drawerSections).not.toContain("doors");
    expect(drawerSections).toContain("drawers");
  });

  it("applies engineered presets and editor field changes", () => {
    const preset = getEngineeredCabinetPreset("base-900-drawer-over-doors");
    expect(preset).not.toBeNull();

    const applied = applyCabinetEditorChange(
      getDefaultCabinetConfig("base"),
      "preset",
      "base-900-drawer-over-doors",
    );
    expect(applied.drawerCount).toBe(1);
    expect(applied.hasDoors).toBe(true);
    expect(getCabinetEditorValue(applied, "openingStyle")).toBe("mixed");

    const withShelves = applyCabinetEditorChange(applied, "shelfCount", 3);
    expect(withShelves.shelfCount).toBe(3);
    expect(withShelves.composition?.shelves.count).toBe(3);

    expect(listEngineeredPresetsForFamily("tall").length).toBeGreaterThan(0);
  });
});

describe("construction from composition", () => {
  it("emits divider and filler parts from composition", () => {
    const config = applyCabinetEditorChange(getDefaultCabinetConfig("base"), "dividerCount", 2);
    const withFillers = applyCabinetEditorChange(config, "fillerLeft", 50);
    const construction = createCabinetConstruction(withFillers);

    expect(construction.parts.some((part) => part.category === "Divider" && part.quantity === 2)).toBe(
      true,
    );
    expect(construction.parts.some((part) => part.id === "filler-left")).toBe(true);
  });
});
