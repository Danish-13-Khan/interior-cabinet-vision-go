import { describe, expect, it } from "vitest";
import type { InteriorObjectEntity } from "../interiorProject";
import { COMPOSER_TEST_NOW } from "./composers/bareRoom";
import { objectBox, objectsCollide } from "./composers/objectBounds";
import { APARTMENT_TEMPLATE_IDS, composeApartment, lookupApartmentTemplate } from "./index";

/** Floor coverings are meant to sit under furniture. */
const isFloorCovering = (object: InteriorObjectEntity) => object.catalogItemId === "living:area-rug";

/**
 * Intentional stacks. The drop-in sink and hob sit on the worktop and their
 * catalog envelope (900 mm tall) reaches up into the wall run above them.
 */
const ALLOWED_STACKS: ReadonlyArray<readonly [string, string]> = [
  ["living:wall-cabinet-900", "kitchen-sink-1"],
  ["living:wall-cabinet-900", "kitchen-stove-electric-1"],
];
const allowed = (a: InteriorObjectEntity, b: InteriorObjectEntity) => ALLOWED_STACKS.some(([x, y]) =>
  (a.catalogItemId === x && b.catalogItemId === y) || (a.catalogItemId === y && b.catalogItemId === x));

function collisions(templateId: string): string[] {
  const project = composeApartment(lookupApartmentTemplate(templateId)!, { now: COMPOSER_TEST_NOW });
  const hits: string[] = [];
  for (const room of project.rooms) {
    const objects = project.objects.filter((object) => object.roomId === room.id && !isFloorCovering(object));
    objects.forEach((a, index) => {
      for (const b of objects.slice(index + 1)) {
        if (objectsCollide(a, b) && !allowed(a, b)) hits.push(`${room.name}: ${a.catalogItemId} × ${b.catalogItemId}`);
      }
    });
  }
  return hits;
}

describe("apartment templates: no two objects in a room occupy the same space", () => {
  it.each(APARTMENT_TEMPLATE_IDS)("%s", (templateId) => {
    expect(collisions(templateId)).toEqual([]);
  });

  it("the TV unit stands on the feature panel's face, not through it", () => {
    const project = composeApartment(lookupApartmentTemplate("template:apartment:2bhk:v1")!, { now: COMPOSER_TEST_NOW });
    const living = project.objects.filter((object) => object.id.includes(":room-2-"));
    const tv = objectBox(living.find((object) => object.catalogItemId === "living:tv-unit")!);
    const panel = objectBox(living.find((object) => object.catalogItemId === "living:wall-panel-full")!);
    expect(tv.minZ).toBeCloseTo(panel.maxZ, 3);
    // The panel is centred behind the console, so it reads as a backdrop rather than a box under one end.
    expect((panel.minX + panel.maxX) / 2).toBeCloseTo((tv.minX + tv.maxX) / 2, 0);
  });
});
