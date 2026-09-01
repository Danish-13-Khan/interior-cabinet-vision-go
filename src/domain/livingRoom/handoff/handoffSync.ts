import type { CabinetProject } from "../../cabinetDimensions";
import {
  interiorProjectFromCabinetProject,
  type InteriorProject,
  type RoomType,
} from "../../interiorProject";
import type { RoomConfig } from "../../roomModel";

function withPreservedRoomTypes(
  previous: InteriorProject | undefined,
  next: InteriorProject,
): InteriorProject {
  if (!previous) return next;
  const types = new Map(previous.rooms.map((room) => [room.id, room.roomType]));
  const rooms = next.rooms.map((room) => ({
    ...room,
    roomType: types.get(room.id) ?? room.roomType,
  }));
  const keepLiving = previous.rooms.some((room) => room.roomType === "living-room");
  const hasLiving = rooms.some((room) => room.roomType === "living-room");
  return {
    ...next,
    rooms: keepLiving && !hasLiving && rooms[0]
      ? rooms.map((room, index) => (
        index === 0 ? { ...room, roomType: "living-room" as RoomType } : room
      ))
      : rooms,
  };
}

export function syncInteriorDocumentFromCabinets(
  project: CabinetProject,
  activeRoom: RoomConfig,
  now?: string,
): CabinetProject {
  const synced = interiorProjectFromCabinetProject({
    project,
    activeRoom,
    now,
  });
  return {
    ...project,
    interiorDocument: withPreservedRoomTypes(project.interiorDocument, synced),
  };
}
