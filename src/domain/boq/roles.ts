import type { PartCategory } from "../cabinetConstruction";

/** Shop-facing BOQ bucket for a construction part category. */
export type BoqBoardRole = "carcass" | "shutter" | "back" | "other";

const CARCASS: ReadonlySet<string> = new Set([
  "Side",
  "TopBottom",
  "Shelf",
  "Divider",
  "EndPanel",
  "ToeKick",
  "Stretcher",
  "FaceFrame",
  "DrawerBox",
]);

const SHUTTER: ReadonlySet<string> = new Set(["Door", "DrawerFront"]);

const BACK: ReadonlySet<string> = new Set(["Back"]);

export function boqBoardRole(category: PartCategory | string): BoqBoardRole {
  const key = String(category);
  if (SHUTTER.has(key)) return "shutter";
  if (BACK.has(key)) return "back";
  if (CARCASS.has(key)) return "carcass";
  return "other";
}

export function boqBoardRoleLabel(role: BoqBoardRole): string {
  switch (role) {
    case "carcass":
      return "Carcass";
    case "shutter":
      return "Shutter";
    case "back":
      return "Back";
    default:
      return "Other";
  }
}
