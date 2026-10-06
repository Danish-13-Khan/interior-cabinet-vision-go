import { describe, expect, it } from "vitest";
import { createCabinetConstruction } from "../cabinetConstruction/createConstruction";
import { createCabinetGeometry, createCabinetCutlist } from "../cabinetGeometry";
import { clampCabinetConfig } from "../cabinetDimensions";
import { calculateCabinetCost } from "../costing";
import { SLIDING_ROLLER_HARDWARE, SLIDING_TRACK_HARDWARE, WARDROBE_DOORS_PARAMETER, slidingDoorsOf } from "../frontSystem";
import { validateInteriorProject, type InteriorObjectEntity } from "../interiorProject";
import { cabinetFromObject } from "../interiorProject/cabinetAdapterCabinets";
import { cabinetFinishId } from "../livingRoom/cabinetFinish";
import { cabinetSceneRole } from "../livingRoom/cabinetSceneRoles";
import { createCabinetProductionCutlist } from "../productionCutlist";
import { bareRoom, COMPOSER_TEST_NOW } from "./composers/bareRoom";
import { composeBedroom } from "./composers/composeBedroom";
import { roomObjectsOverlapOpenings } from "./composers/openingOverlap";
import { APARTMENT_TEMPLATE_IDS, composeApartment, finishIdForRoleMaterial, lookupApartmentTemplate } from "./index";
import { roomIdByKey } from "./testSupport";

const built = Object.fromEntries(APARTMENT_TEMPLATE_IDS.map((id) => [
  id, composeApartment(lookupApartmentTemplate(id)!, { now: COMPOSER_TEST_NOW }),
]));

function wardrobes(id: (typeof APARTMENT_TEMPLATE_IDS)[number]) {
  const project = built[id]!;
  const keys = new Map([...roomIdByKey(project)].map(([key, roomId]) => [roomId, key]));
  return project.objects
    .filter((object) => /wardrobe/.test(object.catalogItemId ?? ""))
    .map((object) => ({ object, room: keys.get(object.roomId)!, cabinet: cabinetFromObject(object)! }));
}

const isSliding = (object: InteriorObjectEntity) => Boolean(slidingDoorsOf(cabinetFromObject(object)!.config));

describe("Phase 3: authored apartments use sliding wardrobes where the matrix says (§4)", () => {
  it("Studio and the 3 BHK master slide; 1 BHK, 2 BHK and the 3 BHK guest stay hinged", () => {
    const summary = Object.fromEntries(APARTMENT_TEMPLATE_IDS.map((id) => [
      // One entry per room: wide hinged wardrobes are runs of ≤ 900 mm modules.
      id, [...new Set(wardrobes(id).map(({ object, room }) => `${room}:${isSliding(object) ? "sliding" : "hinged"}`))].sort(),
    ]));
    expect(summary).toEqual({
      "template:apartment:studio:v1": ["living:sliding"],
      "template:apartment:1bhk:v1": ["bedroom:hinged"],
      "template:apartment:2bhk:v1": ["kids:hinged", "master:hinged"],
      "template:apartment:3bhk:v1": ["guest:hinged", "kids:hinged", "master:sliding"],
    });
    const corner = wardrobes("template:apartment:3bhk:v1").find(({ room }) => room === "kids")!;
    expect(corner.object.catalogItemId).toBe("living:corner-wardrobe");
    expect(corner.object.parameters.frontSystem).toBe("push");
  });

  const sliding = APARTMENT_TEMPLATE_IDS.flatMap((id) => wardrobes(id)
    .filter(({ object }) => isSliding(object)).map((entry) => ({ id, ...entry })));

  it("sliding wardrobes are seeded from the almirah family as wall wardrobes, front system handled", () => {
    expect(sliding).toHaveLength(2);
    for (const { object, cabinet } of sliding) {
      expect(object.catalogItemId).toBe("living:wardrobe-wall");
      expect(object.parameters[WARDROBE_DOORS_PARAMETER]).toBe("sliding");
      expect(cabinet.config.type).toBe("almirah");
      expect(cabinet.config.construction?.frontSystem).toBeUndefined();
      expect(object.dimensions.depthMm).toBe(600);
    }
  });

  it("shutters carry the role finish in the cut list, quote source and 3D (D9)", () => {
    for (const { id, object, cabinet } of sliding) {
      const roleFinish = finishIdForRoleMaterial(object.materialSlots.fronts);
      expect(cabinetFinishId(object), id).toBe(roleFinish);
      const shutters = createCabinetProductionCutlist(cabinet).filter((line) => line.category === "Door");
      expect(shutters.length, id).toBeGreaterThan(0);
      for (const line of shutters) expect(line.finish, `${id} ${line.label}`).toBe(roleFinish);
      const leaves = createCabinetGeometry(clampCabinetConfig(cabinet.config))
        .filter((panel) => panel.name.startsWith("sliding-shutter-"));
      expect(leaves.length, id).toBeGreaterThanOrEqual(2);
      for (const panel of leaves) expect(cabinetSceneRole(panel.name, panel.material)).toMatch(/fronts|glass/);
    }
  });

  it("cut list lists sliding panels; quote hardware has track + rollers and no hinges", () => {
    for (const { id, cabinet } of sliding) {
      const cutlist = createCabinetCutlist(cabinet.config);
      expect(cutlist.some((item) => item.key.startsWith("sliding-shutter")), id).toBe(true);
      expect(cutlist.some((item) => item.key === "doors"), id).toBe(false);
      const lines = createCabinetProductionCutlist(cabinet);
      const cost = calculateCabinetCost(cabinet, createCabinetConstruction(cabinet.config), lines);
      const ids = cost.hardwareLines.map((line) => line.id);
      expect(ids, id).toContain(SLIDING_TRACK_HARDWARE["bottom-roll"]);
      expect(ids, id).toContain(SLIDING_ROLLER_HARDWARE["bottom-roll"]);
      expect(cost.hardwareLines.filter((line) => line.kind === "hinge"), id).toEqual([]);
    }
  });

  it.each(["north", "south", "east", "west"] as const)(
    "composeBedroom sliding wardrobe on the %s wall keeps its footprint and clears openings", (side) => {
      const bare = bareRoom("bedroom");
      const next = composeBedroom(bare, bare.activeRoomId, {
        // 1500 fits beside the bare room's west window as well as on the other walls.
        wardrobeSide: side, wardrobeWidthMm: 1500, wardrobeDoors: "sliding",
        bedAlongSide: side === "north" ? "south" : "north",
      });
      const wardrobe = next.objects.find((object) => object.id.includes("wardrobe"))!;
      expect(isSliding(wardrobe)).toBe(true);
      expect(wardrobe.dimensions.depthMm).toBe(600);
      expect(roomObjectsOverlapOpenings(next, bare.activeRoomId)).toEqual([]);
      expect(validateInteriorProject(next).issues.filter((issue) => issue.severity === "error")).toEqual([]);
    },
  );
});
