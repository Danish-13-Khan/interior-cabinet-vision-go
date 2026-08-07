import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig } from "./cabinetDimensions";
import {
  BUILTIN_DOOR_STYLE_LIBRARY,
  BUILTIN_MATERIAL_LIBRARY,
  createCabinetPresetFromConfig,
  createCountertopEntry,
  createDoorStyleEntry,
  createEmptyWorkshopLibrary,
  createHardwareEntry,
  createMaterialEntry,
  createStandardsPackEntry,
  exportWorkshopLibraryJson,
  importWorkshopLibraryJson,
  librarySummary,
  listDoorStyleLibrary,
  listHardwareLibrary,
  mergeWorkshopLibraries,
} from "./libraryManager";
import { DEFAULT_PROJECT_STANDARDS } from "./projectStandards";
import {
  createTemplateFromCabinet,
  upsertUserTemplate,
} from "./cabinetTemplates";

describe("library manager", () => {
  it("ships built-in door and material libraries", () => {
    const pack = createEmptyWorkshopLibrary();
    expect(listDoorStyleLibrary(pack).length).toBeGreaterThanOrEqual(
      BUILTIN_DOOR_STYLE_LIBRARY.length,
    );
    expect(BUILTIN_MATERIAL_LIBRARY.length).toBeGreaterThan(0);
    expect(listHardwareLibrary(pack).length).toBeGreaterThan(0);
  });

  it("creates versioned user library entries and merges by version", () => {
    const config = getDefaultCabinetConfig("base");
    const preset = createCabinetPresetFromConfig(config, "Shop base 600");
    expect(preset.version).toBe(1);

    const door = createDoorStyleEntry("Shop bifold", "bi-fold");
    const material = createMaterialEntry(
      "Shop MDF",
      "mdf-painted",
      "white-matte",
      "abs-1mm",
    );
    const hardware = createHardwareEntry("Shop hinge", "hinge", 120);
    const countertop = createCountertopEntry("Shop top", {
      thicknessMm: 30,
      overhangFrontMm: 28,
      overhangSidesMm: 18,
    });
    const standards = createStandardsPackEntry(
      "Shop standards",
      {
        ...DEFAULT_PROJECT_STANDARDS,
        carcassThicknessMm: 16,
        countertopThicknessMm: 30,
      },
      "Local defaults",
    );

    const base = {
      ...createEmptyWorkshopLibrary(),
      cabinetPresets: [preset],
      doorStyles: [door],
      materials: [material],
      hardware: [hardware],
      countertops: [countertop],
      standardsPacks: [standards],
    };

    const bumped = {
      ...base,
      cabinetPresets: [{ ...preset, version: 2, label: "Shop base 600 v2" }],
    };

    const merged = mergeWorkshopLibraries(base, bumped);
    expect(merged.cabinetPresets[0]?.label).toBe("Shop base 600 v2");
    expect(merged.cabinetPresets[0]?.version).toBe(2);

    const summary = librarySummary(merged);
    expect(summary.cabinetPresets).toBe(1);
    expect(summary.doorStyles).toBeGreaterThan(0);
    expect(summary.standardsPacks).toBeGreaterThan(0);
  });

  it("round-trips library JSON import/export", () => {
    const pack = {
      ...createEmptyWorkshopLibrary(),
      doorStyles: [createDoorStyleEntry("Export door", "double")],
      cabinetPresets: [
        createCabinetPresetFromConfig(getDefaultCabinetConfig("wall"), "Wall pack"),
      ],
    };
    const json = exportWorkshopLibraryJson(pack);
    const imported = importWorkshopLibraryJson(json);
    expect(imported.doorStyles.some((item) => item.label === "Export door")).toBe(
      true,
    );
    expect(imported.cabinetPresets[0]?.label).toBe("Wall pack");
    expect(imported.schemaVersion).toBe(1);
  });

  it("bumps cabinet template versions on upsert by id", () => {
    const cabinet = {
      id: "cab-1",
      name: "Base A",
      config: getDefaultCabinetConfig("base"),
      placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" as const },
    };
    const template = createTemplateFromCabinet(cabinet, "Reusable base");
    const first = upsertUserTemplate([], template);
    expect(first[0]?.version).toBe(1);

    const second = upsertUserTemplate(first, {
      ...template,
      description: "Updated description",
    });
    expect(second[0]?.version).toBe(2);
    expect(second[0]?.description).toBe("Updated description");
  });
});
