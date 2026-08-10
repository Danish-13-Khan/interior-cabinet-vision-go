import { describe, expect, it } from "vitest";
import {
  clampCabinetConfig,
  getCabinetValidationMessages,
  getDefaultCabinetConfig,
} from "./cabinetDimensions";
import { evaluateCabinetRules } from "./manufacturingRules";
import { defaultCabinetProject } from "./cabinetDimensions/defaults";

describe("shelf span on defaults", () => {
  it("default base includes a divider and has no shelf span error", () => {
    const base = getDefaultCabinetConfig("base");
    expect(base.composition?.dividers.count ?? 0).toBeGreaterThanOrEqual(1);
    expect(
      evaluateCabinetRules(base).filter((issue) => issue.code === "SHELF_SPAN"),
    ).toHaveLength(0);
    expect(
      getCabinetValidationMessages(base).filter((message) =>
        message.includes("Unsupported shelf span"),
      ),
    ).toHaveLength(0);
  });

  it("wide particle cabinets get enough dividers after clamp", () => {
    const wide = clampCabinetConfig({
      ...getDefaultCabinetConfig("base"),
      dimensions: {
        ...getDefaultCabinetConfig("base").dimensions,
        width: 1200,
      },
      shelfCount: 2,
      buildRules: {
        materialPresetId: "particle-economy",
        carcassThicknessMm: 18,
        backPanelThicknessMm: 6,
        shelfThicknessMm: 18,
        drawerBoxThicknessMm: 12,
        finishId: "laminate",
        edgeBandingId: "pvc-0.5mm",
        grainDirection: "lengthwise",
        backPanelType: "screwed",
      },
      composition: undefined,
    });
    expect(wide.composition?.dividers.count ?? 0).toBeGreaterThanOrEqual(1);
    expect(
      evaluateCabinetRules(wide).some((issue) => issue.code === "SHELF_SPAN"),
    ).toBe(false);
  });

  it("default project cabinets have no shelf span errors", () => {
    for (const cabinet of defaultCabinetProject.cabinets) {
      expect(
        getCabinetValidationMessages(cabinet.config, cabinet.placement).filter(
          (message) => message.includes("Unsupported shelf span"),
        ),
      ).toHaveLength(0);
    }
  });
});
