import { describe, expect, it } from "vitest";
import { cabinetFinishId } from "../livingRoom/cabinetFinish";
import { LIVING_ROOM_MATERIAL_IDS } from "../livingRoom/materials";
import { COMPOSER_TEST_NOW } from "./composers/bareRoom";
import {
  APARTMENT_TEMPLATE_IDS,
  composeApartment,
  finishIdForRoleMaterial,
  lookupApartmentTemplate,
} from "./index";
import { ROLE_MAPPABLE_MATERIAL_IDS } from "./specs/finishRoles";

const specs = APARTMENT_TEMPLATE_IDS.map((id) => lookupApartmentTemplate(id)!);

describe("finish roles → production FinishId (D9)", () => {
  it("every role material in every template has an explicit FinishId mapping", () => {
    for (const spec of specs) {
      for (const [role, materialId] of Object.entries(spec.finishRoles)) {
        expect(ROLE_MAPPABLE_MATERIAL_IDS, `${spec.id} ${role}`).toContain(materialId);
      }
    }
  });

  it("an unmapped material throws instead of quoting oak", () => {
    expect(() => finishIdForRoleMaterial(LIVING_ROOM_MATERIAL_IDS.oliveFabric)).toThrow(/no production FinishId/);
  });

  it("2 BHK charcoal fronts are cut and quoted as grey, not oak", () => {
    const spec = lookupApartmentTemplate("template:apartment:2bhk:v1")!;
    expect(spec.finishRoles["front-primary"]).toBe(LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
    const project = composeApartment(spec, { now: COMPOSER_TEST_NOW });
    const primaryFronts = project.objects.filter((object) => object.kind === "cabinet"
      && object.category !== "filler"
      && object.materialSlots.fronts === LIVING_ROOM_MATERIAL_IDS.charcoalMetal);
    expect(primaryFronts.length).toBeGreaterThan(0);
    for (const cabinet of primaryFronts) expect(cabinetFinishId(cabinet), cabinet.id).toBe("grey");
  });

  it("built cabinets' production finish matches their front material in all templates", () => {
    for (const spec of specs) {
      const project = composeApartment(spec, { now: COMPOSER_TEST_NOW });
      for (const cabinet of project.objects.filter((object) => object.kind === "cabinet" && object.category !== "filler")) {
        const fronts = cabinet.materialSlots.fronts;
        if (!fronts) continue;
        expect(cabinetFinishId(cabinet), `${spec.id} ${cabinet.id}`).toBe(finishIdForRoleMaterial(fronts));
      }
    }
  });
});
