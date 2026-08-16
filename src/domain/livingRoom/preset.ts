import {
  createEmptyInteriorProject,
  validateInteriorProject,
  type InteriorProject,
} from "../interiorProject";
import {
  createRectangularRoomShell,
  type RoomOpeningSeed,
} from "../interiorFoundation";
import { createLivingRoomCameras } from "./cameras";
import { createLivingRoomObject } from "./catalog";
import {
  defaultLivingRoomIdFactory,
  type LivingRoomIdFactory,
} from "./ids";
import {
  createLivingRoomLights,
  type LivingRoomLightingRecipeId,
} from "./lighting";
import {
  createLivingRoomMaterials,
  LIVING_ROOM_MATERIAL_IDS,
} from "./materials";
import { applyLivingRoomStyle } from "./stylePresets";
import { LIVING_ROOM_STARTER_LAYOUT } from "./starterLayout";

export const LIVING_ROOM_PRESET_ID = "living-room-starter";
export const LIVING_ROOM_PRESET_VERSION = 1;
export const LIVING_ROOM_DIMENSIONS = {
  widthMm: 6200,
  heightMm: 2800,
  depthMm: 4600,
  wallThicknessMm: 120,
} as const;

export type LivingRoomStarterOptions = {
  projectId?: string;
  projectName?: string;
  now?: string;
  idFactory?: LivingRoomIdFactory;
  lightingRecipeId?: LivingRoomLightingRecipeId;
};

const OPENING_SEEDS: readonly RoomOpeningSeed[] = [
  {
    key: "entry-door", wallSide: "front", kind: "door", offsetMm: 650,
    widthMm: 900, heightMm: 2100, sillHeightMm: 0, swingDirection: "in",
    extensions: { hinge: "left" },
  },
  {
    key: "picture-window", wallSide: "left", kind: "window", offsetMm: 1350,
    widthMm: 1800, heightMm: 1300, sillHeightMm: 750,
  },
];

/** Compose the complete starter as data so every downstream view uses one source. */
export function createLivingRoomStarterProject(
  options: LivingRoomStarterOptions = {},
): InteriorProject {
  const now = options.now ?? new Date().toISOString();
  const idFactory = options.idFactory ?? defaultLivingRoomIdFactory;
  const roomId = idFactory("room", "main");
  const activeLighting = options.lightingRecipeId ?? "neutral-studio";
  const shell = createRectangularRoomShell({
    roomId,
    dimensions: LIVING_ROOM_DIMENSIONS,
    wallMaterialId: LIVING_ROOM_MATERIAL_IDS.wallPaint,
    openings: OPENING_SEEDS,
    idFactory,
  });
  const cameras = createLivingRoomCameras(roomId, idFactory);
  const base = createEmptyInteriorProject({
    id: options.projectId ?? LIVING_ROOM_PRESET_ID,
    name: options.projectName ?? "Living Room Starter",
    now,
  });
  const document: InteriorProject = {
    ...base,
    activeRoomId: roomId,
    rooms: [
      {
        id: roomId,
        name: "Living Room",
        roomType: "living-room",
        dimensions: {
          widthMm: LIVING_ROOM_DIMENSIONS.widthMm,
          heightMm: LIVING_ROOM_DIMENSIONS.heightMm,
          depthMm: LIVING_ROOM_DIMENSIONS.depthMm,
        },
        wallThicknessMm: LIVING_ROOM_DIMENSIONS.wallThicknessMm,
        extensions: {
          floorMaterialId: LIVING_ROOM_MATERIAL_IDS.warmStone,
          ceilingMaterialId: LIVING_ROOM_MATERIAL_IDS.ceilingPaint,
        },
      },
    ],
    walls: shell.walls,
    openings: shell.openings,
    objects: LIVING_ROOM_STARTER_LAYOUT.map((item) =>
      createLivingRoomObject(item.catalogItemId, {
        id: idFactory("object", item.key),
        roomId,
        position: item.position,
        rotationY: item.rotationY,
      }),
    ),
    materials: createLivingRoomMaterials(),
    lights: createLivingRoomLights(roomId, activeLighting, idFactory),
    cameras,
    renderSettings: {
      ...base.renderSettings,
      activeCameraId: cameras.find((camera) => camera.isDefault)?.id ?? null,
      lightingRecipeId: activeLighting,
    },
    extensions: {
      presetId: LIVING_ROOM_PRESET_ID,
      presetVersion: LIVING_ROOM_PRESET_VERSION,
    },
  };
  const styled = applyLivingRoomStyle(
    validateInteriorProject(document).project,
    "warm-contemporary",
  );
  if (activeLighting === "neutral-studio") return styled;
  return {
    ...styled,
    lights: styled.lights.map((light) => ({
      ...light,
      enabled: light.parameters.recipeId === activeLighting,
    })),
    renderSettings: {
      ...styled.renderSettings,
      lightingRecipeId: activeLighting,
    },
  };
}
