import type { OpeningEntity } from "./types";

export type OpeningVertical = Pick<OpeningEntity, "heightMm" | "sillHeightMm">;

/** Fit an opening into the host wall by capping height, then lowering the sill. */
export function clampOpeningVertical(
  opening: OpeningVertical,
  wallHeightMm: number,
  options: { minHeightMm?: number } = {},
): OpeningVertical {
  const wallTop = Math.max(0, wallHeightMm);
  const minHeight = Math.max(0, options.minHeightMm ?? 0);
  const heightMm = Math.min(wallTop, Math.max(minHeight, opening.heightMm));
  const maxSill = Math.max(0, wallTop - heightMm);
  return {
    heightMm,
    sillHeightMm: Math.min(maxSill, Math.max(0, opening.sillHeightMm)),
  };
}

export function openingVerticalExceedsWall(
  opening: OpeningVertical,
  wallHeightMm: number,
): boolean {
  if (opening.sillHeightMm < -0.5 || opening.heightMm < 0) return true;
  return opening.sillHeightMm + opening.heightMm > wallHeightMm + 0.5;
}
