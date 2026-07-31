import { describe, expect, it } from "vitest";
import {
  clampCabinetProject,
  getDefaultCabinetConfig,
  type CabinetInstance,
} from "./cabinetDimensions";
import {
  applyStandardsToConfig,
  createConfigFromFamily,
  createConfigFromLibraryItem,
  getCabinetLibraryItem,
  listCabinetLibraryItems,
  listLibraryGroups,
} from "./cabinetLibraryCatalog";
import {
  clampProjectStandards,
  DEFAULT_PROJECT_STANDARDS,
} from "./projectStandards";
import {
  createConfigFromTemplate,
  createProjectFromStarter,
  createTemplateFromCabinet,
  upsertUserTemplate,
} from "./cabinetTemplates";

describe("project standards", () => {
  it("clamps and applies standards to new cabinet configs", () => {
    const standards = clampProjectStandards({
      carcassThicknessMm: 16,
      backPanelThicknessMm: 8,
      toeKickHeightMm: 120,
      toeKickInsetMm: 50,
      materialPresetId: "mdf-painted",
      finishId: "white-matte",
      edgeBandingId: "abs-2mm",
    });

    const config = createConfigFromFamily("base", standards);
    expect(config.dimensions.boardThickness).toBe(16);
    expect(config.dimensions.backPanelThickness).toBe(8);
    expect(config.toeKickHeight).toBe(120);
    expect(config.buildRules?.materialPresetId).toBe("mdf-painted");
    expect(config.buildRules?.finishId).toBe("white-matte");

    const wall = applyStandardsToConfig(getDefaultCabinetConfig("wall"), standards);
    expect(wall.toeKickHeight).toBe(0);
  });

  it("persists standards through clampCabinetProject", () => {
    const project = clampCabinetProject({
      version: 1,
      cabinets: [],
      preferences: {
        snapSizeMm: 50,
        showGrid: true,
        autoSaveToBrowser: true,
        standards: {
          ...DEFAULT_PROJECT_STANDARDS,
          carcassThicknessMm: 16,
        },
      },
    });

    expect(project.preferences?.standards?.carcassThicknessMm).toBe(16);
  });
});

describe("cabinet library catalog", () => {
  it("exposes family defaults and engineered presets", () => {
    const items = listCabinetLibraryItems();
    expect(items.some((item) => item.id === "family-base")).toBe(true);
    expect(items.some((item) => item.source === "engineered")).toBe(true);
    expect(listLibraryGroups().length).toBeGreaterThan(0);

    const engineered = getCabinetLibraryItem("engineered-base-900-double-door");
    expect(engineered).not.toBeNull();
    const config = createConfigFromLibraryItem(
      "engineered-base-900-double-door",
      DEFAULT_PROJECT_STANDARDS,
    );
    expect(config?.type).toBe("base");
    expect(config?.hasDoors).toBe(true);
  });
});

describe("cabinet templates", () => {
  it("saves a cabinet as a reusable template and recreates config", () => {
    const cabinet: CabinetInstance = {
      id: "cab-1",
      name: "My Base",
      placement: { x: 0, y: 0, z: 0, rotation: 0, attachment: "floor" },
      config: getDefaultCabinetConfig("base"),
    };
    const template = createTemplateFromCabinet(cabinet, "Kitchen Base Template");
    const store = upsertUserTemplate([], template);
    expect(store).toHaveLength(1);

    const rebuilt = createConfigFromTemplate(template, {
      ...DEFAULT_PROJECT_STANDARDS,
      carcassThicknessMm: 16,
    });
    expect(rebuilt.type).toBe("base");
    expect(rebuilt.dimensions.boardThickness).toBe(16);
  });

  it("creates kitchen starter projects from library items", () => {
    const starter = createProjectFromStarter("kitchen-base-run", DEFAULT_PROJECT_STANDARDS);
    expect(starter).not.toBeNull();
    expect(starter!.project.cabinets.length).toBe(3);
    expect(starter!.project.preferences?.standards).toBeDefined();
  });
});
