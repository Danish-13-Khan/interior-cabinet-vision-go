import type { CabinetType } from "../cabinetDimensions";

/** Full shop family names (schedules, inspectors, library). */
export const FAMILY_TERMS: Record<CabinetType, string> = {
  base: "Base Cabinet",
  wall: "Wall Cabinet",
  tall: "Tall Cabinet",
  drawer: "Drawer Bank",
  sink: "Sink Base",
  corner: "Corner Cabinet",
  "open-shelf": "Open Shelf",
  almirah: "Almirah",
  table: "Table",
  chair: "Chair",
  sofa: "Sofa",
  mirror: "Mirror",
};

/** Short family labels for trees and elevation titles. */
export const FAMILY_SHORT: Record<CabinetType, string> = {
  base: "Base",
  wall: "Wall",
  tall: "Tall",
  drawer: "Drawer",
  sink: "Sink",
  corner: "Corner",
  "open-shelf": "Shelf",
  almirah: "Almirah",
  table: "Table",
  chair: "Chair",
  sofa: "Sofa",
  mirror: "Mirror",
};

export function familyTerm(type: CabinetType): string {
  return FAMILY_TERMS[type] ?? type;
}

export function familyShort(type: CabinetType): string {
  return FAMILY_SHORT[type] ?? type;
}
