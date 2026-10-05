import { frontGapSpec } from "../cabinetConstruction/frontGaps";

/** Elevation front gaps (mm) — overlay mount as shop default. */
export const ELEV_DOOR_GAPS = frontGapSpec("overlay");

export const ELEV_DRAWER_GAP_MM = ELEV_DOOR_GAPS.centerMm;
export const ELEV_DRAWER_SIDE_MM = ELEV_DOOR_GAPS.sideMm;
export const ELEV_DRAWER_BOTTOM_MM = ELEV_DOOR_GAPS.bottomMm;

export function elevMm(pxScale: number, mm: number) {
  return Math.max(0.35, mm / pxScale);
}

export function openingHitAttrs(
  cabinetId: string,
  openingId: string,
  contentType: string,
  active: boolean,
  extra = "",
) {
  return `class="twod-opening-face ${active ? "is-active-opening" : ""}" data-cabinet-id="${cabinetId}" data-opening-id="${openingId}" data-content-type="${contentType}" ${extra}`;
}
