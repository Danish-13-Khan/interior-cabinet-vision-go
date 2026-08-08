import type { CabinetType } from "../cabinetCapabilities";
import {
  isStorageType,
  supportsDoors,
  supportsDrawers,
  supportsEndPanels,
  supportsShelves,
  supportsToeKick,
} from "../cabinetCapabilities";
import type { CompositionCapabilities } from "./types";

export function supportsDividers(type: CabinetType): boolean {
  return (
    type === "base" ||
    type === "wall" ||
    type === "tall" ||
    type === "corner" ||
    type === "open-shelf" ||
    type === "almirah"
  );
}

export function supportsFillers(type: CabinetType): boolean {
  return isStorageType(type) && type !== "corner";
}

export function supportsCompositionDrawers(type: CabinetType): boolean {
  return supportsDrawers(type);
}

export function supportsOpenings(type: CabinetType): boolean {
  return isStorageType(type);
}

export function getCompositionCapabilities(type: CabinetType): CompositionCapabilities {
  return {
    openings: supportsOpenings(type),
    shelves: supportsShelves(type),
    dividers: supportsDividers(type),
    doors: supportsDoors(type),
    drawers: supportsCompositionDrawers(type),
    toeKick: supportsToeKick(type),
    fillers: supportsFillers(type),
    endPanels: supportsEndPanels(type),
  };
}
