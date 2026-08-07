import {
  cabinetsOverlap,
  clampCabinetPlacement,
  type CabinetInstance,
  type CabinetProject,
  type RoomBounds,
} from "./cabinetDimensions";
import { createCabinetId } from "./cabinetIds";
import { cabinetBlocksOpening, type RoomConfig } from "./roomModel";
import { deepClone } from "../utils/clone";

/** Create a collision-aware offset duplicate of a cabinet within the room. */
export function createOffsetDuplicate(
  cabinet: CabinetInstance,
  offsetIndex: number,
  currentProject: CabinetProject,
  room: RoomConfig,
  roomBounds: RoomBounds,
): CabinetInstance {
  const basePlacement =
    cabinet.placement.attachment === "floor"
      ? {
          ...cabinet.placement,
          x: cabinet.placement.x + 400 + offsetIndex * 120,
          z: cabinet.placement.z + 200 + offsetIndex * 80,
        }
      : {
          ...cabinet.placement,
          y: cabinet.placement.y + 120 + offsetIndex * 60,
        };

  let placement = clampCabinetPlacement(
    basePlacement,
    cabinet.config.dimensions,
    roomBounds,
  );
  const duplicate: CabinetInstance = {
    ...deepClone(cabinet),
    id: createCabinetId(),
    name: `${cabinet.name} Copy`,
    placement,
  };

  for (let shift = 0; shift < 6; shift += 1) {
    const shiftedPlacement = clampCabinetPlacement(
      cabinet.placement.attachment === "floor"
        ? {
            ...basePlacement,
            x: basePlacement.x + shift * 300,
            z: basePlacement.z + shift * 150,
          }
        : {
            ...basePlacement,
            y: basePlacement.y + shift * 90,
          },
      cabinet.config.dimensions,
      roomBounds,
    );
    const shiftedDuplicate = {
      ...duplicate,
      placement: shiftedPlacement,
    };
    if (
      !currentProject.cabinets.some((existing) =>
        cabinetsOverlap(existing, shiftedDuplicate),
      ) &&
      !cabinetBlocksOpening(shiftedDuplicate, room)
    ) {
      placement = shiftedPlacement;
      break;
    }
  }

  return {
    ...duplicate,
    placement,
  };
}
