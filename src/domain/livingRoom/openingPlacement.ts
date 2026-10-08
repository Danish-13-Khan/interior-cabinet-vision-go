import type { InteriorProject, Point2Mm, WallEntity } from "../interiorProject";
import type { PlanSnapResult } from "./planSnapEngine";
import { snapSpanAlongWall, spanSnapMarker, wallLengthOf, wallOffsetCandidates, wallOffsetOf } from "./wallOffsetSnap";

/** Project a plan pointer onto a wall and return a snapped, centered opening offset. */
export function openingOffsetAtPoint(
  wall: WallEntity,
  point: Point2Mm,
  widthMm: number,
  snapMm: number,
) {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.max(1, Math.hypot(dx, dz));
  const centerMm = ((point.x - wall.start.x) * dx + (point.z - wall.start.z) * dz) / length;
  const safeWidth = Math.min(Math.max(300, widthMm), length);
  const step = Math.max(25, snapMm);
  return Math.max(
    0,
    Math.min(length - safeWidth, Math.round((centerMm - safeWidth / 2) / step) * step),
  );
}

export function moveOpeningOffset(input: {
  startOffsetMm: number; widthMm: number; wallLengthMm: number; deltaMm: number; snapMm: number;
}) {
  const step = Math.max(25, input.snapMm);
  return Math.max(0, Math.min(input.wallLengthMm - input.widthMm, Math.round((input.startOffsetMm + input.deltaMm) / step) * step));
}

export function resizeOpeningWidth(input: {
  startWidthMm: number; offsetMm: number; wallLengthMm: number; deltaMm: number; snapMm: number;
}) {
  const step = Math.max(25, input.snapMm);
  return Math.max(300, Math.min(input.wallLengthMm - input.offsetMm, Math.round((input.startWidthMm + input.deltaMm) / step) * step));
}

/** Drag the start edge: offset and width move together so the end stays put. */
export function resizeOpeningFromStart(input: {
  startOffsetMm: number; startWidthMm: number; wallLengthMm: number; deltaMm: number; snapMm: number;
}) {
  const step = Math.max(25, input.snapMm);
  const endMm = input.startOffsetMm + input.startWidthMm;
  const nextOffset = Math.max(
    0,
    Math.min(endMm - 300, Math.round((input.startOffsetMm + input.deltaMm) / step) * step),
  );
  return {
    offsetMm: nextOffset,
    widthMm: Math.max(300, Math.min(input.wallLengthMm - nextOffset, endMm - nextOffset)),
  };
}

/**
 * Phase 4: an opening's centre snaps to the wall midpoint and its edges to the
 * other openings and cabinets on that wall, within the pick radius; otherwise
 * the start offset rounds to the grid as before. `centreMm` is where the user
 * put the opening's centre along the wall (project a pointer with `wallOffsetOf`).
 */
export function snapOpeningOffset(
  project: InteriorProject,
  wall: WallEntity,
  input: { centreMm: number; widthMm: number; excludeOpeningId?: string; thresholdMm: number; gridMm: number },
): { offsetMm: number; snap: PlanSnapResult | null } {
  const length = Math.max(1, wallLengthOf(wall));
  const widthMm = Math.min(Math.max(300, input.widthMm), length);
  const snap = snapSpanAlongWall({
    centreMm: input.centreMm,
    widthMm,
    lengthMm: length,
    candidates: wallOffsetCandidates(project, wall, { excludeOpeningId: input.excludeOpeningId }),
    thresholdMm: input.thresholdMm,
    gridMm: Math.max(25, input.gridMm),
  });
  return { offsetMm: Math.max(0, Math.min(length - widthMm, snap.centreMm - widthMm / 2)), snap: spanSnapMarker(wall, snap) };
}

/** Pointer → centre offset along the wall, for `snapOpeningOffset`. */
export function openingCentreAtPoint(wall: WallEntity, point: Point2Mm): number {
  return wallOffsetOf(wall, point);
}

/** The offset that centres an opening on its wall (the inspector's "Centre on wall"). */
export function centredOpeningOffset(wall: WallEntity, widthMm: number): number {
  return Math.max(0, (wallLengthOf(wall) - widthMm) / 2);
}
