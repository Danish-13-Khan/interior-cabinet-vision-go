import { selectWallsForRoom } from "./planTopology";
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
  const walls = selectWallsForRoom(project, roomId);
  if (walls.length === 0) {
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
  const xs = walls.flatMap((wall) => [wall.start.x, wall.end.x]);
  const zs = walls.flatMap((wall) => [wall.start.z, wall.end.z]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  return {
    minX,
    maxX,
    minZ,
    maxZ,
    centerX: (minX + maxX) / 2,
    centerZ: (minZ + maxZ) / 2,
    widthMm: maxX - minX,
    depthMm: maxZ - minZ,
  };
}

export function centerPolygonAtOrigin(points: Point2Mm[]): Point2Mm[] {
  const xs = points.map((point) => point.x);
  const zs = points.map((point) => point.z);
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerZ = (Math.min(...zs) + Math.max(...zs)) / 2;
  return points.map((point) => ({ x: point.x - centerX, z: point.z - centerZ }));
}
