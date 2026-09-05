import { clonePoint, distMm } from "./proposalGeom";
import type { ProposalPoint, ProposalRoom } from "./proposalTypes";

export type CloseLoopOptions = {
  /** Snap first/last together when gap ≤ this (mm). Default 80. */
  gapMm?: number;
};

export function closeOutlineLoop(
  outline: ProposalPoint[],
  options: CloseLoopOptions = {},
): ProposalPoint[] {
  if (outline.length < 3) return outline.map(clonePoint);
  const gapMm = options.gapMm ?? 80;
  const out = outline.map(clonePoint);
  const first = out[0];
  const last = out[out.length - 1];
  const gap = distMm(first, last);
  if (gap === 0) return out;
  if (gap <= gapMm) {
    out[out.length - 1] = clonePoint(first);
    return out;
  }
  return out;
}

export function closeRoomLoops(
  rooms: ProposalRoom[],
  options: CloseLoopOptions = {},
): ProposalRoom[] {
  return rooms.map((r) => ({
    ...r,
    outlineMm: closeOutlineLoop(r.outlineMm, options),
  }));
}
