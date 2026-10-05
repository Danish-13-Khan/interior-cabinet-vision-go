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

export const COMPOSER_TEST_NOW = "2026-10-05T00:00:00.000Z";

export type BareRoomType =
  | "kitchen" | "bedroom" | "living-room" | "bathroom" | "custom" | "utility" | "office";

export function bareRoom(roomType: BareRoomType, widthMm = 4200, depthMm = 3600) {
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
  const base = createEmptyInteriorProject({
    id: `bare-${roomType}`, name: roomType, now: COMPOSER_TEST_NOW,
  });
  return validateInteriorProject({
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
    extensions: {
      finishRoles: {
        carcass: LIVING_ROOM_MATERIAL_IDS.naturalOak,
        "front-primary": LIVING_ROOM_MATERIAL_IDS.walnut,
        "front-accent": LIVING_ROOM_MATERIAL_IDS.walnut,
        worktop: LIVING_ROOM_MATERIAL_IDS.warmStone,
        "wall-panel": LIVING_ROOM_MATERIAL_IDS.wallPaint,
        floor: LIVING_ROOM_MATERIAL_IDS.warmStone,
      },
    },
  }).project;
}
