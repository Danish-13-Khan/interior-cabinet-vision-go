import {
  selectRoomWalls,
  type InteriorProject,
  type WallEntity,
} from "../interiorProject";
import { roomIdsUsingWall } from "../interiorProject/planTopology";

/** Interior wall shared by both room ids. */
export function sharedWallBetween(
  project: InteriorProject,
  roomIdA: string,
  roomIdB: string,
): WallEntity | null {
  const wallsA = new Set(selectRoomWalls(project, roomIdA).map((wall) => wall.id));
  for (const wall of selectRoomWalls(project, roomIdB)) {
    if (!wallsA.has(wall.id)) continue;
    const rooms = roomIdsUsingWall(project, wall.id);
    if (rooms.includes(roomIdA) && rooms.includes(roomIdB)) return wall;
  }
  return null;
}
