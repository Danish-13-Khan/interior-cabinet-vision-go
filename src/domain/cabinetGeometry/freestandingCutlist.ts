import type { CabinetConfig } from "../cabinetDimensions";
import type { CabinetCutlistItem } from "./types";

/** Cut list for non-storage items (table, chair, mirror, …). Expects a clamped config. */
export function freestandingCutlist(safeConfig: CabinetConfig): CabinetCutlistItem[] {
  const { width, height, depth, boardThickness, backPanelThickness } = safeConfig.dimensions;

  switch (safeConfig.type) {
    case "table":
      return [
        {
          key: "table-top",
          label: "Table Top",
          quantity: 1,
          lengthMm: width,
          widthMm: depth,
          thicknessMm: boardThickness,
          material: "Board",
        },
        {
          key: "table-legs",
          label: "Table Leg",
          quantity: 4,
          lengthMm: height - boardThickness,
          widthMm: Math.min(boardThickness, 80),
          thicknessMm: Math.min(boardThickness, 80),
          material: "Board",
        },
      ];
    case "chair":
      return [
        {
          key: "chair-seat",
          label: "Chair Seat",
          quantity: 1,
          lengthMm: width,
          widthMm: Math.round(depth * 0.7),
          thicknessMm: boardThickness,
          material: "Board",
        },
        {
          key: "chair-back",
          label: "Chair Back",
          quantity: 1,
          lengthMm: Math.round(height * 0.42),
          widthMm: width,
          thicknessMm: boardThickness,
          material: "Board",
        },
        {
          key: "chair-legs",
          label: "Chair Leg",
          quantity: 4,
          lengthMm: Math.round(height * 0.45),
          widthMm: Math.min(boardThickness, 50),
          thicknessMm: Math.min(boardThickness, 50),
          material: "Board",
        },
      ];
    case "sofa":
      return [
        {
          key: "sofa-base",
          label: "Sofa Base",
          quantity: 1,
          lengthMm: width,
          widthMm: depth,
          thicknessMm: boardThickness,
          material: "Board",
        },
        {
          key: "sofa-arms",
          label: "Sofa Arm",
          quantity: 2,
          lengthMm: height,
          widthMm: depth,
          thicknessMm: Math.round(width * 0.12),
          material: "Board",
        },
        {
          key: "sofa-back",
          label: "Sofa Back",
          quantity: 1,
          lengthMm: width,
          widthMm: Math.round(height * 0.62),
          thicknessMm: Math.round(depth * 0.18),
          material: "Back Panel",
        },
      ];
    case "mirror":
      return [
        {
          key: "mirror-glass",
          label: "Mirror Glass",
          quantity: 1,
          lengthMm: width,
          widthMm: height,
          thicknessMm: backPanelThickness,
          material: "Door",
        },
        {
          key: "mirror-frame",
          label: "Mirror Frame",
          quantity: 4,
          lengthMm: height,
          widthMm: Math.round(Math.min(boardThickness, width * 0.1)),
          thicknessMm: boardThickness,
          material: "Board",
        },
      ];
    default:
      return [];
  }
}
