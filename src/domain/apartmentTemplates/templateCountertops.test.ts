import { describe, expect, it } from "vitest";
import { compileCabinetRunExtras } from "../livingRoom/cabinetSceneRunExtras";
import { COMPOSER_TEST_NOW } from "./composers/bareRoom";
import { objectBox } from "./composers/objectBounds";
import { APARTMENT_TEMPLATE_IDS, composeApartment, lookupApartmentTemplate } from "./index";

const built = APARTMENT_TEMPLATE_IDS.map((id) => ({
  id,
  project: composeApartment(lookupApartmentTemplate(id)!, { now: COMPOSER_TEST_NOW }),
}));

describe("apartment run countertops sit on their cabinets", () => {
  it.each(built.map((entry) => [entry.id, entry] as const))("%s", (_id, { project }) => {
    let tops = 0;
    for (const room of project.rooms) {
      for (const node of compileCabinetRunExtras({ ...project, activeRoomId: room.id })) {
        tops += 1;
        const hosts = project.objects.filter((object) => String(node.metadata.cabinetIds).split(",").includes(object.id));
        expect(hosts.length, node.id).toBeGreaterThan(0);
        const boxes = hosts.map(objectBox);
        const label = `${room.name} ${node.id}`;
        // Off-centre rooms used to get their tops clamped into a room centred on the origin.
        expect(node.positionMm.x, label).toBeGreaterThanOrEqual(Math.min(...boxes.map((box) => box.minX)));
        expect(node.positionMm.x, label).toBeLessThanOrEqual(Math.max(...boxes.map((box) => box.maxX)));
        expect(node.positionMm.z, label).toBeGreaterThanOrEqual(Math.min(...boxes.map((box) => box.minZ)));
        expect(node.positionMm.z, label).toBeLessThanOrEqual(Math.max(...boxes.map((box) => box.maxZ)));
        // Worktops only on base-height cabinets (never on a corner wardrobe).
        for (const host of hosts) expect(host.dimensions.heightMm, label).toBeLessThanOrEqual(1200);
      }
    }
    expect(tops).toBeGreaterThan(0);
  });
});
