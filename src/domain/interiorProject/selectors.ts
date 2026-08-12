import type {
  InteriorObjectEntity,
  InteriorProject,
  InteriorRoomEntity,
  OpeningEntity,
  WallEntity,
} from "./types";

export function selectActiveInteriorRoom(project: InteriorProject): InteriorRoomEntity | null {
  return project.rooms.find((room) => room.id === project.activeRoomId) ?? project.rooms[0] ?? null;
}

export function selectRoomWalls(project: InteriorProject, roomId: string): WallEntity[] {
  return project.walls.filter((wall) => wall.roomId === roomId);
}

export function selectRoomOpenings(project: InteriorProject, roomId: string): OpeningEntity[] {
  return project.openings.filter((opening) => opening.roomId === roomId);
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
