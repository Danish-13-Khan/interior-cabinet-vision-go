import type { FaceFrameSpec } from "../cabinetConstructionSpec";
import { DOOR_PANEL_GROOVE_MM, doorFrameWidths, type DoorFrontStyle } from "../frontSystem/doorStyles";

export type DoorPieceKind = "door" | "stile" | "rail" | "panel";

export type DoorPiece = {
  kind: DoorPieceKind;
  perLeaf: number;
  lengthMm: number;
  widthMm: number;
  thicknessMm: number;
};

/**
 * What one door leaf is cut as, shared by production and the legacy cut list. Slab and bought shaker /
 * glass doors are one door; in-house frames are two stiles and two rails, plus a grooved centre panel
 * for shaker (glass goes on the hardware list, not the cut list).
 */
export function doorPieces(
  leaf: { widthMm: number; heightMm: number },
  style: DoorFrontStyle | undefined,
  frame: FaceFrameSpec,
  thicknessMm: number,
): DoorPiece[] {
  if (style?.sourcing !== "in-house") {
    return [{ kind: "door", perLeaf: 1, lengthMm: leaf.heightMm, widthMm: leaf.widthMm, thicknessMm }];
  }
  const { stileMm, railMm } = doorFrameWidths(leaf, frame);
  const pieces: DoorPiece[] = [
    { kind: "stile", perLeaf: 2, lengthMm: leaf.heightMm, widthMm: stileMm, thicknessMm },
    { kind: "rail", perLeaf: 2, lengthMm: leaf.widthMm - stileMm * 2, widthMm: railMm, thicknessMm },
  ];
  if (style.style === "shaker") {
    pieces.push({
      kind: "panel",
      perLeaf: 1,
      lengthMm: leaf.heightMm - railMm * 2 + DOOR_PANEL_GROOVE_MM * 2,
      widthMm: leaf.widthMm - stileMm * 2 + DOOR_PANEL_GROOVE_MM * 2,
      thicknessMm: Math.round(thicknessMm / 2),
    });
  }
  return pieces;
}
