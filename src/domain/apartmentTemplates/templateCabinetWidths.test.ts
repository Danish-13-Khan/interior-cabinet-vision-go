import { describe, expect, it } from "vitest";
import { createCabinetCutlist, createCabinetGeometry } from "../cabinetGeometry";
import type { InteriorObjectEntity } from "../interiorProject";
import { cabinetFromObject } from "../interiorProject/cabinetAdapterCabinets";
import { cabinetFinishId } from "../livingRoom/cabinetFinish";
import { createCabinetProductionCutlist } from "../productionCutlist";
import { COMPOSER_TEST_NOW } from "./composers/bareRoom";
import { hingedWardrobeModuleWidths } from "./composers/wardrobeModules";
import { APARTMENT_TEMPLATE_IDS, composeApartment, finishIdForRoleMaterial, lookupApartmentTemplate } from "./index";
import { roomIdByKey } from "./testSupport";

const built = APARTMENT_TEMPLATE_IDS.map((id) => ({
  id, project: composeApartment(lookupApartmentTemplate(id)!, { now: COMPOSER_TEST_NOW }),
}));

/** Outer face to outer face of the 3D carcass sides (`createCabinetGeometry`, the clamped config the scene renders). */
function carcassWidth3dMm(object: InteriorObjectEntity): number {
  const panels = createCabinetGeometry(cabinetFromObject(object)!.config);
  const left = panels.find((panel) => panel.name === "left-side-panel")!;
  const right = panels.find((panel) => panel.name === "right-side-panel")!;
  return Math.round((right.position[0] + right.size[0] / 2 - (left.position[0] - left.size[0] / 2)) * 1000);
}

/** Top panel + two sides, from the legacy cut list and the production cut list. */
function cutlistWidthsMm(object: InteriorObjectEntity): { legacy: number; production: number } {
  const cabinet = cabinetFromObject(object)!;
  const legacy = createCabinetCutlist(cabinet.config).find((item) => item.key === "top-bottom-panels")!;
  const top = createCabinetProductionCutlist(cabinet).find((line) => line.partId === "top")!;
  return {
    legacy: legacy.lengthMm + 2 * legacy.thicknessMm,
    production: top.lengthMm + 2 * top.thicknessMm,
  };
}

describe("authored apartments: every cabinet is built at the width it is drawn", () => {
  it("3D carcass width and cut list width equal the object width (no silent family clamp)", () => {
    const mismatches: string[] = [];
    for (const { id, project } of built) {
      for (const object of project.objects.filter((item) => cabinetFromObject(item))) {
        const want = object.dimensions.widthMm;
        const got = { model: carcassWidth3dMm(object), ...cutlistWidthsMm(object) };
        if (got.model !== want || got.legacy !== want || got.production !== want) {
          mismatches.push(`${id} ${object.id} ${want}: ${JSON.stringify(got)}`);
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it("wide hinged wardrobes are runs of ≤ 900 mm almirah modules; sliding stays one carcass", () => {
    const runs = Object.fromEntries(built.map(({ id, project }) => {
      const keys = new Map([...roomIdByKey(project)].map(([key, roomId]) => [roomId, key]));
      const byRoom = new Map<string, number[]>();
      for (const object of project.objects.filter((item) => item.catalogItemId === "living:wardrobe-wall")) {
        const room = keys.get(object.roomId)!;
        byRoom.set(room, [...(byRoom.get(room) ?? []), object.dimensions.widthMm]);
      }
      return [id, Object.fromEntries([...byRoom].map(([room, widths]) => [room, widths.sort((a, b) => b - a)]))];
    }));
    expect(runs).toEqual({
      "template:apartment:studio:v1": { living: [1800] },
      "template:apartment:1bhk:v1": { bedroom: [900, 900] },
      "template:apartment:2bhk:v1": { master: [700, 700, 700], kids: [900, 900] },
      "template:apartment:3bhk:v1": { master: [2400], guest: [900, 900] },
    });
  });

  it("module runs share one cabinet run, butt without gaps and keep end panels only on the outer ends", () => {
    for (const { project } of built) {
      const groups = new Map<string, InteriorObjectEntity[]>();
      for (const object of project.objects) {
        const run = (object.extensions?.cabinetRun as { runId?: string } | undefined)?.runId;
        if (object.catalogItemId === "living:wardrobe-wall" && run) groups.set(run, [...(groups.get(run) ?? []), object]);
      }
      for (const members of groups.values()) {
        const span = members.reduce((sum, object) => sum + object.dimensions.widthMm, 0);
        const cx = members.reduce((sum, object) => sum + object.position.x, 0) / members.length;
        const cz = members.reduce((sum, object) => sum + object.position.z, 0) / members.length;
        // End panels in world space (local +x rotated by the object's Y rotation) sit just outside the run.
        const ends = members.flatMap((object) => createCabinetGeometry(cabinetFromObject(object)!.config)
          .filter((panel) => panel.name.endsWith("-end-panel"))
          .map((panel) => {
            const t = (object.rotation.y * Math.PI) / 180;
            const local = panel.position[0] * 1000;
            return Math.hypot(object.position.x + local * Math.cos(t) - cx, object.position.z - local * Math.sin(t) - cz);
          }));
        expect(ends).toHaveLength(2);
        for (const distance of ends) expect(Math.round(distance)).toBe(span / 2 + 9);
        const xs = members.map((object) => object.position.x);
        const zs = members.map((object) => object.position.z);
        const reach = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs));
        const outer = members.map((object) => object.dimensions.widthMm);
        expect(Math.round(reach)).toBe(span - (outer[0]! + outer[outer.length - 1]!) / 2);
      }
    }
  });

  it("every module carries the room's finish role and the wardrobe's front settings", () => {
    for (const { id, project } of built) {
      const wardrobes = project.objects.filter((object) => object.catalogItemId === "living:wardrobe-wall");
      for (const object of wardrobes) {
        expect(object.materialSlots.fronts, object.id).toBeTruthy();
        expect(cabinetFinishId(object), object.id).toBe(finishIdForRoleMaterial(object.materialSlots.fronts));
        const first = wardrobes.find((other) => other.roomId === object.roomId)!;
        const front = (o: InteriorObjectEntity) => [o.parameters.frontSystem, o.parameters.pushMechanism,
          o.parameters.doorStyle, o.parameters.doorSourcing, cabinetFinishId(o)];
        expect(front(object), `${id} ${object.id}`).toEqual(front(first));
      }
    }
    const master2bhk = built.find((entry) => entry.id === "template:apartment:2bhk:v1")!.project.objects.filter((object) => object.id.includes("wardrobe")
      && object.parameters.frontSystem === "push");
    expect(master2bhk.length).toBe(3);
  });

  it("module widths: even split on the 10 mm step, fewest modules, sum preserved", () => {
    expect(hingedWardrobeModuleWidths(900)).toEqual([900]);
    expect(hingedWardrobeModuleWidths(1800)).toEqual([900, 900]);
    expect(hingedWardrobeModuleWidths(2100)).toEqual([700, 700, 700]);
    expect(hingedWardrobeModuleWidths(1500)).toEqual([750, 750]);
    expect(hingedWardrobeModuleWidths(1795)).toEqual([900, 895]);
    expect(hingedWardrobeModuleWidths(2000)).toEqual([670, 670, 660]);
  });
});
