import {
  clampCabinetProject,
  type CabinetInstance,
  type CabinetProject,
} from "../cabinetDimensions";
import { DEFAULT_ROOM, type RoomConfig } from "../roomModel";
import type { ProjectRoom } from "./types";

function clampRoomCabinets(
  cabinets: CabinetInstance[],
  shell: CabinetProject,
): CabinetInstance[] {
  return clampCabinetProject({
    ...shell,
    cabinets,
    rooms: undefined,
    activeRoomId: undefined,
  }).cabinets;
}

export function createDefaultProjectRoom(
  cabinets: CabinetInstance[] = [],
  config: RoomConfig = DEFAULT_ROOM,
  name = "Room 1",
  id = "room-1",
): ProjectRoom {
  return {
    id,
    name,
    config: structuredClone
      ? structuredClone(config)
      : (JSON.parse(JSON.stringify(config)) as RoomConfig),
    cabinets: cabinets.map((cabinet) =>
      structuredClone
        ? structuredClone(cabinet)
        : (JSON.parse(JSON.stringify(cabinet)) as CabinetInstance),
    ),
  };
}

/** Ensure rooms[] + activeRoomId exist; sync project.cabinets from the active room. */
export function normalizeMultiRoomProject(
  project: CabinetProject,
  fallbackRoom: RoomConfig = DEFAULT_ROOM,
): CabinetProject {
  const shell = clampCabinetProject({
    ...project,
    rooms: undefined,
    activeRoomId: undefined,
  });

  const sourceRooms =
    Array.isArray(project.rooms) && project.rooms.length > 0
      ? project.rooms
      : [
          createDefaultProjectRoom(
            shell.cabinets,
            fallbackRoom,
            "Room 1",
            "room-1",
          ),
        ];

  const rooms: ProjectRoom[] = sourceRooms.map((room, index) => ({
    id: room.id?.trim() || `room-${index + 1}`,
    name: room.name?.trim() || `Room ${index + 1}`,
    config: room.config ?? fallbackRoom,
    cabinets: clampRoomCabinets(room.cabinets ?? [], shell),
  }));

  const activeRoomId =
    rooms.find((room) => room.id === project.activeRoomId)?.id ?? rooms[0]!.id;
  const active = rooms.find((room) => room.id === activeRoomId)!;

  return {
    ...shell,
    rooms,
    activeRoomId,
    cabinets: active.cabinets,
  };
}

/** Write the live editor cabinets/config back into the active room before normalize. */
export function writeActiveRoomState(
  project: CabinetProject,
  cabinets: CabinetInstance[],
  config: RoomConfig,
): CabinetProject {
  const seeded = normalizeMultiRoomProject(project, config);
  const rooms = (seeded.rooms ?? []).map((room) =>
    room.id === seeded.activeRoomId
      ? { ...room, cabinets, config }
      : room,
  );

  return {
    ...seeded,
    rooms,
    cabinets,
  };
}

export function getActiveProjectRoom(project: CabinetProject): ProjectRoom {
  const normalized = normalizeMultiRoomProject(project);
  return (
    normalized.rooms?.find((room) => room.id === normalized.activeRoomId) ??
    normalized.rooms![0]!
  );
}

export function listProjectRooms(project: CabinetProject): ProjectRoom[] {
  return normalizeMultiRoomProject(project).rooms ?? [];
}
