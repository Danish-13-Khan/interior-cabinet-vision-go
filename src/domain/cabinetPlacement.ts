import {
  clampCabinetPlacement,
  cabinetsOverlap,
  getWallPlacement,
  supportsWallPlacement,
  type CabinetConfig,
  type CabinetInstance,
  type CabinetPlacement,
  type CabinetProject,
} from "./cabinetDimensions";
import { cabinetBlocksOpening, type RoomConfig } from "./roomModel";

type RoomBounds = {
  widthMm: number;
  depthMm: number;
  heightMm: number;
};

/** Find a non-colliding floor/wall placement for a newly added cabinet. */
export function findPlacementForNewCabinet(
  project: CabinetProject,
  room: RoomConfig,
  roomBounds: RoomBounds,
  config: CabinetConfig,
  provisional: CabinetInstance,
): CabinetPlacement {
  const type = config.type;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const basePlacement: CabinetPlacement = {
      x: project.cabinets.length * 700 - 1000 + attempt * 400,
      y: 0,
      z: 0,
      rotation: 0,
      attachment: "floor",
    };
    const candidate = supportsWallPlacement(type)
      ? getWallPlacement(
          basePlacement,
          type,
          config.dimensions,
          "back-wall",
          roomBounds,
        )
      : clampCabinetPlacement(basePlacement, config.dimensions, roomBounds);
    const testCab = { ...provisional, placement: candidate };
    if (
      !project.cabinets.some((existing) => cabinetsOverlap(existing, testCab)) &&
      !cabinetBlocksOpening(testCab, room)
    ) {
      return candidate;
    }
  }

  return clampCabinetPlacement(
    {
      x: project.cabinets.length * 700 - 1000,
      y: 0,
      z: 0,
      rotation: 0,
      attachment: "floor",
    },
    config.dimensions,
    roomBounds,
  );
}
