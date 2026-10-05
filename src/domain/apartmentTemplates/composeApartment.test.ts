import { describe, expect, it } from "vitest";
import { validateInteriorProject, type RoomType } from "../interiorProject";
import { COMPOSER_TEST_NOW } from "./composers/bareRoom";
import {
  APARTMENT_SHELL_SPECS,
  ONE_BHK_SHELL_SPEC,
  buildApartmentShell,
  composeApartment,
  roomObjectsOverlapOpenings,
  type ApartmentTemplateSpec,
  type RoomComposition,
} from "./index";
import { roomIdByKey } from "./testSupport";

/** Light compose settings per room type — exercises the runner, not Phase 4 content. */
function demoCompose(roomType: RoomType): RoomComposition {
  switch (roomType) {
    case "kitchen":
      return { kind: "kitchen", options: { runSide: "north", wallCabinets: true, underCabinetLights: false } };
    case "bedroom":
      return { kind: "bedroom", options: { wardrobeSide: "east", pendants: false } };
    case "living-room":
      return { kind: "living", options: { tvWallSide: "north", featureWallPreset: "slat", coveLight: false, sofaSet: false } };
    case "bathroom":
      return { kind: "bathroom", options: { vanitySide: "north", mirrorRopeLight: false } };
    case "utility":
      return { kind: "utility" };
    case "office":
      return { kind: "study" };
    default:
      return { kind: "none" };
  }
}

function withCompose(
  spec: ApartmentTemplateSpec,
  pick: (room: ApartmentTemplateSpec["rooms"][number]) => RoomComposition,
): ApartmentTemplateSpec {
  return { ...spec, rooms: spec.rooms.map((room) => ({ ...room, compose: pick(room) })) };
}

const options = { now: COMPOSER_TEST_NOW };

describe("composeApartment runner", () => {
  it("compose:none rooms leave the shell unchanged for that room", () => {
    // Product shells are fully authored (Phases 4–5); keep the runner path covered.
    const bare = APARTMENT_SHELL_SPECS.filter((spec) =>
      spec.rooms.every((room) => room.compose.kind === "none" && !room.camera));
    for (const spec of bare) {
      expect(JSON.stringify(composeApartment(spec, options)), spec.id)
        .toBe(JSON.stringify(buildApartmentShell(spec, options)));
    }
    expect(true).toBe(true);
  });

  it("dispatches each room's composer into that room with the template id factory", () => {
    const spec = withCompose(ONE_BHK_SHELL_SPEC, (room) => {
      if (room.key === "kitchen") {
        return {
          kind: "kitchen",
          options: {
            layout: "L", runSide: "north", secondarySide: "west",
            wallCabinets: true, underCabinetLights: false,
          },
        };
      }
      if (room.key === "living") return { kind: "none" };
      return demoCompose(room.roomType);
    });
    const project = composeApartment(spec, options);
    const ids = roomIdByKey(project);
    const objectsIn = (key: string) => project.objects.filter((o) => o.roomId === ids.get(key));

    expect(validateInteriorProject(project).issues.filter((i) => i.severity === "error")).toEqual([]);
    for (const key of ["kitchen", "bedroom", "bath", "utility"]) {
      expect(objectsIn(key).length, key).toBeGreaterThan(0);
      expect(roomObjectsOverlapOpenings(project, ids.get(key)!), key).toEqual([]);
    }
    expect(objectsIn("living")).toEqual([]);
    expect(project.objects.every((o) => o.id.startsWith("apt-1bhk:"))).toBe(true);
    const kitchen = objectsIn("kitchen");
    expect(kitchen.filter((o) => o.id.includes("-leg-"))).toHaveLength(2);
    expect(kitchen.some((o) => o.catalogItemId === "kitchen-sink-1")).toBe(true);
    expect(kitchen.some((o) => o.catalogItemId === "kitchen-stove-electric-1")).toBe(true);
  });

  it("composed apartments are repeatable (D3) across all four specs", () => {
    for (const base of APARTMENT_SHELL_SPECS) {
      const spec = withCompose(base, (room) => demoCompose(room.roomType));
      const a = composeApartment(spec, options);
      const b = composeApartment(spec, options);
      expect(JSON.stringify(a), spec.id).toBe(JSON.stringify(b));
      expect(a.objects.length, spec.id).toBeGreaterThan(0);
      expect(validateInteriorProject(a).issues.filter((i) => i.severity === "error"), spec.id)
        .toEqual([]);
    }
  });
});
