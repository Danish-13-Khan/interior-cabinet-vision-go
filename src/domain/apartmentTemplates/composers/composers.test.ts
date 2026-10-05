import { describe, expect, it } from "vitest";
import {
  createEmptyInteriorProject,
  validateInteriorProject,
} from "../../interiorProject";
import { createRectangularRoomShell } from "../../interiorFoundation";
import {
  createLivingRoomMaterials,
  LIVING_ROOM_MATERIAL_IDS,
} from "../../livingRoom/materials";
import { defaultLivingRoomIdFactory } from "../../livingRoom/ids";
import { resolveLightAttachment } from "../../livingRoom/lightAttachments";
import { reflowCabinetRunsForWalls } from "../../livingRoom/wardrobePlacement";
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

const NOW = "2026-10-05T00:00:00.000Z";

type BareRoomType =
  | "kitchen" | "bedroom" | "living-room" | "bathroom" | "custom" | "utility" | "office";

function bareRoom(roomType: BareRoomType, widthMm = 4200, depthMm = 3600) {
  const idFactory = defaultLivingRoomIdFactory;
  const roomId = idFactory("room", roomType);
  const shell = createRectangularRoomShell({
    roomId,
    dimensions: { widthMm, depthMm, heightMm: 2850, wallThicknessMm: 120 },
    wallMaterialId: LIVING_ROOM_MATERIAL_IDS.wallPaint,
    openings: [
      {
        key: "door",
        wallSide: "front",
        kind: "door",
        offsetMm: 400,
        widthMm: 900,
        heightMm: 2100,
        sillHeightMm: 0,
        swingDirection: "in",
      },
      {
        key: "window",
        wallSide: "left",
        kind: "window",
        offsetMm: 800,
        widthMm: 1200,
        heightMm: 1300,
        sillHeightMm: 900,
      },
    ],
    idFactory,
  });
  const base = createEmptyInteriorProject({ id: `bare-${roomType}`, name: roomType, now: NOW });
  const document = {
    ...base,
    activeRoomId: roomId,
    rooms: [{
      id: roomId,
      name: roomType,
      roomType,
      dimensions: { widthMm, heightMm: 2850, depthMm },
      wallThicknessMm: 120,
      extensions: {
        floorMaterialId: LIVING_ROOM_MATERIAL_IDS.warmStone,
        ceilingMaterialId: LIVING_ROOM_MATERIAL_IDS.ceilingPaint,
      },
    }],
    walls: shell.walls.map((wall) => ({ ...wall, raised: true })),
    openings: shell.openings,
    materials: createLivingRoomMaterials(),
  };
  return validateInteriorProject(document).project;
}

describe("Phase 1 room composers", () => {
  it("composeKitchen on a bare kitchen yields a valid project", () => {
    const bare = bareRoom("kitchen");
    const next = composeKitchen(bare, bare.activeRoomId, {
      layout: "straight",
      runSide: "north",
      wallCabinets: true,
      tallPantry: true,
      underCabinetLights: true,
    });
    const result = validateInteriorProject(next);
    expect(result.issues.filter((i) => i.severity === "error")).toEqual([]);
    expect(next.objects.some((o) => o.kind === "cabinet")).toBe(true);
    expect(roomObjectsOverlapOpenings(next, bare.activeRoomId)).toEqual([]);
  });

  it("composeBedroom / composeLiving / composeBathroom validate", () => {
    for (const [type, compose] of [
      ["bedroom", (p: ReturnType<typeof bareRoom>, id: string) => composeBedroom(p, id, { wardrobeSide: "east" })],
      ["living-room", (p: ReturnType<typeof bareRoom>, id: string) => composeLiving(p, id, { tvWallSide: "north" })],
      ["bathroom", (p: ReturnType<typeof bareRoom>, id: string) => composeBathroom(p, id, { vanitySide: "north" })],
    ] as const) {
      const bare = bareRoom(type);
      const next = compose(bare, bare.activeRoomId);
      const result = validateInteriorProject(next);
      expect(result.issues.filter((i) => i.severity === "error"), type).toEqual([]);
      expect(roomObjectsOverlapOpenings(next, bare.activeRoomId), type).toEqual([]);
    }
  });

  it("composeFoyer / composeUtility / composeStudy validate", () => {
    for (const [type, compose] of [
      ["custom", (p: ReturnType<typeof bareRoom>, id: string) => composeFoyer(p, id)],
      ["utility", (p: ReturnType<typeof bareRoom>, id: string) => composeUtility(p, id)],
      ["office", (p: ReturnType<typeof bareRoom>, id: string) => composeStudy(p, id)],
    ] as const) {
      const bare = bareRoom(type, 3000, 2400);
      const next = compose(bare, bare.activeRoomId);
      const result = validateInteriorProject(next);
      expect(result.issues.filter((i) => i.severity === "error"), type).toEqual([]);
      expect(roomObjectsOverlapOpenings(next, bare.activeRoomId), type).toEqual([]);
    }
  });

  it("under-cabinet lights attach to hosts and survive reflow", () => {
    const bare = bareRoom("kitchen", 5000, 3600);
    const roomId = bare.activeRoomId;
    let next = composeKitchen(bare, roomId, {
      runSide: "north",
      wallCabinets: true,
      underCabinetLights: true,
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
    const afterLight = next.lights.find((light) => light.id === hosted[0]!.id)!;
    const after = resolveLightAttachment(next, afterLight);
    expect(after.parameters.hostObjectId).toBe(hostId);
    expect(after.parameters.attachmentMissing).not.toBe(true);
    expect(Math.abs(after.position.x - before.position.x)).toBeLessThan(800);
  });
});
