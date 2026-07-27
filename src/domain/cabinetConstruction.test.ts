import { describe, expect, it } from "vitest";
import { getDefaultCabinetConfig } from "./cabinetDimensions";
import { createCabinetConstruction } from "./cabinetConstruction";
import { resolveCabinetMaterialSpec } from "./materialSystem";

describe("cabinet construction", () => {
  it("creates drawer box parts for drawer cabinets", () => {
    const construction = createCabinetConstruction(getDefaultCabinetConfig("drawer"));

    expect(construction.parts.some((part) => part.category === "DrawerBox")).toBe(true);
    expect(construction.parts.some((part) => part.category === "DrawerFront")).toBe(true);
  });

  it("removes back panel parts for open shelf cabinets with no back rule", () => {
    const config = getDefaultCabinetConfig("open-shelf");
    const construction = createCabinetConstruction(config);

    expect(construction.parts.some((part) => part.category === "Back")).toBe(false);
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
