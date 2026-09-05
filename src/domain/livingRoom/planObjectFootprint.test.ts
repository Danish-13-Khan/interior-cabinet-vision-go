import { describe, expect, it } from "vitest";
import type { InteriorObjectEntity } from "../interiorProject";
import {
  isKitchenAppliancePlanObject,
  planObjectFootprintClass,
  planObjectFootprintKind,
} from "./planObjectFootprint";

function minimalObject(
  overrides: Partial<InteriorObjectEntity> & Pick<InteriorObjectEntity, "catalogItemId" | "category">,
): InteriorObjectEntity {
  return {
    id: overrides.id ?? "obj-1",
    roomId: overrides.roomId ?? "room-1",
    kind: overrides.kind ?? "furniture",
    category: overrides.category,
    catalogItemId: overrides.catalogItemId,
    name: overrides.name ?? "Object",
    position: overrides.position ?? { x: 0, y: 0, z: 0 },
    rotation: overrides.rotation ?? { x: 0, y: 0, z: 0 },
    dimensions: overrides.dimensions ?? { widthMm: 600, heightMm: 900, depthMm: 600 },
    materialSlots: overrides.materialSlots ?? {},
    parameters: overrides.parameters ?? {},
    extensions: overrides.extensions,
  };
}

describe("planObjectFootprint", () => {
  it("maps sink identity to appliance footprint", () => {
    const object = minimalObject({
      category: "storage",
      catalogItemId: "cabinet:sink",
      kind: "cabinet",
      name: "Sink",
    });
    expect(planObjectFootprintKind(object)).toBe("appliance");
    expect(isKitchenAppliancePlanObject(object)).toBe(true);
    expect(planObjectFootprintClass(object)).toBe("is-footprint-appliance");
  });

  it("treats kenney fridge as appliance footprint", () => {
    const object = minimalObject({
      category: "kitchen-and-appliances",
      catalogItemId: "kenney:kitchen-fridge",
      name: "Fridge",
    });
    expect(isKitchenAppliancePlanObject(object)).toBe(true);
    expect(planObjectFootprintKind(object)).toBe("appliance");
    expect(planObjectFootprintClass(object)).toBe("is-footprint-appliance");
  });

  it("treats stove, hood, and microwave as appliances", () => {
    for (const catalogItemId of [
      "kenney:kitchen-stove-electric",
      "kenney:kitchen-hood",
      "kenney:kitchen-microwave",
    ]) {
      const object = minimalObject({
        category: "kitchen-and-appliances",
        catalogItemId,
      });
      expect(planObjectFootprintKind(object)).toBe("appliance");
      expect(planObjectFootprintClass(object)).toBe("is-footprint-appliance");
    }
  });

  it("does not treat kitchen-cabinet presentation prop as appliance", () => {
    const object = minimalObject({
      category: "kitchen-and-appliances",
      catalogItemId: "kenney:kitchen-cabinet",
      name: "Kitchen Cabinet",
    });
    expect(isKitchenAppliancePlanObject(object)).toBe(false);
    expect(planObjectFootprintKind(object)).toBeNull();
    expect(planObjectFootprintClass(object)).toBe("");
  });

  it("maps base cabinet identity to base footprint", () => {
    const object = minimalObject({
      category: "storage",
      catalogItemId: "living:base-cabinet-900",
      kind: "cabinet",
      name: "Base",
    });
    expect(planObjectFootprintKind(object)).toBe("base");
    expect(planObjectFootprintClass(object)).toBe("is-footprint-base");
    expect(isKitchenAppliancePlanObject(object)).toBe(false);
  });
});
