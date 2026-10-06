import type { CabinetInstance, CabinetProject } from "../cabinetDimensions";
import type { ProjectRoom } from "../projectRooms";
import { cabinetObject } from "./cabinetAdapterCabinets";
import { frameIsOrigin, roomFrame } from "./roomFrame";
import type { InteriorObjectEntity, InteriorProject } from "./types";

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

/** Write a centred placement back to world. Origin rooms keep the classic object unchanged. */
export function cabinetObjectInWorld(
  document: InteriorProject,
  roomId: string,
  cabinet: CabinetInstance,
): InteriorObjectEntity {
  const object = cabinetObject(roomId, cabinet);
  const frame = roomFrame(document, roomId);
  if (frameIsOrigin(frame)) return object;
  return {
    ...object,
    position: {
      x: object.position.x + frame.centre.x,
      y: object.position.y,
      z: object.position.z + frame.centre.z,
    },
  };
}
