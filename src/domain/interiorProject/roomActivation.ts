import type { InteriorProject } from "./types";

/** Switch the active room face without mutating geometry. */
export function setActiveInteriorRoom(project: InteriorProject, roomId: string): InteriorProject {
  if (!project.rooms.some((room) => room.id === roomId) || project.activeRoomId === roomId) {
    return project;
  }
  return { ...project, activeRoomId: roomId };
}

/** Rename a room face. Empty names are ignored. */
export function renameInteriorRoom(
  project: InteriorProject,
  roomId: string,
  name: string,
): InteriorProject {
  const trimmed = name.trim();
  if (!trimmed) return project;
  if (!project.rooms.some((room) => room.id === roomId)) return project;
  return {
    ...project,
    rooms: project.rooms.map((room) => room.id === roomId ? { ...room, name: trimmed } : room),
  };
}
