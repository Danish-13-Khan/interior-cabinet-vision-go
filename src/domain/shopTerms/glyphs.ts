import type { CabinetType } from "../cabinetDimensions";
import type { OpeningContentType } from "../cabinetOpeningStructure";
import type { CabinetRunSide } from "../cabinetLibrary";

/** Compact CAD glyphs for tree, tabs, and packet links. */
export const FAMILY_GLYPHS: Record<CabinetType, string> = {
  base: "B",
  wall: "W",
  tall: "T",
  drawer: "D",
  sink: "S",
  corner: "C",
  "open-shelf": "O",
  almirah: "A",
  table: "Tb",
  chair: "Ch",
  sofa: "Sf",
  mirror: "M",
};

export const FAMILY_TONES: Record<CabinetType, string> = {
  base: "base",
  wall: "wall",
  tall: "tall",
  drawer: "drawer",
  sink: "sink",
  corner: "corner",
  "open-shelf": "shelf",
  almirah: "tall",
  table: "furn",
  chair: "furn",
  sofa: "furn",
  mirror: "wall",
};

export const OPENING_GLYPHS: Record<OpeningContentType, string> = {
  door: "OP",
  "drawer-stack": "DW",
  "open-shelf": "SH",
  divider: "DV",
  empty: "—",
};

export const VIEW_GLYPHS: Record<
  "plan" | "front" | "side" | "section" | "detail" | "report" | "model",
  string
> = {
  plan: "PL",
  front: "EL",
  side: "SE",
  section: "§",
  detail: "DT",
  report: "SC",
  model: "3D",
};

export function familyGlyph(type: CabinetType): string {
  return FAMILY_GLYPHS[type] ?? "?";
}

export function familyTone(type: CabinetType): string {
  return FAMILY_TONES[type] ?? "base";
}

export function openingGlyph(type: OpeningContentType): string {
  return OPENING_GLYPHS[type] ?? "OC";
}

export function viewGlyph(
  id: keyof typeof VIEW_GLYPHS,
): string {
  return VIEW_GLYPHS[id];
}

export function wallGlyph(side: CabinetRunSide): string {
  switch (side) {
    case "back-wall":
      return "BW";
    case "left-wall":
      return "LW";
    case "right-wall":
      return "RW";
    default:
      return "FR";
  }
}
