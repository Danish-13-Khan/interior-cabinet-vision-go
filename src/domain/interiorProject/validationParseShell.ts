import type {
  InteriorObjectEntity,
  InteriorRoomEntity,
  InteriorValidationIssue,
  OpeningEntity,
  WallEntity,
} from "./types";
import {
  booleanValue,
  extensions,
  numberIn,
  parameterMap,
  point2,
  point3,
  records,
  rotation,
  size3,
  stringMap,
  text,
  uniqueId,
  type UnknownRecord,
} from "./validationHelpers";

export function parseRooms(source: UnknownRecord, issues: InteriorValidationIssue[]) {
  const roomIds = new Set<string>();
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
      outerLoopId: typeof room.outerLoopId === "string" ? room.outerLoopId : undefined,
      holeLoopIds: Array.isArray(room.holeLoopIds)
        ? room.holeLoopIds.filter((id): id is string => typeof id === "string")
        : [],
      extensions: extensions(room.extensions),
    };
  });
  return { rooms, validRoomIds: new Set(rooms.map((room) => room.id)) };
}

export function parseWalls(
  source: UnknownRecord,
  validRoomIds: Set<string>,
  issues: InteriorValidationIssue[],
) {
  const wallIds = new Set<string>();
  const walls: WallEntity[] = records(source.walls).map((wall, index) => {
    const legacyRoomId = typeof wall.roomId === "string" ? wall.roomId.trim() : "";
    const roomId = legacyRoomId && validRoomIds.has(legacyRoomId) ? legacyRoomId : null;
    if (legacyRoomId && !roomId) {
      issues.push({
        severity: "warning",
        code: "orphan-wall-room",
        path: `walls[${index}].roomId`,
        message: "Cleared an unknown legacy wall room reference.",
        repaired: true,
      });
    }
    return {
      id: uniqueId(wall.id, `wall-${index + 1}`, `walls[${index}].id`, wallIds, issues),
      roomId,
      start: point2(wall.start),
      end: point2(wall.end),
      heightMm: numberIn(wall.heightMm, 2800, 1, 20_000),
      thicknessMm: numberIn(wall.thicknessMm, 120, 1, 2000),
      visible: booleanValue(wall.visible, true),
      materialId: typeof wall.materialId === "string" && wall.materialId.trim()
        ? wall.materialId.trim()
        : null,
      startNodeId: typeof wall.startNodeId === "string" ? wall.startNodeId : undefined,
      endNodeId: typeof wall.endNodeId === "string" ? wall.endNodeId : undefined,
      extensions: extensions(wall.extensions),
    };
  });
  return {
    walls,
    validWallIds: new Set(walls.map((wall) => wall.id)),
    wallsById: new Map(walls.map((wall) => [wall.id, wall])),
  };
}

export function parseOpenings(
  source: UnknownRecord,
  validRoomIds: Set<string>,
  validWallIds: Set<string>,
  wallsById: Map<string, WallEntity>,
  issues: InteriorValidationIssue[],
) {
  const openingIds = new Set<string>();
  return records(source.openings)
    .map((opening, index): OpeningEntity | null => {
      const wallId = text(opening.wallId, "", 120);
      const wall = wallsById.get(wallId);
      if (!validWallIds.has(wallId) || !wall) {
        issues.push({
          severity: "warning",
          code: "orphan-opening",
          path: `openings[${index}]`,
          message: "Removed an opening with an invalid wall reference.",
          repaired: true,
        });
        return null;
      }
      const legacyRoomId = typeof opening.roomId === "string" ? opening.roomId.trim() : "";
      const roomId = legacyRoomId && validRoomIds.has(legacyRoomId) ? legacyRoomId : null;
      if (legacyRoomId && !roomId) {
        issues.push({
          severity: "warning",
          code: "orphan-opening-room",
          path: `openings[${index}].roomId`,
          message: "Cleared an unknown legacy opening room reference.",
          repaired: true,
        });
      }
      const kind = ["door", "window", "opening"].includes(String(opening.kind))
        ? (opening.kind as OpeningEntity["kind"])
        : "opening";
      return {
        id: uniqueId(opening.id, `opening-${index + 1}`, `openings[${index}].id`, openingIds, issues),
        ...(roomId ? { roomId } : {}),
        wallId,
        kind,
        offsetMm: numberIn(opening.offsetMm, 0, -1_000_000, 1_000_000),
        widthMm: numberIn(opening.widthMm, 900, 1, 100_000),
        heightMm: numberIn(opening.heightMm, 2100, 1, 100_000),
        sillHeightMm: numberIn(opening.sillHeightMm, 0, 0, 100_000),
        catalogItemId: text(
          opening.catalogItemId,
          kind === "door" ? "opening:door-single" : kind === "window" ? "opening:window-fixed" : "opening:pass-through",
          120,
        ),
        materialSlots: stringMap(opening.materialSlots),
        parameters: parameterMap(opening.parameters),
        swingDirection: opening.swingDirection === "out" ? "out" : kind === "door" ? "in" : undefined,
        extensions: extensions(opening.extensions),
      };
    })
    .filter((opening): opening is OpeningEntity => Boolean(opening));
}

export function parseObjects(
  source: UnknownRecord,
  validRoomIds: Set<string>,
  issues: InteriorValidationIssue[],
) {
  const objectIds = new Set<string>();
  return records(source.objects)
    .map((object, index): InteriorObjectEntity | null => {
      const roomId = text(object.roomId, "", 120);
      if (!validRoomIds.has(roomId)) {
        issues.push({
          severity: "warning",
          code: "orphan-object",
          path: `objects[${index}].roomId`,
          message: "Removed an object with an unknown room reference.",
          repaired: true,
        });
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
}
