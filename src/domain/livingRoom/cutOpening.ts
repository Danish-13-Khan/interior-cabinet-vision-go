import type { OpeningEntity } from "../interiorProject";

/** Width of a wall-window cut. The panel centres this on the host wall. */
export const CUT_OPENING_WIDTH_MM = 900;

export function cutOpeningOffsetMm(wallLengthMm: number, widthMm = CUT_OPENING_WIDTH_MM) {
  return Math.max(0, Math.round((wallLengthMm - Math.min(widthMm, wallLengthMm)) / 2));
}

/** Floor-to-head void. Kind `opening` splits the wall and draws no door or window leaf. */
export function createCutOpening(input: {
  id: string;
  roomId?: string | null;
  wallId: string;
  offsetMm: number;
  wallHeightMm: number;
  widthMm?: number;
}): OpeningEntity {
  return {
    id: input.id,
    roomId: input.roomId,
    wallId: input.wallId,
    kind: "opening",
    offsetMm: input.offsetMm,
    widthMm: input.widthMm ?? CUT_OPENING_WIDTH_MM,
    heightMm: input.wallHeightMm,
    sillHeightMm: 0,
  };
}
