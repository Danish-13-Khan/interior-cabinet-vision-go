import type { InteriorProject, Point2Mm } from "../interiorProject";
import { pointInRoomPolygon, roomPlanPolygon } from "../interiorProject/roomGeometry";
import type { RoomPlanPolygon } from "../interiorProject/roomGeometry";

export type OverviewRoom = {
  id: string;
  name: string;
  polygon: RoomPlanPolygon;
  center: Point2Mm;
};

function polygonCenter(points: readonly Point2Mm[]): Point2Mm {
  const count = points.length || 1;
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / count,
    z: points.reduce((sum, point) => sum + point.z, 0) / count,
  };
}

/** Rooms that have a plan outline. Hover and click tests use these polygons. */
export function overviewRooms(project: InteriorProject): OverviewRoom[] {
  return project.rooms.flatMap((room) => {
    const polygon = roomPlanPolygon(project, room.id);
    if (!polygon) return [];
    return [{ id: room.id, name: room.name, polygon, center: polygonCenter(polygon.outer) }];
  });
}

/** First room whose outline contains the plan point, in project room order. */
export function overviewRoomAt(rooms: readonly OverviewRoom[], point: Point2Mm): OverviewRoom | null {
  return rooms.find((room) => pointInRoomPolygon(point, room.polygon)) ?? null;
}

/**
 * Where a view ray crosses the floor (y = 0). Origin and direction are meters,
 * the same space as the model camera. The result is plan millimeters.
 */
export function floorPointMm(
  origin: { x: number; y: number; z: number },
  direction: { x: number; y: number; z: number },
): Point2Mm | null {
  if (Math.abs(direction.y) < 1e-8) return null;
  const distance = -origin.y / direction.y;
  if (distance < 0) return null;
  return {
    x: (origin.x + direction.x * distance) * 1000,
    z: (origin.z + direction.z * distance) * 1000,
  };
}
