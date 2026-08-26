import {
  pointInRoomPolygon,
  pointInPolygon,
  polygonBounds,
  polygonsIntersect,
  roomPlanPolygon,
  type InteriorObjectEntity,
  type InteriorProject,
  type InteriorRoomEntity,
  type Point2Mm,
} from "../interiorProject";

export type PlanBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export function getObjectPlanBounds(
  object: InteriorObjectEntity,
  position = object.position,
  dimensions = object.dimensions,
): PlanBounds {
  const radians = (object.rotation.y * Math.PI) / 180;
  const halfWidth = dimensions.widthMm / 2;
  const halfDepth = dimensions.depthMm / 2;
  const extentX = Math.abs(Math.cos(radians)) * halfWidth +
    Math.abs(Math.sin(radians)) * halfDepth;
  const extentZ = Math.abs(Math.sin(radians)) * halfWidth +
    Math.abs(Math.cos(radians)) * halfDepth;
  return {
    minX: position.x - extentX,
    maxX: position.x + extentX,
    minZ: position.z - extentZ,
    maxZ: position.z + extentZ,
  };
}

export function getRoomPlanBounds(room: InteriorRoomEntity): PlanBounds {
  const inset = room.wallThicknessMm;
  return {
    minX: -room.dimensions.widthMm / 2 + inset,
    maxX: room.dimensions.widthMm / 2 - inset,
    minZ: -room.dimensions.depthMm / 2 + inset,
    maxZ: room.dimensions.depthMm / 2 - inset,
  };
}

export function getTopologyRoomPlanBounds(
  project: InteriorProject,
  roomId: string,
): PlanBounds {
  const polygon = roomPlanPolygon(project, roomId);
  if (polygon) return polygonBounds(polygon.outer);
  const room = project.rooms.find((item) => item.id === roomId);
  return room ? getRoomPlanBounds(room) : { minX: 0, maxX: 0, minZ: 0, maxZ: 0 };
}

export function getObjectPlanCorners(
  object: InteriorObjectEntity,
  position = object.position,
): Point2Mm[] {
  const radians = object.rotation.y * Math.PI / 180;
  const cos = Math.cos(radians); const sin = Math.sin(radians);
  const halfW = object.dimensions.widthMm / 2;
  const halfD = object.dimensions.depthMm / 2;
  return [[-halfW, -halfD], [halfW, -halfD], [halfW, halfD], [-halfW, halfD]]
    .map(([x, z]) => ({
      x: position.x + x! * cos + z! * sin,
      z: position.z - x! * sin + z! * cos,
    }));
}

export function objectFitsRoom(
  project: InteriorProject,
  object: InteriorObjectEntity,
  position = object.position,
) {
  const polygon = roomPlanPolygon(project, object.roomId);
  if (!polygon) return false;
  const corners = getObjectPlanCorners(object, position);
  if (!corners.every((point) => pointInRoomPolygon(point, polygon))) return false;
  if (polygonsIntersect(corners, polygon.outer)) return false;
  return polygon.holes.every((hole) =>
    !polygonsIntersect(corners, hole) && !pointInPolygon(hole[0]!, corners));
}

export function boundsOverlap(a: PlanBounds, b: PlanBounds, gap = 0) {
  return !(
    a.maxX + gap <= b.minX ||
    a.minX - gap >= b.maxX ||
    a.maxZ + gap <= b.minZ ||
    a.minZ - gap >= b.maxZ
  );
}

export function boundsDistance(a: PlanBounds, b: PlanBounds) {
  const dx = Math.max(0, b.minX - a.maxX, a.minX - b.maxX);
  const dz = Math.max(0, b.minZ - a.maxZ, a.minZ - b.maxZ);
  return Math.hypot(dx, dz);
}
