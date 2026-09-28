import type { RoomBounds } from "./cabinetDimensions";
import type { RoomDimensions } from "./roomModel";

/** Cabinet clamp bounds for a room; wall thickness sets where wall cabinets sit. */
export function cabinetRoomBounds(dimensions: RoomDimensions): RoomBounds {
  return {
    widthMm: dimensions.widthMm,
    depthMm: dimensions.depthMm,
    heightMm: dimensions.heightMm,
    wallThicknessMm: dimensions.wallThicknessMm,
  };
}
