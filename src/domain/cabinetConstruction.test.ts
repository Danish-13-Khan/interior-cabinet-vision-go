import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig } from "./cabinetDimensions";
import { createCabinetConstruction } from "./cabinetConstruction";
import { normalizeConstructionSpec } from "./cabinetConstructionSpec";
import { resolveCabinetMaterialSpec } from "./materialSystem";

describe("cabinet construction", () => {
  it("creates drawer box parts for drawer cabinets", () => {
    const construction = createCabinetConstruction(getDefaultCabinetConfig("drawer"));

    expect(construction.parts.some((part) => part.category === "DrawerBox")).toBe(true);
    expect(construction.parts.some((part) => part.category === "DrawerFront")).toBe(true);
    expect(construction.constructionSpec.drawerBoxStyle).toBeTruthy();
  });

  it("removes back panel parts for open shelf cabinets with no back rule", () => {
    const config = getDefaultCabinetConfig("open-shelf");
    const construction = createCabinetConstruction(config);

    expect(construction.parts.some((part) => part.category === "Back")).toBe(false);
  });

  it("applies grooved back rebate sizing", () => {
    const construction = createCabinetConstruction({
      ...getDefaultCabinetConfig("base"),
      buildRules: {
        ...getDefaultCabinetConfig("base").buildRules,
        backPanelType: "grooved",
      },
      construction: normalizeConstructionSpec("base", undefined),
    });
    const back = construction.parts.find((part) => part.category === "Back");
    expect(back?.notes).toMatch(/Grooved/i);
  });
});

describe("material preset resolution", () => {
  it("applies particle economy build defaults", () => {
    const spec = resolveCabinetMaterialSpec({
      materialPresetId: "particle-economy",
      finishId: "grey",
    });

    expect(spec.carcassMaterial.boardMaterialId).toBe("particle");
    expect(spec.doorMaterial.finishId).toBe("grey");
  });
});
