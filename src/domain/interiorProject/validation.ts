import { createEmptyInteriorProject, DEFAULT_RENDER_SETTINGS } from "./defaults";
import {
  INTERIOR_PROJECT_SCHEMA_VERSION,
  type CameraEntity,
  type EntityExtensions,
  type InteriorObjectEntity,
  type InteriorProject,
  type InteriorRoomEntity,
  type InteriorValidationIssue,
  type InteriorValidationResult,
  type LightEntity,
  type MaterialEntity,
  type OpeningEntity,
  type ParameterValue,
  type RenderSettings,
  type WallEntity,
} from "./types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function records(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function text(value: unknown, fallback: string, maxLength = 160): string {
  const candidate = typeof value === "string" ? value.trim() : "";
  return (candidate || fallback).slice(0, maxLength);
}

function numberIn(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function extensions(value: unknown): EntityExtensions | undefined {
  return isRecord(value) ? value : undefined;
}

function point2(value: unknown) {
  const source = isRecord(value) ? value : {};
  return {
    x: numberIn(source.x, 0, -1_000_000, 1_000_000),
    z: numberIn(source.z, 0, -1_000_000, 1_000_000),
  };
}

function point3(value: unknown) {
  const source = isRecord(value) ? value : {};
  return {
    x: numberIn(source.x, 0, -1_000_000, 1_000_000),
    y: numberIn(source.y, 0, -1_000_000, 1_000_000),
    z: numberIn(source.z, 0, -1_000_000, 1_000_000),
  };
}

function rotation(value: unknown) {
  const source = isRecord(value) ? value : {};
  return {
    x: numberIn(source.x, 0, -360_000, 360_000),
    y: numberIn(source.y, 0, -360_000, 360_000),
    z: numberIn(source.z, 0, -360_000, 360_000),
  };
}

function size3(value: unknown, fallback = { widthMm: 1000, heightMm: 1000, depthMm: 1000 }) {
  const source = isRecord(value) ? value : {};
  return {
    widthMm: numberIn(source.widthMm, fallback.widthMm, 1, 1_000_000),
    heightMm: numberIn(source.heightMm, fallback.heightMm, 1, 1_000_000),
    depthMm: numberIn(source.depthMm, fallback.depthMm, 1, 1_000_000),
  };
}

function parameterMap(value: unknown): Record<string, ParameterValue> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, ParameterValue] =>
      ["string", "number", "boolean"].includes(typeof entry[1]),
    ),
  );
}

function stringMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] =>
      typeof entry[1] === "string" && entry[1].trim().length > 0,
    ),
  );
}

function uniqueId(
  raw: unknown,
  fallback: string,
  path: string,
  used: Set<string>,
  issues: InteriorValidationIssue[],
) {
  const base = text(raw, fallback, 120).replace(/\s+/g, "-");
  let id = base;
  let suffix = 2;
  while (used.has(id)) id = `${base}-${suffix++}`;
  used.add(id);
  if (id !== raw) {
    issues.push({
      severity: "warning",
      code: "normalized-id",
      path,
      message: `Normalized entity ID to “${id}”.`,
      repaired: true,
    });
  }
  return id;
}

function renderSettings(value: unknown): RenderSettings {
  const source = isRecord(value) ? value : {};
  const quality = ["draft", "standard", "presentation"].includes(String(source.quality))
    ? (source.quality as RenderSettings["quality"])
    : DEFAULT_RENDER_SETTINGS.quality;
  return {
    widthPx: Math.round(numberIn(source.widthPx, 1920, 320, 8192)),
    heightPx: Math.round(numberIn(source.heightPx, 1080, 240, 8192)),
    quality,
    exposure: numberIn(source.exposure, 1, 0.1, 5),
    transparentBackground: booleanValue(source.transparentBackground, false),
    activeCameraId:
      typeof source.activeCameraId === "string" && source.activeCameraId.trim()
        ? source.activeCameraId.trim()
        : null,
    lightingRecipeId: text(source.lightingRecipeId, "neutral-studio", 80),
  };
}

export function validateInteriorProject(input: unknown): InteriorValidationResult {
  const issues: InteriorValidationIssue[] = [];
  const source = isRecord(input) ? input : {};
  if (!isRecord(input)) {
    issues.push({
      severity: "error",
      code: "invalid-root",
      path: "$",
      message: "Project root was not an object; defaults were applied.",
      repaired: true,
    });
  }
  const fallback = createEmptyInteriorProject();
  const roomIds = new Set<string>();
  const wallIds = new Set<string>();
  const openingIds = new Set<string>();
  const objectIds = new Set<string>();
  const materialIds = new Set<string>();
  const lightIds = new Set<string>();
  const cameraIds = new Set<string>();

  const rooms: InteriorRoomEntity[] = records(source.rooms).map((room, index) => {
    const roomType = ["living-room", "bedroom", "kitchen", "office", "utility", "custom"].includes(String(room.roomType))
      ? (room.roomType as InteriorRoomEntity["roomType"])
      : "custom";
    return {
      id: uniqueId(room.id, `room-${index + 1}`, `rooms[${index}].id`, roomIds, issues),
      name: text(room.name, `Room ${index + 1}`),
      roomType,
      dimensions: size3(room.dimensions, { widthMm: 6000, heightMm: 2800, depthMm: 4000 }),
      wallThicknessMm: numberIn(room.wallThicknessMm, 120, 1, 2000),
      extensions: extensions(room.extensions),
    };
  });
  const validRoomIds = new Set(rooms.map((room) => room.id));

  const walls: WallEntity[] = records(source.walls)
    .map((wall, index): WallEntity | null => {
      const roomId = text(wall.roomId, "", 120);
      if (!validRoomIds.has(roomId)) {
        issues.push({ severity: "warning", code: "orphan-wall", path: `walls[${index}].roomId`, message: "Removed a wall with an unknown room reference.", repaired: true });
        return null;
      }
      return {
        id: uniqueId(wall.id, `wall-${index + 1}`, `walls[${index}].id`, wallIds, issues),
        roomId,
        start: point2(wall.start),
        end: point2(wall.end),
        heightMm: numberIn(wall.heightMm, 2800, 1, 20_000),
        thicknessMm: numberIn(wall.thicknessMm, 120, 1, 2000),
        visible: booleanValue(wall.visible, true),
        materialId: typeof wall.materialId === "string" && wall.materialId.trim() ? wall.materialId.trim() : null,
        extensions: extensions(wall.extensions),
      };
    })
    .filter((wall): wall is WallEntity => Boolean(wall));
  const validWallIds = new Set(walls.map((wall) => wall.id));

  const openings: OpeningEntity[] = records(source.openings)
    .map((opening, index): OpeningEntity | null => {
      const roomId = text(opening.roomId, "", 120);
      const wallId = text(opening.wallId, "", 120);
      const wall = walls.find((item) => item.id === wallId);
      if (!validRoomIds.has(roomId) || !validWallIds.has(wallId) || wall?.roomId !== roomId) {
        issues.push({ severity: "warning", code: "orphan-opening", path: `openings[${index}]`, message: "Removed an opening with an invalid room or wall reference.", repaired: true });
        return null;
      }
      const kind = ["door", "window", "opening"].includes(String(opening.kind))
        ? (opening.kind as OpeningEntity["kind"])
        : "opening";
      return {
        id: uniqueId(opening.id, `opening-${index + 1}`, `openings[${index}].id`, openingIds, issues),
        roomId,
        wallId,
        kind,
        offsetMm: numberIn(opening.offsetMm, 0, -1_000_000, 1_000_000),
        widthMm: numberIn(opening.widthMm, 900, 1, 100_000),
        heightMm: numberIn(opening.heightMm, 2100, 1, 100_000),
        sillHeightMm: numberIn(opening.sillHeightMm, 0, 0, 100_000),
        swingDirection: opening.swingDirection === "out" ? "out" : kind === "door" ? "in" : undefined,
        extensions: extensions(opening.extensions),
      };
    })
    .filter((opening): opening is OpeningEntity => Boolean(opening));

  const objects: InteriorObjectEntity[] = records(source.objects)
    .map((object, index): InteriorObjectEntity | null => {
      const roomId = text(object.roomId, "", 120);
      if (!validRoomIds.has(roomId)) {
        issues.push({ severity: "warning", code: "orphan-object", path: `objects[${index}].roomId`, message: "Removed an object with an unknown room reference.", repaired: true });
        return null;
      }
      const kind = ["cabinet", "furniture", "lighting", "decor", "custom"].includes(String(object.kind))
        ? (object.kind as InteriorObjectEntity["kind"])
        : "custom";
      return {
        id: uniqueId(object.id, `object-${index + 1}`, `objects[${index}].id`, objectIds, issues),
        roomId,
        kind,
        category: text(object.category, "custom", 80),
        catalogItemId: text(object.catalogItemId, "custom", 120),
        name: text(object.name, `Object ${index + 1}`),
        position: point3(object.position),
        rotation: rotation(object.rotation),
        dimensions: size3(object.dimensions),
        materialSlots: stringMap(object.materialSlots),
        parameters: parameterMap(object.parameters),
        extensions: extensions(object.extensions),
      };
    })
    .filter((object): object is InteriorObjectEntity => Boolean(object));

  const materials: MaterialEntity[] = records(source.materials).map((material, index) => {
    const kind = ["wood", "fabric", "metal", "glass", "paint", "stone", "laminate", "custom"].includes(String(material.kind))
      ? (material.kind as MaterialEntity["kind"])
      : "custom";
    return {
      id: uniqueId(material.id, `material-${index + 1}`, `materials[${index}].id`, materialIds, issues),
      name: text(material.name, `Material ${index + 1}`),
      kind,
      color: text(material.color, "#cccccc", 32),
      roughness: numberIn(material.roughness, 0.7, 0, 1),
      metalness: numberIn(material.metalness, 0, 0, 1),
      opacity: numberIn(material.opacity, 1, 0, 1),
      extensions: extensions(material.extensions),
    };
  });
  const validMaterialIds = new Set(materials.map((material) => material.id));
  for (const wall of walls) {
    if (wall.materialId && !validMaterialIds.has(wall.materialId)) {
      issues.push({ severity: "warning", code: "missing-material", path: `walls.${wall.id}.materialId`, message: "Removed an unknown wall material reference.", repaired: true });
      wall.materialId = null;
    }
  }
  for (const object of objects) {
    object.materialSlots = Object.fromEntries(
      Object.entries(object.materialSlots).filter(([slot, materialId]) => {
        const valid = validMaterialIds.has(materialId);
        if (!valid) {
          issues.push({ severity: "warning", code: "missing-material", path: `objects.${object.id}.materialSlots.${slot}`, message: "Removed an unknown object material reference.", repaired: true });
        }
        return valid;
      }),
    );
  }

  const lights: LightEntity[] = records(source.lights).map((light, index) => {
    const kind = ["ambient", "directional", "point", "spot", "area"].includes(String(light.kind))
      ? (light.kind as LightEntity["kind"])
      : "point";
    const roomId = typeof light.roomId === "string" && validRoomIds.has(light.roomId) ? light.roomId : null;
    if (light.roomId != null && roomId == null) {
      issues.push({ severity: "warning", code: "orphan-light", path: `lights[${index}].roomId`, message: "Detached a light from an unknown room.", repaired: true });
    }
    return {
      id: uniqueId(light.id, `light-${index + 1}`, `lights[${index}].id`, lightIds, issues),
      roomId,
      name: text(light.name, `Light ${index + 1}`),
      kind,
      position: point3(light.position),
      rotation: rotation(light.rotation),
      color: text(light.color, "#ffffff", 32),
      intensity: numberIn(light.intensity, 1, 0, 100_000),
      enabled: booleanValue(light.enabled, true),
      parameters: parameterMap(light.parameters),
    };
  });

  const cameras: CameraEntity[] = records(source.cameras)
    .map((camera, index): CameraEntity | null => {
      const roomId = text(camera.roomId, "", 120);
      if (!validRoomIds.has(roomId)) {
        issues.push({ severity: "warning", code: "orphan-camera", path: `cameras[${index}].roomId`, message: "Removed a camera with an unknown room reference.", repaired: true });
        return null;
      }
      return {
        id: uniqueId(camera.id, `camera-${index + 1}`, `cameras[${index}].id`, cameraIds, issues),
        roomId,
        name: text(camera.name, `Camera ${index + 1}`),
        position: point3(camera.position),
        target: point3(camera.target),
        fieldOfViewDegrees: numberIn(camera.fieldOfViewDegrees, 45, 10, 120),
        isDefault: booleanValue(camera.isDefault, index === 0),
      };
    })
    .filter((camera): camera is CameraEntity => Boolean(camera));

  const activeRoomId = validRoomIds.has(String(source.activeRoomId))
    ? String(source.activeRoomId)
    : rooms[0]?.id ?? "";
  const safeRenderSettings = renderSettings(source.renderSettings);
  const validCameraIds = new Set(cameras.map((camera) => camera.id));
  if (safeRenderSettings.activeCameraId && !validCameraIds.has(safeRenderSettings.activeCameraId)) {
    issues.push({ severity: "warning", code: "missing-camera", path: "renderSettings.activeCameraId", message: "Cleared an unknown active camera reference.", repaired: true });
    safeRenderSettings.activeCameraId = null;
  }
  const project: InteriorProject = {
    schemaVersion: INTERIOR_PROJECT_SCHEMA_VERSION,
    id: text(source.id, fallback.id, 120),
    name: text(source.name, fallback.name),
    units: "mm",
    createdAt: text(source.createdAt, fallback.createdAt, 40),
    updatedAt: text(source.updatedAt, fallback.updatedAt, 40),
    activeRoomId,
    rooms,
    walls,
    openings,
    objects,
    materials,
    lights,
    cameras,
    renderSettings: safeRenderSettings,
    extensions: extensions(source.extensions),
  };

  return { project, issues };
}
