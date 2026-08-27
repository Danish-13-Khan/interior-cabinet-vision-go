import type {
  InteriorObjectEntity,
  InteriorProject,
  InteriorRoomEntity,
  OpeningEntity,
  WallEntity,
} from "./types";
import { selectOpeningsForRoom, selectWallsForRoom } from "./planTopology";

export function selectActiveInteriorRoom(project: InteriorProject): InteriorRoomEntity | null {
  return project.rooms.find((room) => room.id === project.activeRoomId) ?? project.rooms[0] ?? null;
}

export function selectRoomWalls(project: InteriorProject, roomId: string): WallEntity[] {
  return selectWallsForRoom(project, roomId);
}

export function selectRoomOpenings(project: InteriorProject, roomId: string): OpeningEntity[] {
  return selectOpeningsForRoom(project, roomId);
}

export function selectRoomObjects(project: InteriorProject, roomId: string): InteriorObjectEntity[] {
  return project.objects.filter((object) => object.roomId === roomId);
}

export function selectObjectsByKind(
  project: InteriorProject,
  kind: InteriorObjectEntity["kind"],
): InteriorObjectEntity[] {
  return project.objects.filter((object) => object.kind === kind);
}
