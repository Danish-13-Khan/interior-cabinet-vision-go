import { polygonBounds, roomPlanPolygon } from "./roomGeometry";
import type { InteriorProject, Point2Mm } from "./types";

export type RoomPlanViewBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  centerX: number;
  centerZ: number;
  widthMm: number;
  depthMm: number;
};

/** Plan-space bounds from a room's wall graph (falls back to centered dimensions). */
export function roomPlanViewBounds(project: InteriorProject, roomId: string): RoomPlanViewBounds {
  const room = project.rooms.find((item) => item.id === roomId);
  const polygon = roomPlanPolygon(project, roomId);
  if (!polygon) {
    const widthMm = room?.dimensions.widthMm ?? 1000;
    const depthMm = room?.dimensions.depthMm ?? 1000;
    return {
      minX: -widthMm / 2,
      maxX: widthMm / 2,
      minZ: -depthMm / 2,
      maxZ: depthMm / 2,
      centerX: 0,
      centerZ: 0,
      widthMm,
      depthMm,
    };
  }
  const { minX, maxX, minZ, maxZ, widthMm, depthMm } = polygonBounds(polygon.outer);
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    widthMm,
    depthMm,
  };
}

export function centerPolygonAtOrigin(points: Point2Mm[]): Point2Mm[] {
  const xs = points.map((point) => point.x);
  const zs = points.map((point) => point.z);
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerZ = (Math.min(...zs) + Math.max(...zs)) / 2;
  return points.map((point) => ({ x: point.x - centerX, z: point.z - centerZ }));
}
