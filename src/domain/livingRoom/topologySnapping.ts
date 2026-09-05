import { orientWallForRoom, roomPlanPolygon, selectRoomWalls, type InteriorObjectEntity, type InteriorProject, type Point3Mm } from "../interiorProject";
import type { PlanSnapGuide, PlanSnapResult } from "./planSnapping";

function wallProjection(
  wall: InteriorProject["walls"][number],
  point: Point3Mm,
  object: InteriorObjectEntity,
) {
  const dx = wall.end.x - wall.start.x; const dz = wall.end.z - wall.start.z;
  const length = Math.max(1, Math.hypot(dx, dz)); const ux = dx / length; const uz = dz / length;
  const inset = Math.min(length / 2, objectSupport(object, ux, uz));
  const offset = Math.max(inset, Math.min(length - inset, (point.x - wall.start.x) * ux + (point.z - wall.start.z) * uz));
  return { x: wall.start.x + ux * offset, z: wall.start.z + uz * offset, ux, uz };
}

function objectSupport(object: InteriorObjectEntity, nx: number, nz: number) {
  const angle = object.rotation.y * Math.PI / 180;
  const wx = Math.cos(angle); const wz = -Math.sin(angle);
  const dx = Math.sin(angle); const dz = Math.cos(angle);
  return Math.abs(nx * wx + nz * wz) * object.dimensions.widthMm / 2
    + Math.abs(nx * dx + nz * dz) * object.dimensions.depthMm / 2;
}

/** Snap an object flush to the nearest arbitrary room wall, toward the room interior. */
export function snapObjectToTopologyWall(
  project: InteriorProject,
  object: InteriorObjectEntity,
  desired: Point3Mm,
  thresholdMm: number,
): PlanSnapResult | null {
  const polygon = roomPlanPolygon(project, object.roomId);
  if (!polygon) return null;
  const candidates = selectRoomWalls(project, object.roomId).map((storedWall) => {
    const wall = orientWallForRoom(project, object.roomId, storedWall);
    const projected = wallProjection(wall, desired, object);
    const nx = -projected.uz; const nz = projected.ux;
    const support = objectSupport(object, nx, nz) + wall.thicknessMm / 2;
    const position = { ...desired, x: projected.x + nx * support, z: projected.z + nz * support };
    return { position, distance: Math.hypot(position.x - desired.x, position.z - desired.z) };
  }).sort((a, b) => a.distance - b.distance);
  const nearest = candidates[0];
  if (!nearest || nearest.distance > thresholdMm) return null;
  const guides: PlanSnapGuide[] = [
    { axis: "x", valueMm: nearest.position.x, kind: "wall", label: "Wall flush" },
    { axis: "z", valueMm: nearest.position.z, kind: "wall", label: "Wall flush" },
  ];
  return { position: nearest.position, guides };
}
