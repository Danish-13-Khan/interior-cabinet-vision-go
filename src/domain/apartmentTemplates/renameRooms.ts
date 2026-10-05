import {
  renameInteriorRoom,
  roomPlanViewBounds,
  type InteriorProject,
} from "../interiorProject";
import type { ApartmentRoomSpec } from "./types";

/** Rename, type, and stamp materials for each authored room cell. */
export function applyRoomSpecs(
  project: InteriorProject,
  rooms: readonly ApartmentRoomSpec[],
  cellToRoomId: Map<string, string>,
): { project: InteriorProject; roomKeyToId: Map<string, string> } {
  let next = project;
  const roomKeyToId = new Map<string, string>();
  for (const spec of rooms) {
    const roomId = cellToRoomId.get(spec.cell);
    if (!roomId) throw new Error(`No room for cell "${spec.cell}" (${spec.key})`);
    roomKeyToId.set(spec.key, roomId);
    next = renameInteriorRoom(next, roomId, spec.name);
    const bounds = roomPlanViewBounds(next, roomId);
    next = {
      ...next,
      rooms: next.rooms.map((room) => {
        if (room.id !== roomId) return room;
        return {
          ...room,
          roomType: spec.roomType,
          dimensions: {
            widthMm: bounds.widthMm,
            depthMm: bounds.depthMm,
            heightMm: room.dimensions.heightMm,
          },
          extensions: {
            ...room.extensions,
            apartmentRoomKey: spec.key,
            apartmentCell: spec.cell,
            ...(spec.floorMaterialId ? { floorMaterialId: spec.floorMaterialId } : {}),
            ...(spec.ceilingMaterialId
              ? { ceilingMaterialId: spec.ceilingMaterialId }
              : {}),
          },
        };
      }),
    };
  }
  return { project: next, roomKeyToId };
}
