import { describe, expect, it } from "vitest";
import { validateInteriorProject } from "../../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "../../livingRoom/materials";
import { resolveLightAttachment } from "../../livingRoom/lightAttachments";
import { reflowCabinetRunsForWalls } from "../../livingRoom/wardrobePlacement";
import { readCabinetIdentity } from "../../cabinetIdentity";
import { FRONT_SYSTEM_PARAMETER, DOOR_STYLE_PARAMETER } from "../../frontSystem";
import {
  APARTMENT_SHELL_SPECS,
  apartmentIdFactory,
  buildApartmentShell,
  composeApartment,
} from "../index";
import { bareRoom, COMPOSER_TEST_NOW } from "./bareRoom";
import {
  composeBathroom,
  composeBedroom,
  composeFoyer,
  composeKitchen,
  composeLiving,
  composeStudy,
  composeUtility,
  roomObjectsOverlapOpenings,
} from "./index";

describe("Phase 1 room composers", () => {
  it("composeKitchen delivers frontSystem, doorStyle, finishes, hosted appliances", () => {
    const bare = bareRoom("kitchen");
    const next = composeKitchen(bare, bare.activeRoomId, {
      layout: "straight",
      runSide: "north",
      wallCabinets: true,
      tallPantry: true,
      underCabinetLights: true,
      frontSystem: "gola",
      doorStyle: "shaker",
    });
    expect(validateInteriorProject(next).issues.filter((i) => i.severity === "error")).toEqual([]);
    expect(roomObjectsOverlapOpenings(next, bare.activeRoomId)).toEqual([]);
    const cabinet = next.objects.find((o) => o.kind === "cabinet" && o.category !== "filler")!;
    expect(cabinet.parameters[FRONT_SYSTEM_PARAMETER]).toBe("gola");
    expect(cabinet.parameters[DOOR_STYLE_PARAMETER]).toBe("shaker");
    expect(cabinet.materialSlots.fronts).toBe(LIVING_ROOM_MATERIAL_IDS.walnut);
    expect(next.objects.some((o) => o.catalogItemId === "kitchen-sink-1")).toBe(true);
    expect(next.objects.some((o) => o.catalogItemId === "kitchen-stove-electric-1")).toBe(true);
  });

  it("kitchen run avoids a door on the run wall", () => {
    const bare = bareRoom("kitchen", 5000, 3600);
    const next = composeKitchen(bare, bare.activeRoomId, {
      layout: "straight",
      runSide: "south",
      wallCabinets: false,
      underCabinetLights: false,
    });
    expect(roomObjectsOverlapOpenings(next, bare.activeRoomId)).toEqual([]);
    expect(next.objects.some((o) => o.kind === "cabinet")).toBe(true);
  });

  it("L and parallel secondary legs differ", () => {
    const bare = bareRoom("kitchen", 5000, 4200);
    const L = composeKitchen(bare, bare.activeRoomId, {
      layout: "L", runSide: "north", secondarySide: "east",
      wallCabinets: false, underCabinetLights: false,
    });
    const parallel = composeKitchen(bare, bare.activeRoomId, {
      layout: "parallel", runSide: "north", secondarySide: "south",
      wallCabinets: false, underCabinetLights: false,
    });
    expect(L.objects.filter((o) => o.id.includes("-leg-"))).toHaveLength(2);
    expect(parallel.objects.filter((o) => o.id.includes("-leg-"))).toHaveLength(3);
  });

  it("composeBedroom seeds almirah wardrobe", () => {
    const bare = bareRoom("bedroom");
    const next = composeBedroom(bare, bare.activeRoomId, {
      wardrobeSide: "east", bedAlongSide: "south",
    });
    const wardrobe = next.objects.find((o) => o.id.includes("wardrobe"))!;
    expect(readCabinetIdentity(wardrobe)?.familyId).toBe("frameless-standard-almirah");
    expect(readCabinetIdentity(wardrobe)?.cabinetType).toBe("almirah");
    expect(roomObjectsOverlapOpenings(next, bare.activeRoomId)).toEqual([]);
  });

  it("composeBedroom / composeLiving / composeBathroom validate", () => {
    for (const [type, compose] of [
      ["bedroom", (p: ReturnType<typeof bareRoom>, id: string) => composeBedroom(p, id, { wardrobeSide: "east" })],
      ["living-room", (p: ReturnType<typeof bareRoom>, id: string) => composeLiving(p, id, { tvWallSide: "east" })],
      ["bathroom", (p: ReturnType<typeof bareRoom>, id: string) => composeBathroom(p, id, { vanitySide: "east" })],
    ] as const) {
      const bare = bareRoom(type);
      const next = compose(bare, bare.activeRoomId);
      expect(validateInteriorProject(next).issues.filter((i) => i.severity === "error"), type).toEqual([]);
      expect(roomObjectsOverlapOpenings(next, bare.activeRoomId), type).toEqual([]);
    }
  });

  it("composeFoyer shoe is a base cabinet; utility/study validate", () => {
    const bare = bareRoom("custom", 3000, 2400);
    const next = composeFoyer(bare, bare.activeRoomId);
    const shoe = next.objects.find((o) => o.parameters.apartmentRole === "shoe-cabinet")!;
    expect(shoe.kind).toBe("cabinet");
    expect(readCabinetIdentity(shoe)?.familyId).toBe("frameless-standard-base");

    for (const [type, compose] of [
      ["utility", (p: ReturnType<typeof bareRoom>, id: string) => composeUtility(p, id)],
      ["office", (p: ReturnType<typeof bareRoom>, id: string) => composeStudy(p, id)],
    ] as const) {
      const room = bareRoom(type, 3000, 2400);
      const composed = compose(room, room.activeRoomId);
      expect(validateInteriorProject(composed).issues.filter((i) => i.severity === "error")).toEqual([]);
      expect(roomObjectsOverlapOpenings(composed, room.activeRoomId)).toEqual([]);
    }
  });

  it("under-cabinet lights attach to hosts and survive reflow", () => {
    const bare = bareRoom("kitchen", 5000, 3600);
    const roomId = bare.activeRoomId;
    let next = composeKitchen(bare, roomId, {
      runSide: "north", wallCabinets: true, underCabinetLights: true,
    });
    const hosted = next.lights.filter((light) =>
      light.roomId === roomId && light.parameters.hostObjectId,
    );
    expect(hosted.length).toBeGreaterThan(0);
    const hostId = String(hosted[0]!.parameters.hostObjectId);
    const host = next.objects.find((object) => object.id === hostId)!;
    const wallId = (host.extensions?.wallAttachment as { wallId?: string } | undefined)?.wallId;
    expect(wallId).toBeTruthy();
    const before = resolveLightAttachment(next, hosted[0]!);
    next = reflowCabinetRunsForWalls(next, [wallId!]);
    const after = resolveLightAttachment(next, next.lights.find((light) => light.id === hosted[0]!.id)!);
    expect(after.parameters.hostObjectId).toBe(hostId);
    expect(after.parameters.attachmentMissing).not.toBe(true);
    expect(Math.abs(after.position.x - before.position.x)).toBeLessThan(800);
  });

  it("composed shells are repeatable (D3) across all four specs", () => {
    for (const spec of APARTMENT_SHELL_SPECS) {
      const a = composeDemoContent(spec);
      const b = composeDemoContent(spec);
      expect(JSON.stringify(a), spec.id).toBe(JSON.stringify(b));
    }
  });
});

function composeDemoContent(spec: (typeof APARTMENT_SHELL_SPECS)[number]) {
  let project = buildApartmentShell(spec, { now: COMPOSER_TEST_NOW });
  const idFactory = apartmentIdFactory(spec.id);
  for (const room of project.rooms) {
    if (room.roomType === "kitchen") {
      project = composeKitchen(project, room.id, {
        runSide: "north", wallCabinets: true, idFactory, underCabinetLights: false,
      });
    } else if (room.roomType === "bedroom") {
      project = composeBedroom(project, room.id, { wardrobeSide: "east", idFactory, pendants: false });
    } else if (room.roomType === "living-room") {
      project = composeLiving(project, room.id, {
        tvWallSide: "north", featureWallPreset: "slat", idFactory, coveLight: false, sofaSet: false,
      });
    } else if (room.roomType === "bathroom") {
      project = composeBathroom(project, room.id, {
        vanitySide: "north", idFactory, mirrorRopeLight: false,
      });
    } else if (room.roomType === "utility") {
      project = composeUtility(project, room.id, { idFactory });
    }
  }
  void composeApartment(spec, { now: COMPOSER_TEST_NOW });
  return project;
}
