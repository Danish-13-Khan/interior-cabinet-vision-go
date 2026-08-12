import {
  createEmptyInteriorProject,
  validateInteriorProject,
  type InteriorProject,
  type OpeningEntity,
  type WallEntity,
} from "../interiorProject";
import { createLivingRoomCameras } from "./cameras";
import { createLivingRoomObject, type LivingRoomCatalogId } from "./catalog";
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

function createWalls(roomId: string, idFactory: LivingRoomIdFactory): WallEntity[] {
  const halfWidth = LIVING_ROOM_DIMENSIONS.widthMm / 2;
  const halfDepth = LIVING_ROOM_DIMENSIONS.depthMm / 2;
  const wall = (
    key: string,
    start: { x: number; z: number },
    end: { x: number; z: number },
  ): WallEntity => ({
    id: idFactory("wall", key),
    roomId,
    start,
    end,
    heightMm: LIVING_ROOM_DIMENSIONS.heightMm,
    thicknessMm: LIVING_ROOM_DIMENSIONS.wallThicknessMm,
    visible: true,
    materialId: LIVING_ROOM_MATERIAL_IDS.wallPaint,
    extensions: { wallSide: key },
  });
  return [
    wall("back", { x: -halfWidth, z: -halfDepth }, { x: halfWidth, z: -halfDepth }),
    wall("right", { x: halfWidth, z: -halfDepth }, { x: halfWidth, z: halfDepth }),
    wall("front", { x: halfWidth, z: halfDepth }, { x: -halfWidth, z: halfDepth }),
    wall("left", { x: -halfWidth, z: halfDepth }, { x: -halfWidth, z: -halfDepth }),
  ];
}

function createOpenings(
  roomId: string,
  walls: WallEntity[],
  idFactory: LivingRoomIdFactory,
): OpeningEntity[] {
  const wallId = (side: string) =>
    walls.find((wall) => wall.extensions?.wallSide === side)!.id;
  return [
    {
      id: idFactory("opening", "entry-door"),
      roomId,
      wallId: wallId("front"),
      kind: "door",
      offsetMm: 650,
      widthMm: 900,
      heightMm: 2100,
      sillHeightMm: 0,
      swingDirection: "in",
      extensions: { hinge: "left" },
    },
    {
      id: idFactory("opening", "picture-window"),
      roomId,
      wallId: wallId("left"),
      kind: "window",
      offsetMm: 1350,
      widthMm: 1800,
      heightMm: 1300,
      sillHeightMm: 750,
    },
  ];
}

const OBJECT_LAYOUT: readonly {
  key: string;
  catalogItemId: LivingRoomCatalogId;
  position: { x: number; y: number; z: number };
  rotationY?: number;
}[] = [
  {
    key: "sofa",
    catalogItemId: "living:sofa-3-seat",
    position: { x: 0, y: 0, z: 1150 },
    rotationY: 0,
  },
  {
    key: "lounge-chair",
    catalogItemId: "living:lounge-chair",
    position: { x: -2100, y: 0, z: 300 },
    rotationY: 45,
  },
  {
    key: "coffee-table",
    catalogItemId: "living:coffee-table",
    position: { x: 0, y: 0, z: -50 },
  },
  {
    key: "side-table",
    catalogItemId: "living:side-table",
    position: { x: -2100, y: 0, z: -1050 },
  },
  {
    key: "tv-unit",
    catalogItemId: "living:tv-unit",
    position: { x: 0, y: 0, z: -1950 },
  },
  {
    key: "area-rug",
    catalogItemId: "living:area-rug",
    position: { x: 0, y: 0, z: 300 },
  },
  {
    key: "wall-mirror",
    catalogItemId: "living:wall-mirror",
    position: { x: 3020, y: 850, z: -650 },
    rotationY: 270,
  },
  {
    key: "floor-lamp",
    catalogItemId: "living:floor-lamp",
    position: { x: 2350, y: 0, z: -1150 },
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
  const walls = createWalls(roomId, idFactory);
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
          floorMaterialId: LIVING_ROOM_MATERIAL_IDS.naturalOak,
          ceilingMaterialId: LIVING_ROOM_MATERIAL_IDS.ceilingPaint,
        },
      },
    ],
    walls,
    openings: createOpenings(roomId, walls, idFactory),
    objects: OBJECT_LAYOUT.map((item) =>
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
