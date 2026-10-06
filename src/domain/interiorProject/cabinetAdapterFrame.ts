import type { CabinetInstance, CabinetPlacement, CabinetProject } from "../cabinetDimensions";
import type { ProjectRoom } from "../projectRooms";
import { cabinetObject } from "./cabinetAdapterCabinets";
import { frameIsOrigin, roomFrame } from "./roomFrame";
import type { InteriorObjectEntity, InteriorProject } from "./types";

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

/**
 * Stamp every cabinet with the placement this read produced (`readPlacement`).
 * The stamp lives on the cabinet, not beside the project, so an unedited cabinet
 * is still recognised after Engineering's immutable edits, history or a reload.
 */
export function stampReadPlacements(project: CabinetProject): CabinetProject {
  const stamp = (cabinet: CabinetInstance): CabinetInstance => ({
    ...cabinet,
    readPlacement: { ...cabinet.placement },
  });
  if (!project.rooms) return { ...project, cabinets: project.cabinets.map(stamp) };
  const rooms = project.rooms.map((room) => ({ ...room, cabinets: room.cabinets.map(stamp) }));
  const active = rooms.find((room) => room.id === project.activeRoomId);
  return { ...project, rooms, cabinets: active?.cabinets ?? project.cabinets.map(stamp) };
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
 * Write a cabinet back to world. A stamped cabinet (`readPlacement`) keeps its
 * document position plus exactly what Engineering moved it by, so an unedited
 * cabinet never moves and an edit is not shifted by the read's clamp. Unstamped
 * cabinets are mapped out of the room frame as before.
 */
export function cabinetObjectInWorld(
  document: InteriorProject,
  roomId: string,
  cabinet: CabinetInstance,
): InteriorObjectEntity {
  const drafted = cabinetObject(roomId, cabinet);
  const source = document.objects.find((item) => item.id === (cabinet.interiorObjectId || drafted.id));
  const read = cabinet.readPlacement;
  if (source && read) {
    if (samePlacement(read, cabinet.placement)) {
      return { ...drafted, position: { ...source.position }, rotation: { ...source.rotation } };
    }
    return {
      ...drafted,
      position: {
        x: source.position.x + (cabinet.placement.x - read.x),
        y: source.position.y + (cabinet.placement.y - read.y),
        z: source.position.z + (cabinet.placement.z - read.z),
      },
      rotation: cabinet.placement.rotation === read.rotation ? { ...source.rotation } : drafted.rotation,
    };
  }
  const rotation = drafted.rotation;
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

/**
 * World cabinet objects for every room. A stamped cabinet is written from the
 * placement Engineering holds (before the write-back clamp); unstamped ones
 * (classic-only projects) keep the clamped placement as before.
 */
export function cabinetsInWorld(
  document: InteriorProject,
  rooms: readonly ProjectRoom[],
  host: CabinetProject,
): InteriorObjectEntity[] {
  const incoming = incomingCabinets(host);
  return rooms.flatMap((room) => room.cabinets.map((cabinet) => {
    const prior = incoming.get(cabinetKey(cabinet)) ?? incoming.get(cabinet.id);
    return cabinetObjectInWorld(document, room.id, prior?.readPlacement ? prior : cabinet);
  }));
}
