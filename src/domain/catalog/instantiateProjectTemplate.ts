import {
  createEmptyInteriorProject,
  validateInteriorProject,
  type InteriorProject,
} from "../interiorProject";
import { createRectangularRoomShell } from "../interiorFoundation";
import { createLivingRoomCameras } from "../livingRoom/cameras";
import {
  createUniqueLivingRoomIdFactory,
  type LivingRoomIdFactory,
} from "../livingRoom/ids";
import { createLivingRoomLights } from "../livingRoom/lighting";
import {
  createLivingRoomMaterials,
  LIVING_ROOM_MATERIAL_IDS,
} from "../livingRoom/materials";
import { createDefaultPackageCameraBookmarks } from "../livingRoom/packageCameraBookmarks";
import { lookupBuiltInCatalogTemplate } from "./catalogLookup";
import { paintObjectSlotFromCatalog } from "./paintCatalogFinish";
import { placeCatalogItemWithDefaults } from "./placeCatalogItem";
import { finalizeLKitchenTemplate } from "./lKitchenRun";
import { finalizeStraightKitchenTemplate } from "./straightKitchenRun";
import type { ProjectTemplate } from "./types";

export const LIVING_ROOM_CATALOG_TEMPLATE_ID = "template:core:living-room:v1";
export const EMPTY_ROOM_CATALOG_TEMPLATE_ID = "template:core:empty-room:v1";
export const STRAIGHT_KITCHEN_CATALOG_TEMPLATE_ID = "template:core:straight-kitchen:v1";
export const L_KITCHEN_CATALOG_TEMPLATE_ID = "template:core:l-kitchen:v1";

export type InstantiateTemplateOptions = {
  projectId?: string;
  projectName?: string;
  now?: string;
  idFactory?: LivingRoomIdFactory;
};

const WALL_THICKNESS_MM = 120;

function applyOverrides(
  project: InteriorProject,
  objectId: string,
  overrides: Record<string, string> | undefined,
): InteriorProject {
  if (!overrides) return project;
  let next = project;
  for (const [slotName, catalogMaterialId] of Object.entries(overrides)) {
    next = paintObjectSlotFromCatalog(next, { objectId, slotName, catalogMaterialId });
  }
  return next;
}

/** Build a fresh interiors project from a catalog template (fresh entity IDs). */
export function instantiateProjectTemplate(
  template: ProjectTemplate,
  options: InstantiateTemplateOptions = {},
): InteriorProject {
  const now = options.now ?? new Date().toISOString();
  const idFactory = options.idFactory ?? createUniqueLivingRoomIdFactory();
  const roomId = idFactory("room", "main");
  const shell = createRectangularRoomShell({
    roomId,
    dimensions: {
      widthMm: template.room.widthMm,
      depthMm: template.room.depthMm,
      heightMm: template.room.heightMm,
      wallThicknessMm: WALL_THICKNESS_MM,
    },
    wallMaterialId: LIVING_ROOM_MATERIAL_IDS.wallPaint,
    openings: [
      {
        key: "entry-door",
        wallSide: "front",
        kind: "door",
        offsetMm: 650,
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
        offsetMm: 1100,
        widthMm: 1600,
        heightMm: 1300,
        sillHeightMm: 750,
      },
    ],
    idFactory,
  });
  const cameras = createLivingRoomCameras(roomId, idFactory);
  const base = createEmptyInteriorProject({
    id: options.projectId ?? `project-${template.id}-${Date.now()}`,
    name: options.projectName ?? template.name,
    now,
  });
  let document: InteriorProject = {
    ...base,
    activeRoomId: roomId,
    rooms: [
      {
        id: roomId,
        name: template.name,
        roomType: template.category === "living-room"
          || template.category === "bedroom"
          || template.category === "kitchen"
          ? template.category
          : "custom",
        dimensions: {
          widthMm: template.room.widthMm,
          heightMm: template.room.heightMm,
          depthMm: template.room.depthMm,
        },
        wallThicknessMm: WALL_THICKNESS_MM,
        extensions: {
          floorMaterialId: LIVING_ROOM_MATERIAL_IDS.warmStone,
          ceilingMaterialId: LIVING_ROOM_MATERIAL_IDS.ceilingPaint,
        },
      },
    ],
    walls: shell.walls,
    openings: shell.openings,
    objects: [],
    materials: createLivingRoomMaterials(),
    lights: createLivingRoomLights(roomId, "neutral-studio", idFactory),
    cameras,
    renderSettings: {
      ...base.renderSettings,
      activeCameraId: cameras.find((camera) => camera.isDefault)?.id ?? null,
      lightingRecipeId: "neutral-studio",
      packageCameraBookmarks: createDefaultPackageCameraBookmarks(cameras),
    },
    extensions: {
      catalogTemplateId: template.id,
      catalogTemplateVersion: template.version,
    },
  };

  for (const object of template.objects) {
    const objectId = idFactory("object", object.templateObjectId);
    document = placeCatalogItemWithDefaults(document, object.catalogItemId, {
      objectId,
      roomId,
      position: { ...object.positionMm },
      rotationY: object.rotationY,
    });
    document = applyOverrides(document, objectId, object.materialOverrides);
  }

  if (template.id === STRAIGHT_KITCHEN_CATALOG_TEMPLATE_ID) {
    document = finalizeStraightKitchenTemplate(document, { roomId, idFactory });
  }
  if (template.id === L_KITCHEN_CATALOG_TEMPLATE_ID) {
    document = finalizeLKitchenTemplate(document, { roomId, idFactory });
  }

  return validateInteriorProject(document).project;
}

function instantiateNamedCatalogTemplate(
  templateId: string,
  options: InstantiateTemplateOptions,
): InteriorProject {
  const template = lookupBuiltInCatalogTemplate(templateId);
  if (!template) {
    throw new Error(`Missing catalog template ${templateId}`);
  }
  return instantiateProjectTemplate(template, options);
}

export function instantiateLivingRoomCatalogTemplate(
  options: InstantiateTemplateOptions = {},
): InteriorProject {
  return instantiateNamedCatalogTemplate(LIVING_ROOM_CATALOG_TEMPLATE_ID, options);
}

export function instantiateEmptyRoomCatalogTemplate(
  options: InstantiateTemplateOptions = {},
): InteriorProject {
  return instantiateNamedCatalogTemplate(EMPTY_ROOM_CATALOG_TEMPLATE_ID, options);
}

export function instantiateStraightKitchenCatalogTemplate(
  options: InstantiateTemplateOptions = {},
): InteriorProject {
  return instantiateNamedCatalogTemplate(STRAIGHT_KITCHEN_CATALOG_TEMPLATE_ID, options);
}

export function instantiateLKitchenCatalogTemplate(
  options: InstantiateTemplateOptions = {},
): InteriorProject {
  return instantiateNamedCatalogTemplate(L_KITCHEN_CATALOG_TEMPLATE_ID, options);
}
