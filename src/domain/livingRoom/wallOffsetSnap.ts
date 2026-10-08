import type { InteriorProject, Point2Mm, WallEntity } from "../interiorProject";
import { PLAN_SNAP_PRIORITY, type PlanSnapKind, type PlanSnapResult } from "./planSnapEngine";

/**
 * One-dimensional snapping along a wall (roadmap Phase 4). Openings and
 * cabinets live on a wall as a span [centre − w/2, centre + w/2]; the span's
 * centre snaps to the wall midpoint and its edges snap to the edges of other
 * openings and cabinets on the same wall. Everything is projected onto the
 * given wall's start→end direction, so an oriented (flipped) wall works too.
 */
export type WallOffsetCandidate = {
  /** Position along the wall, from its start, in mm. */
  offsetMm: number;
  kind: PlanSnapKind;
  label: string;
  priority: number;
  sourceId?: string;
};

export function wallLengthOf(wall: Pick<WallEntity, "start" | "end">): number {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
}

export function wallPointAt(wall: Pick<WallEntity, "start" | "end">, offsetMm: number): Point2Mm {
  const length = wallLengthOf(wall) || 1;
  return {
    x: wall.start.x + (wall.end.x - wall.start.x) / length * offsetMm,
    z: wall.start.z + (wall.end.z - wall.start.z) / length * offsetMm,
  };
}

/** Offset of a world point along the wall's direction, from its start. */
export function wallOffsetOf(wall: Pick<WallEntity, "start" | "end">, point: Point2Mm): number {
  const length = wallLengthOf(wall) || 1;
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  return (point.x - wall.start.x) * ux + (point.z - wall.start.z) * uz;
}

function capitalise(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function attachedWallId(extensions: Record<string, unknown> | undefined): string | undefined {
  const attachment = extensions?.wallAttachment;
  return attachment && typeof attachment === "object" ? (attachment as { wallId?: string }).wallId : undefined;
}

/**
 * Snap targets along `wall`: its midpoint, the edges of its other openings,
 * and the edges of other objects attached to it. `wall` may be the oriented
 * copy of a stored wall; openings are read from the stored wall of the same id.
 */
export function wallOffsetCandidates(
  project: InteriorProject,
  wall: WallEntity,
  options: { excludeOpeningId?: string; excludeObjectId?: string } = {},
): WallOffsetCandidate[] {
  const candidates: WallOffsetCandidate[] = [];
  const length = wallLengthOf(wall);
  candidates.push({ offsetMm: length / 2, kind: "midpoint", label: "Wall midpoint", priority: PLAN_SNAP_PRIORITY.midpoint, sourceId: wall.id });

  const stored = project.walls.find((item) => item.id === wall.id) ?? wall;
  for (const opening of project.openings) {
    if (opening.wallId !== wall.id || opening.id === options.excludeOpeningId) continue;
    const label = `${capitalise(opening.kind)} edge`;
    for (const edge of [opening.offsetMm, opening.offsetMm + opening.widthMm]) {
      candidates.push({
        offsetMm: wallOffsetOf(wall, wallPointAt(stored, edge)),
        kind: "opening-edge", label, priority: PLAN_SNAP_PRIORITY["opening-edge"], sourceId: opening.id,
      });
    }
  }

  for (const object of project.objects) {
    if (object.id === options.excludeObjectId || attachedWallId(object.extensions) !== wall.id) continue;
    const centre = wallOffsetOf(wall, { x: object.position.x, z: object.position.z });
    for (const edge of [centre - object.dimensions.widthMm / 2, centre + object.dimensions.widthMm / 2]) {
      candidates.push({
        offsetMm: edge, kind: "cabinet-edge", label: "Cabinet edge", priority: PLAN_SNAP_PRIORITY["cabinet-edge"], sourceId: object.id,
      });
    }
  }
  return candidates;
}

export type SpanSnap = {
  /** Snapped centre along the wall. */
  centreMm: number;
  /** The target that won, with its position along the wall; null when only the grid or nothing applied. */
  candidate: WallOffsetCandidate | null;
  /** True when the grid fallback moved the span. */
  gridded: boolean;
};

/**
 * Snap a span of `widthMm` whose centre the user put at `centreMm`: the centre
 * to a midpoint-kind candidate, either edge to an edge-kind candidate, nearest
 * within `thresholdMm` (ties by priority). Without a hit the start edge rounds
 * to `gridMm` (0 disables). The span is kept inside the wall.
 */
export function snapSpanAlongWall(input: {
  centreMm: number;
  widthMm: number;
  lengthMm: number;
  candidates: readonly WallOffsetCandidate[];
  thresholdMm: number;
  gridMm: number;
}): SpanSnap {
  const half = input.widthMm / 2;
  const clamp = (centre: number) => Math.max(half, Math.min(input.lengthMm - half, centre));
  let best: { centre: number; candidate: WallOffsetCandidate; distance: number } | null = null;
  for (const candidate of input.candidates) {
    const options = candidate.kind === "midpoint"
      ? [candidate.offsetMm]
      : [candidate.offsetMm + half, candidate.offsetMm - half];
    for (const centre of options) {
      const distance = Math.abs(centre - input.centreMm);
      if (distance > input.thresholdMm) continue;
      if (!best || distance < best.distance - 0.01
        || (Math.abs(distance - best.distance) <= 0.01 && candidate.priority < best.candidate.priority)) {
        best = { centre, candidate, distance };
      }
    }
  }
  // A target the span cannot actually reach inside the wall is no target.
  if (best && Math.abs(clamp(best.centre) - best.centre) <= 0.01) {
    return { centreMm: best.centre, candidate: best.candidate, gridded: false };
  }
  if (input.gridMm > 0) {
    const start = Math.round((input.centreMm - half) / input.gridMm) * input.gridMm;
    return { centreMm: clamp(start + half), candidate: null, gridded: true };
  }
  return { centreMm: clamp(input.centreMm), candidate: null, gridded: false };
}

/** Marker for the shared indicator: the winning target's point on the wall. */
export function spanSnapMarker(wall: Pick<WallEntity, "start" | "end">, snap: SpanSnap): PlanSnapResult | null {
  if (!snap.candidate) return null;
  const point = wallPointAt(wall, snap.candidate.offsetMm);
  return {
    point,
    candidate: {
      kind: snap.candidate.kind,
      point,
      label: snap.candidate.label,
      sourceId: snap.candidate.sourceId,
      priority: snap.candidate.priority,
    },
  };
}
