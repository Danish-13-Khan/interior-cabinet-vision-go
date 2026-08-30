import { createRectangularRoomShell } from "../../interiorFoundation";
import {
  createEmptyInteriorProject,
  type InteriorProject,
} from "../../interiorProject";
import { createLivingRoomLights } from "../lighting";
import { createLivingRoomMaterials, LIVING_ROOM_MATERIAL_IDS } from "../materials";
import {
  GOLDEN_CABINET_RUN_ID,
  GOLDEN_CABINET_RUN_NAME,
  GOLDEN_RUN_ROOM,
  GOLDEN_RUN_ROOM_ID,
  goldenRunIdFactory,
} from "./types";

export function createGoldenRunRoomProject(now: string): InteriorProject {
  const roomId = GOLDEN_RUN_ROOM_ID;
  const shell = createRectangularRoomShell({
    roomId,
    dimensions: GOLDEN_RUN_ROOM,
    wallMaterialId: LIVING_ROOM_MATERIAL_IDS.wallPaint,
    openings: [
      {
        key: "entry-door",
        wallSide: "front",
        kind: "door",
        offsetMm: 400,
        widthMm: 900,
        heightMm: 2100,
        sillHeightMm: 0,
        swingDirection: "in",
        extensions: { hinge: "left" },
      },
      {
        key: "picture-window",
        wallSide: "left",
        kind: "window",
        offsetMm: 600,
        widthMm: 1200,
        heightMm: 1300,
        sillHeightMm: 750,
      },
    ],
    idFactory: goldenRunIdFactory,
  });
  const base = createEmptyInteriorProject({
    id: GOLDEN_CABINET_RUN_ID,
    name: GOLDEN_CABINET_RUN_NAME,
    now,
  });
  return {
    ...base,
    activeRoomId: roomId,
    rooms: [
      {
        id: roomId,
        name: "Kitchen run",
        roomType: "living-room",
        dimensions: {
          widthMm: GOLDEN_RUN_ROOM.widthMm,
          heightMm: GOLDEN_RUN_ROOM.heightMm,
          depthMm: GOLDEN_RUN_ROOM.depthMm,
        },
        wallThicknessMm: GOLDEN_RUN_ROOM.wallThicknessMm,
        extensions: {
          floorMaterialId: LIVING_ROOM_MATERIAL_IDS.warmStone,
          ceilingMaterialId: LIVING_ROOM_MATERIAL_IDS.ceilingPaint,
        },
      },
    ],
    walls: shell.walls,
    openings: shell.openings,
    materials: createLivingRoomMaterials(),
    lights: createLivingRoomLights(roomId, "neutral-studio", goldenRunIdFactory),
  };
}
