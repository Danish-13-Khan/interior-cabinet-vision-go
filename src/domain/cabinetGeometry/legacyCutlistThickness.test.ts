import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig, type CabinetConfig } from "../cabinetDimensions";
import { createCabinetConstruction } from "../cabinetConstruction/createConstruction";
import { normalizeConstructionSpec } from "../cabinetConstructionSpec";
import { createCabinetCutlist } from "./cutlist";

/** Build rules that differ from the 18 mm board default, so a list still reading `dimensions` would disagree. */
function withRules(frontStyle?: { style: "shaker"; sourcing: "in-house" }): CabinetConfig {
  const config = getDefaultCabinetConfig("base");
  return {
    ...config,
    dimensions: { ...config.dimensions, boardThickness: 18, backPanelThickness: 6 },
    buildRules: { ...config.buildRules!, carcassThicknessMm: 16, shelfThicknessMm: 25, backPanelThicknessMm: 9 },
    construction: { ...normalizeConstructionSpec("base", config.construction), frontStyle },
  };
}

describe("legacy cut list thickness comes from the build rules, like production", () => {
  it("sides, shelves, back and doors match production thickness", () => {
    const config = withRules();
    const legacy = new Map(createCabinetCutlist(config).map((item) => [item.key, item.thicknessMm]));
    const parts = createCabinetConstruction(config).parts;
    const production = (prefix: string) => parts.find((part) => part.id.startsWith(prefix))!.thicknessMm;
    expect(production("left-side")).toBe(16);
    expect(legacy.get("side-panels")).toBe(production("left-side"));
    expect(legacy.get("shelves")).toBe(production("shelf"));
    expect(legacy.get("back-panel")).toBe(parts.find((part) => part.id === "back")!.thicknessMm);
    expect(legacy.get("doors")).toBe(production("door"));
  });

  it("in-house shaker frames and panel follow the carcass rule in both lists", () => {
    const config = withRules({ style: "shaker", sourcing: "in-house" });
    const legacy = createCabinetCutlist(config)
      .filter((item) => item.key.startsWith("door"))
      .flatMap((item) => Array.from({ length: item.quantity }, () => `${item.lengthMm}x${item.widthMm}x${item.thicknessMm}`)).sort();
    const production = createCabinetConstruction(config).parts
      .filter((part) => part.category === "Door")
      .flatMap((part) => Array.from({ length: part.quantity }, () => `${part.lengthMm}x${part.widthMm}x${part.thicknessMm}`)).sort();
    expect(legacy).toEqual(production);
    expect(legacy.some((row) => row.endsWith("x8"))).toBe(true);
  });
});
