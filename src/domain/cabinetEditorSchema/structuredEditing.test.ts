import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig } from "../cabinetDimensions";
import {
  collectPropertyFieldIssues,
  diffCabinetVsProjectStandards,
  getCabinetEditorSections,
  mapManufacturingIssuesToFields,
  PROPERTY_GROUP_ORDER,
} from "./index";
import { evaluateCabinetRules } from "../manufacturingRules";
import { DEFAULT_PROJECT_STANDARDS } from "../projectStandards";

describe("structured property editing", () => {
  it("groups schema sections into engineering groups", () => {
    const config = getDefaultCabinetConfig("base");
    const sections = getCabinetEditorSections(config);
    const groups = new Set(sections.map((section) => section.group));

    expect(groups.has("dimensions")).toBe(true);
    expect(groups.has("construction")).toBe(true);
    expect(groups.has("openings")).toBe(true);
    expect(groups.has("materials")).toBe(true);
    expect(sections.every((section) => PROPERTY_GROUP_ORDER.includes(section.group))).toBe(
      true,
    );
  });

  it("hides flat doors/drawers when openings structure is present", () => {
    const config = getDefaultCabinetConfig("base");
    const ids = getCabinetEditorSections(config).map((section) => section.id);
    expect(ids).toContain("openings");
    expect(ids).not.toContain("doors");
    expect(ids).not.toContain("drawers");
  });

  it("uses family dimension limits on carcass fields", () => {
    const wall = getCabinetEditorSections(getDefaultCabinetConfig("wall"));
    const carcass = wall.find((section) => section.id === "dimensions");
    const depth = carcass?.fields.find((field) => field.id === "depth");
    expect(depth?.max).toBeLessThanOrEqual(400);
    expect(depth?.min).toBeLessThanOrEqual(300);
  });

  it("maps manufacturing issues onto schema fields", () => {
    const config = {
      ...getDefaultCabinetConfig("wall"),
      dimensions: { ...getDefaultCabinetConfig("wall").dimensions, depth: 900 },
    };
    const issues = evaluateCabinetRules(config, {
      placement: {
        x: 0,
        y: 400,
        z: 0,
        rotation: 0,
        attachment: "floor",
      },
    });
    const mapped = mapManufacturingIssuesToFields(issues);
    expect(Object.keys(mapped).length).toBeGreaterThan(0);
  });

  it("diffs materials against project standards", () => {
    const config = getDefaultCabinetConfig("base");
    const next = {
      ...config,
      buildRules: {
        ...(config.buildRules ?? {}),
        carcassThicknessMm: 25,
      },
    };
    const conflicts = diffCabinetVsProjectStandards(next, DEFAULT_PROJECT_STANDARDS);
    expect(conflicts.some((item) => item.fieldId === "carcassThicknessMm")).toBe(true);

    const fieldIssues = collectPropertyFieldIssues(next, [], DEFAULT_PROJECT_STANDARDS);
    expect(fieldIssues.carcassThicknessMm?.[0]?.code).toBe("STANDARDS_DIFF");
  });
});
