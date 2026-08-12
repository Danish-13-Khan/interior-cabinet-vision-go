import type { InteriorObjectEntity, InteriorRoomEntity } from "../interiorProject";

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

