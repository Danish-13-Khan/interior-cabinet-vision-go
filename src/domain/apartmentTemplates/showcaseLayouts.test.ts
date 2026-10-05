import { describe, expect, it } from "vitest";
import { COMPOSER_TEST_NOW } from "./composers/bareRoom";
import {
  APARTMENT_TEMPLATE_IDS,
  composeApartment,
  lookupApartmentTemplate,
  roomObjectsOverlapOpenings,
} from "./index";
import { builtKitchenLayout, hostedObjectCollisions, kitchenLegClashes } from "./builtLayout";
import { roomIdByKey } from "./testSupport";

const built = APARTMENT_TEMPLATE_IDS.map((id) => {
  const spec = lookupApartmentTemplate(id)!;
  return { id, spec, project: composeApartment(spec, { now: COMPOSER_TEST_NOW }) };
});

describe("showcase layouts read from the built project", () => {
  it("each kitchen builds the layout its spec asks for, legs clear of the primary run", () => {
    for (const { id, spec, project } of built) {
      const ids = roomIdByKey(project);
      for (const room of spec.rooms) {
        if (room.compose.kind !== "kitchen") continue;
        const roomId = ids.get(room.key)!;
        const wanted = room.compose.options?.layout ?? "straight";
        expect(builtKitchenLayout(project, roomId), `${id} ${room.key}`).toBe(wanted);
        expect(kitchenLegClashes(project, roomId), `${id} ${room.key}`).toEqual([]);
      }
    }
  });

  it("2 BHK parallel kitchen has a real second run on the opposite wall", () => {
    const { project } = built.find((item) => item.id === "template:apartment:2bhk:v1")!;
    const kitchenId = roomIdByKey(project).get("kitchen")!;
    const legs = project.objects.filter((o) => o.roomId === kitchenId && o.id.includes("-leg-"));
    expect(legs.length).toBeGreaterThanOrEqual(2);
    expect(builtKitchenLayout(project, kitchenId)).toBe("parallel");
  });

  it("every living room gets a TV unit; hosted objects never stack on each other", () => {
    for (const { id, spec, project } of built) {
      const ids = roomIdByKey(project);
      for (const room of spec.rooms) {
        const roomId = ids.get(room.key)!;
        if (room.compose.kind === "living") {
          expect(project.objects.some((o) => o.roomId === roomId && o.catalogItemId === "living:tv-unit"),
            `${id} ${room.key} tv`).toBe(true);
        }
        expect(hostedObjectCollisions(project, roomId), `${id} ${room.key}`).toEqual([]);
      }
    }
  });

  it("no wall-hosted object (decor and mirrors included) covers a door, window or arch", () => {
    for (const { id, project } of built) {
      for (const room of project.rooms) {
        expect(roomObjectsOverlapOpenings(project, room.id).map((o) => o.id),
          `${id} ${room.extensions?.apartmentRoomKey}`).toEqual([]);
      }
    }
  });
});
