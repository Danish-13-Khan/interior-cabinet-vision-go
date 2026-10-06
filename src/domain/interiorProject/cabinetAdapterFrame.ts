import type { CabinetInstance, CabinetPlacement, CabinetProject } from "../cabinetDimensions";
import type { ProjectRoom } from "../projectRooms";
import { cabinetObject } from "./cabinetAdapterCabinets";
import { frameIsOrigin, roomFrame } from "./roomFrame";
import type { InteriorObjectEntity, InteriorProject } from "./types";

const readPlacements = new WeakMap<CabinetProject, Map<string, CabinetPlacement>>();

function cabinetKey(cabinet: CabinetInstance) {
  return cabinet.interiorObjectId || cabinet.id;
}

function samePlacement(a: CabinetPlacement, b: CabinetPlacement) {
  return a.x === b.x && a.y === b.y && a.z === b.z
    && a.rotation === b.rotation && a.attachment === b.attachment;
}

/** Cabinets as Engineering holds them, before a later clamp. */
export function incomingCabinets(project: CabinetProject): Map<string, CabinetInstance> {
  const map = new Map<string, CabinetInstance>();
  const rooms = project.rooms ?? [];
  const lists = rooms.length === 0
    ? [project.cabinets]
    : rooms.map((room) => (room.id === project.activeRoomId ? project.cabinets : room.cabinets));
  for (const cabinets of lists) {
    for (const cabinet of cabinets) map.set(cabinetKey(cabinet), cabinet);
  }
  return map;
}

/** Remember the placement read produced, so an unedited write can put the world position back. */
export function rememberReadPlacements(project: CabinetProject): CabinetProject {
  const map = new Map<string, CabinetPlacement>();
  for (const cabinet of incomingCabinets(project).values()) {
    map.set(cabinetKey(cabinet), { ...cabinet.placement });
  }
  readPlacements.set(project, map);
  return project;
}

/** Move world cabinet positions into the room's centred frame. Origin rooms stay as they are. */
export function centreRoomCabinets(
  document: InteriorProject,
  roomId: string,
  cabinets: CabinetInstance[],
): CabinetInstance[] {
  const frame = roomFrame(document, roomId);
  if (frameIsOrigin(frame)) return cabinets;
  const { x: cx, z: cz } = frame.centre;
  return cabinets.map((cabinet) => ({
    ...cabinet,
    placement: {
      ...cabinet.placement,
      x: cabinet.placement.x - cx,
      z: cabinet.placement.z - cz,
    },
  }));
}

/**
 * Wall attachment clamp assumes the room's back wall is the −Z side of a
 * centred box. Off-centre rooms keep the centred placement instead, so a
 * wall cabinet stays on the wall it was authored on.
 */
export function keepOffCentrePlacements(
  document: InteriorProject,
  centredRooms: readonly ProjectRoom[],
  project: CabinetProject,
): CabinetProject {
  const saved = new Map(centredRooms.map((room) => [
    room.id,
    new Map(room.cabinets.map((cabinet) => [cabinet.id, cabinet.placement])),
  ]));
  const rooms = (project.rooms ?? []).map((room) => {
    if (frameIsOrigin(roomFrame(document, room.id))) return room;
    const byId = saved.get(room.id);
    if (!byId) return room;
    return {
      ...room,
      cabinets: room.cabinets.map((cabinet) => {
        const placement = byId.get(cabinet.id);
        return placement ? { ...cabinet, placement } : cabinet;
      }),
    };
  });
  const active = rooms.find((room) => room.id === project.activeRoomId);
  return { ...project, rooms, cabinets: active?.cabinets ?? project.cabinets };
}

/**
 * Write a centred placement back to world. An unedited cabinet keeps the
 * position it had in the document. An edit is mapped out without a second clamp.
 */
export function cabinetObjectInWorld(
  document: InteriorProject,
  roomId: string,
  cabinet: CabinetInstance,
  host?: CabinetProject,
): InteriorObjectEntity {
  const drafted = cabinetObject(roomId, cabinet);
  const sourceId = cabinet.interiorObjectId || drafted.id;
  const source = document.objects.find((item) => item.id === sourceId);
  const read = host ? readPlacements.get(host)?.get(cabinetKey(cabinet)) : undefined;
  const rotation = source && read && cabinet.placement.rotation === read.rotation
    ? { ...source.rotation }
    : drafted.rotation;
  if (source && read && samePlacement(read, cabinet.placement)) {
    return { ...drafted, position: { ...source.position }, rotation };
  }
  const frame = roomFrame(document, roomId);
  const position = frameIsOrigin(frame)
    ? drafted.position
    : {
        x: cabinet.placement.x + frame.centre.x,
        y: cabinet.placement.y,
        z: cabinet.placement.z + frame.centre.z,
      };
  return { ...drafted, position, rotation };
}

/** World cabinet objects for every room, using the pre-clamp Engineering placement. */
export function cabinetsInWorld(
  document: InteriorProject,
  rooms: readonly ProjectRoom[],
  host: CabinetProject,
): InteriorObjectEntity[] {
  const incoming = incomingCabinets(host);
  const remembered = readPlacements.get(host);
  return rooms.flatMap((room) => room.cabinets.map((cabinet) => {
    const key = cabinet.interiorObjectId || cabinet.id;
    const prior = incoming.get(key) ?? incoming.get(cabinet.id);
    const placement = prior && remembered?.has(cabinetKey(prior)) ? prior : cabinet;
    return cabinetObjectInWorld(document, room.id, placement, host);
  }));
}
