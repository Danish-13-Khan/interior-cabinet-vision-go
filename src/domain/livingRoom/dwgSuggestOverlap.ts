import type { Point2Mm } from "../interiorProject";
import { DWG_SUGGEST_JOIN_MM, DWG_SUGGEST_MIN_LEN_MM } from "./dwgSuggestNormalize";
import type { DwgSuggestCandidate, DwgSuggestDraft } from "./dwgSuggestDraft";

export type DwgSuggestOverlap = "none" | "covered" | "partial";
export type DwgSuggestWallSeg = { start: Point2Mm; end: Point2Mm };

function lengthOf(a: Point2Mm, b: Point2Mm) {
  return Math.hypot(b.x - a.x, b.z - a.z);
}

/** Geometry only: ignore direction, thickness, height, and material. */
export function classifyDwgSuggestOverlap(
  candidate: { a: Point2Mm; b: Point2Mm },
  walls: readonly DwgSuggestWallSeg[],
  eps = DWG_SUGGEST_JOIN_MM,
): DwgSuggestOverlap {
  const len = lengthOf(candidate.a, candidate.b);
  if (len < DWG_SUGGEST_MIN_LEN_MM) return "none";
  const ux = (candidate.b.x - candidate.a.x) / len;
  const uz = (candidate.b.z - candidate.a.z) / len;
  const intervals: { t0: number; t1: number }[] = [];
  for (const wall of walls) {
    const wallLen = lengthOf(wall.start, wall.end);
    if (wallLen < DWG_SUGGEST_MIN_LEN_MM) continue;
    const wx = (wall.end.x - wall.start.x) / wallLen;
    const wz = (wall.end.z - wall.start.z) / wallLen;
    if (Math.abs(ux * wz - uz * wx) > 0.02) continue;
    const distA = Math.abs((wall.start.x - candidate.a.x) * uz - (wall.start.z - candidate.a.z) * ux);
    const distB = Math.abs((wall.end.x - candidate.a.x) * uz - (wall.end.z - candidate.a.z) * ux);
    if (distA > eps || distB > eps) continue;
    const tA = (wall.start.x - candidate.a.x) * ux + (wall.start.z - candidate.a.z) * uz;
    const tB = (wall.end.x - candidate.a.x) * ux + (wall.end.z - candidate.a.z) * uz;
    const t0 = Math.max(0, Math.min(tA, tB));
    const t1 = Math.min(len, Math.max(tA, tB));
    if (t1 - t0 > eps) intervals.push({ t0, t1 });
  }
  if (!intervals.length) return "none";
  intervals.sort((left, right) => left.t0 - right.t0);
  const merged: { t0: number; t1: number }[] = [];
  for (const interval of intervals) {
    const last = merged[merged.length - 1];
    if (!last || interval.t0 > last.t1 + eps) merged.push({ ...interval });
    else last.t1 = Math.max(last.t1, interval.t1);
  }
  const full = merged.length === 1 && merged[0]!.t0 <= eps && merged[0]!.t1 >= len - eps;
  return full ? "covered" : "partial";
}

export function applyDwgSuggestOverlap(
  draft: DwgSuggestDraft,
  walls: readonly DwgSuggestWallSeg[],
): DwgSuggestDraft {
  return {
    ...draft,
    candidates: draft.candidates.map((candidate) => {
      const overlap = classifyDwgSuggestOverlap(candidate, walls);
      return {
        ...candidate,
        overlap,
        accepted: overlap === "none" ? candidate.accepted : false,
      };
    }),
  };
}

export function dwgSuggestCandidateSelectable(candidate: DwgSuggestCandidate) {
  return (candidate.overlap ?? "none") === "none";
}
