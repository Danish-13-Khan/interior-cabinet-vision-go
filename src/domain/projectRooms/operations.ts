import { withNewCabinetIdentity } from "../cabinetIdentity/copyInstance";
import type { CabinetProject } from "../cabinetDimensions";
import { DEFAULT_ROOM, type RoomConfig } from "../roomModel";
import {
  createDefaultProjectRoom,
  getActiveProjectRoom,
  listProjectRooms,
  normalizeMultiRoomProject,
  writeActiveRoomState,
} from "./normalize";
import type { ProjectRoom } from "./types";

function newRoomId() {
  return `room-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function cloneRoom(room: ProjectRoom, name: string, id = newRoomId()): ProjectRoom {
  const raw = structuredClone
    ? structuredClone(room)
    : (JSON.parse(JSON.stringify(room)) as ProjectRoom);
  return {
    ...raw,
    id,
    name,
    cabinets: raw.cabinets.map((cabinet, index) =>
      withNewCabinetIdentity(
        cabinet,
        `${id}-cab-${index + 1}-${Math.floor(Math.random() * 1000)}`,
      ),
    ),
  };
}

export function switchProjectRoom(
  project: CabinetProject,
  roomId: string,
  currentCabinets: CabinetProject["cabinets"],
  currentConfig: RoomConfig,
): CabinetProject {
  const written = writeActiveRoomState(project, currentCabinets, currentConfig);
  const rooms = listProjectRooms(written);
  if (!rooms.some((room) => room.id === roomId)) {
    return normalizeMultiRoomProject(written, currentConfig);
  }

  return normalizeMultiRoomProject(
    {
      ...written,
      activeRoomId: roomId,
    },
    currentConfig,
  );
}

export function addEmptyProjectRoom(
  project: CabinetProject,
  currentCabinets: CabinetProject["cabinets"],
  currentConfig: RoomConfig,
  name?: string,
): CabinetProject {
  const written = writeActiveRoomState(project, currentCabinets, currentConfig);
  const rooms = listProjectRooms(written);
  const nextName = name?.trim() || `Room ${rooms.length + 1}`;
  const next = createDefaultProjectRoom([], DEFAULT_ROOM, nextName, newRoomId());

  return normalizeMultiRoomProject(
    {
      ...written,
      rooms: [...rooms, next],
      activeRoomId: next.id,
    },
    DEFAULT_ROOM,
  );
}

export function duplicateProjectRoom(
  project: CabinetProject,
  roomId: string,
  currentCabinets: CabinetProject["cabinets"],
  currentConfig: RoomConfig,
): CabinetProject {
  const written = writeActiveRoomState(project, currentCabinets, currentConfig);
  const rooms = listProjectRooms(written);
  const source = rooms.find((room) => room.id === roomId) ?? getActiveProjectRoom(written);
  const copy = cloneRoom(source, `${source.name} Copy`);

  return normalizeMultiRoomProject(
    {
      ...written,
      rooms: [...rooms, copy],
      activeRoomId: copy.id,
    },
    copy.config,
  );
}

export function renameProjectRoom(
  project: CabinetProject,
  roomId: string,
  name: string,
  currentCabinets: CabinetProject["cabinets"],
  currentConfig: RoomConfig,
): CabinetProject {
  const written = writeActiveRoomState(project, currentCabinets, currentConfig);
  const nextName = name.trim() || "Room";
  const rooms = listProjectRooms(written).map((room) =>
    room.id === roomId ? { ...room, name: nextName } : room,
  );

  return normalizeMultiRoomProject(
    {
      ...written,
      rooms,
    },
    currentConfig,
  );
}

export function removeProjectRoom(
  project: CabinetProject,
  roomId: string,
  currentCabinets: CabinetProject["cabinets"],
  currentConfig: RoomConfig,
): CabinetProject {
  const written = writeActiveRoomState(project, currentCabinets, currentConfig);
  const rooms = listProjectRooms(written);
  if (rooms.length <= 1) {
    return normalizeMultiRoomProject(written, currentConfig);
  }

  const nextRooms = rooms.filter((room) => room.id !== roomId);
  const activeRoomId =
    written.activeRoomId === roomId
      ? nextRooms[0]!.id
      : written.activeRoomId ?? nextRooms[0]!.id;

  return normalizeMultiRoomProject(
    {
      ...written,
      rooms: nextRooms,
      activeRoomId,
    },
    nextRooms.find((room) => room.id === activeRoomId)?.config ?? currentConfig,
  );
}

export function addRoomFromTemplate(
  project: CabinetProject,
  currentCabinets: CabinetProject["cabinets"],
  currentConfig: RoomConfig,
  template: ProjectRoom,
): CabinetProject {
  const written = writeActiveRoomState(project, currentCabinets, currentConfig);
  const rooms = listProjectRooms(written);
  const next = cloneRoom(template, template.name || `Room ${rooms.length + 1}`);

  return normalizeMultiRoomProject(
    {
      ...written,
      rooms: [...rooms, next],
      activeRoomId: next.id,
    },
    next.config,
  );
}
