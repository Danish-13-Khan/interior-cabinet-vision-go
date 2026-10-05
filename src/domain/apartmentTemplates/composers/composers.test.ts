import { describe, expect, it } from "vitest";
import { validateInteriorProject } from "../../interiorProject";
import { LIVING_ROOM_MATERIAL_IDS } from "../../livingRoom/materials";
import { resolveLightAttachment } from "../../livingRoom/lightAttachments";
import { reflowCabinetRunsForWalls } from "../../livingRoom/wardrobePlacement";
import { readCabinetIdentity } from "../../cabinetIdentity";
import { FRONT_SYSTEM_PARAMETER, DOOR_STYLE_PARAMETER } from "../../frontSystem";
import { bareRoom } from "./bareRoom";
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
import { longestFreePieceOnSide } from "./helpers";

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

  it("secondary legs land on the fixed-end span in world space (either wall direction)", () => {
    const bare = bareRoom("kitchen", 5000, 4200);
    const roomId = bare.activeRoomId;
    const cases = [
      { layout: "L", runSide: "north", secondarySide: "east" },
      { layout: "L", runSide: "north", secondarySide: "west" },
      { layout: "parallel", runSide: "north", secondarySide: "south" },
      { layout: "parallel", runSide: "south", secondarySide: "north" },
    ] as const;
    const directions = new Set<boolean>();
    for (const options of cases) {
      const label = `${options.layout} ${options.secondarySide}`;
      const needed = options.layout === "L" ? 1800 : 2700;
      const piece = longestFreePieceOnSide(bare, roomId, options.secondarySide, needed)!;
      const stored = bare.walls.find((wall) => wall.id === piece.wall.id)!;
      directions.add(stored.start.x === piece.wall.start.x && stored.start.z === piece.wall.start.z);
      const next = composeKitchen(bare, roomId, {
        ...options, wallCabinets: false, underCabinetLights: false,
      });
      const legs = next.objects.filter((o) => o.id.includes("-leg-"));
      const legWidth = legs.reduce((sum, o) => sum + o.dimensions.widthMm, 0);
      const slack = piece.lengthMm - legWidth;
      const fixedStart = piece.startAlongMm
        + (options.layout === "L" ? Math.min(600, slack) : slack / 2);
      const vertical = options.secondarySide === "east" || options.secondarySide === "west";
      const along = (o: (typeof legs)[number]) => (vertical ? o.position.z : o.position.x);
      const lo = Math.min(...legs.map((o) => along(o) - o.dimensions.widthMm / 2));
      const hi = Math.max(...legs.map((o) => along(o) + o.dimensions.widthMm / 2));
      const wallLo = vertical ? piece.wall.start.z : piece.wall.start.x;
      expect(lo, label).toBeCloseTo(wallLo + fixedStart, 0);
      expect(hi - lo, label).toBeCloseTo(legWidth, 0);
    }
    // Both stored directions (low→high and high→low) are exercised.
    expect(directions.size).toBe(2);
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
});
