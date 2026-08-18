import {
  cabinetsOverlap,
  type CabinetInstance,
  type CabinetPlacement,
} from "./cabinetDimensions";
import { cabinetBlocksOpening, type RoomConfig } from "./roomModel";

export type PlacementConflict = "cabinet" | "opening";

function overlapsVertically(first: CabinetInstance, second: CabinetInstance) {
  const firstTop = first.placement.y + first.config.dimensions.height;
  const secondTop = second.placement.y + second.config.dimensions.height;
  return first.placement.y < secondTop && second.placement.y < firstTop;
}

/**
 * Resolves the same placement constraints for previews and committed edits.
 * Callers retain control over how to present a rejected placement.
 */
export function placementConflict(options: {
  cabinet: CabinetInstance;
  others: CabinetInstance[];
  placement: CabinetPlacement;
  room: RoomConfig;
}): PlacementConflict | null {
  const candidate: CabinetInstance = {
    ...options.cabinet,
    placement: options.placement,
  };

  if (cabinetBlocksOpening(candidate, options.room)) return "opening";
  return options.others.some((other) =>
    overlapsVertically(candidate, other) && cabinetsOverlap(candidate, other),
  )
    ? "cabinet"
    : null;
}
