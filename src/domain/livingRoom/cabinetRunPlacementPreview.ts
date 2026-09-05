import type { InteriorObjectEntity, InteriorProject, OpeningEntity, WallEntity } from "../interiorProject";
import { orientWallForRoom, selectRoomOpenings } from "../interiorProject";
import { FILLER_MAX_MM, FILLER_MIN_MM, fillerWidthForGap } from "../cabinetRuns";
import { cabinetRunForObject } from "./cabinetRunLayout";
import { wallLength } from "./wallSegmentPlacement";

function isFillerObject(object: InteriorObjectEntity): boolean {
  return Boolean(object.extensions?.cabinetRunFiller);
}

export type AlongWallSpan = {
  startMm: number;
  endMm: number;
  kind: "cabinet" | "filler" | "opening";
  id: string;
};

export type FreeWallSegment = {
  startMm: number;
  endMm: number;
  lengthMm: number;
};

export type CabinetRunPlacementPreview = {
  wallId: string;
  wallLengthMm: number;
  occupied: AlongWallSpan[];
  freeSegments: FreeWallSegment[];
  remainingMm: number;
  openingCount: number;
  suggestedFillerWidthsMm: number[];
  candidateFits: boolean | null;
  bestFreeSegment: FreeWallSegment | null;
};

function offsetsAlongWall(object: InteriorObjectEntity, wall: WallEntity) {
  const length = wallLength(wall);
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  const center = (object.position.x - wall.start.x) * ux + (object.position.z - wall.start.z) * uz;
  const half = object.dimensions.widthMm / 2;
  return { start: center - half, end: center + half };
}

/** True when orientWallForRoom swapped the stored wall endpoints. */
export function isOrientedWallReversed(storedWall: WallEntity, orientedWall: WallEntity): boolean {
  return (
    Math.abs(orientedWall.start.x - storedWall.end.x) < 0.5
    && Math.abs(orientedWall.start.z - storedWall.end.z) < 0.5
  );
}

/**
 * Opening.offsetMm is relative to the **stored** wall start.
 * When the oriented wall is reversed, mirror the span into oriented coordinates.
 */
export function openingSpanOnOrientedWall(
  opening: OpeningEntity,
  storedWall: WallEntity,
  orientedWall: WallEntity,
  lengthMm: number,
): AlongWallSpan {
  const reversed = isOrientedWallReversed(storedWall, orientedWall);
  const startMm = reversed
    ? lengthMm - opening.offsetMm - opening.widthMm
    : opening.offsetMm;
  return {
    startMm,
    endMm: startMm + opening.widthMm,
    kind: "opening",
    id: opening.id,
  };
}

function mergeOccupied(spans: AlongWallSpan[]): AlongWallSpan[] {
  if (spans.length === 0) return [];
  const sorted = [...spans].sort((a, b) => a.startMm - b.startMm || a.endMm - b.endMm);
  const merged: AlongWallSpan[] = [{ ...sorted[0]! }];
  for (let i = 1; i < sorted.length; i += 1) {
    const current = sorted[i]!;
    const last = merged[merged.length - 1]!;
    if (current.startMm <= last.endMm + 0.5) {
      last.endMm = Math.max(last.endMm, current.endMm);
      last.id = `${last.id}+${current.id}`;
    } else {
      merged.push({ ...current });
    }
  }
  return merged;
}

/** Free segments along [0, wallLengthMm] given occupied spans (absolute mm). */
export function freeSegmentsAlongWall(wallLengthMm: number, occupied: AlongWallSpan[]): FreeWallSegment[] {
  const free: FreeWallSegment[] = [];
  let cursor = 0;
  for (const span of occupied) {
    const start = Math.max(0, span.startMm);
    if (start > cursor + 0.5) {
      free.push({ startMm: cursor, endMm: start, lengthMm: start - cursor });
    }
    cursor = Math.max(cursor, span.endMm);
  }
  if (wallLengthMm > cursor + 0.5) {
    free.push({ startMm: cursor, endMm: wallLengthMm, lengthMm: wallLengthMm - cursor });
  }
  return free.map((segment) => ({
    ...segment,
    lengthMm: Math.round(segment.lengthMm),
    startMm: Math.round(segment.startMm),
    endMm: Math.round(segment.endMm),
  }));
}

/** How much of [startMm, endMm] is free given occupied spans. */
export function freeLengthInInterval(
  occupied: AlongWallSpan[],
  startMm: number,
  endMm: number,
): number {
  if (endMm <= startMm + 0.5) return 0;
  const clipped = occupied
    .map((span) => ({
      ...span,
      startMm: Math.max(span.startMm, startMm),
      endMm: Math.min(span.endMm, endMm),
    }))
    .filter((span) => span.endMm > span.startMm + 0.5);
  const merged = mergeOccupied(clipped);
  let blocked = 0;
  for (const span of merged) blocked += span.endMm - span.startMm;
  return Math.max(0, endMm - startMm - blocked);
}

/** Contiguous free segments clipped to [startMm, endMm]. */
export function freeSegmentsInInterval(
  occupied: AlongWallSpan[],
  startMm: number,
  endMm: number,
): FreeWallSegment[] {
  const length = endMm - startMm;
  if (length <= 0.5) return [];
  const local = occupied
    .map((span) => ({
      ...span,
      startMm: span.startMm - startMm,
      endMm: span.endMm - startMm,
    }))
    .map((span) => ({
      ...span,
      startMm: Math.max(0, span.startMm),
      endMm: Math.min(length, span.endMm),
    }))
    .filter((span) => span.endMm > span.startMm + 0.5);
  return freeSegmentsAlongWall(length, mergeOccupied(local)).map((segment) => ({
    startMm: segment.startMm + startMm,
    endMm: segment.endMm + startMm,
    lengthMm: segment.lengthMm,
  }));
}

/** Cabinets + fillers attached to the wall in the given room (any run). runId is NOT used to exclude. */
function wallObjects(project: InteriorProject, wallId: string, roomId: string) {
  return project.objects.filter((object) => {
    if (object.kind !== "cabinet") return false;
    if (object.roomId !== roomId) return false;
    const attachment = object.extensions?.wallAttachment;
    const attachedWall = attachment && typeof attachment === "object"
      ? (attachment as { wallId?: unknown }).wallId
      : undefined;
    if (attachedWall === wallId) return true;
    const run = cabinetRunForObject(object);
    if (run?.wallId === wallId) return true;
    const fillerMeta = object.extensions?.cabinetRunFiller;
    const fillerWall = object.extensions?.wallAttachment;
    if (fillerMeta && fillerWall && typeof fillerWall === "object"
      && (fillerWall as { wallId?: unknown }).wallId === wallId) {
      return true;
    }
    return false;
  });
}

function roomIdForWall(project: InteriorProject, storedWall: WallEntity): string {
  if (storedWall.roomId && project.rooms.some((room) => room.id === storedWall.roomId)) {
    return storedWall.roomId;
  }
  return project.activeRoomId;
}

/**
 * All along-wall occupancy for a wall in a room: every cabinet/filler on the wall
 * in that room (any run) plus openings (with reverse-wall transform when needed).
 */
export function collectWallOccupancySpans(
  project: InteriorProject,
  wallId: string,
  roomId: string,
): { wall: WallEntity; lengthMm: number; occupied: AlongWallSpan[]; openingCount: number } | null {
  const storedWall = project.walls.find((item) => item.id === wallId);
  if (!storedWall) return null;
  const wall = orientWallForRoom(project, roomId, storedWall);
  const lengthMm = wallLength(wall);
  if (!lengthMm) return null;

  const members = wallObjects(project, wallId, roomId);
  const occupied: AlongWallSpan[] = members.map((object) => {
    const span = offsetsAlongWall(object, wall);
    return {
      startMm: span.start,
      endMm: span.end,
      kind: isFillerObject(object) ? "filler" : "cabinet",
      id: object.id,
    };
  });

  const openings = selectRoomOpenings(project, roomId).filter((opening) => opening.wallId === wallId);
  for (const opening of openings) {
    occupied.push(openingSpanOnOrientedWall(opening, storedWall, wall, lengthMm));
  }

  // Keep spans unmerged so callers can exclude individual cabinets without
  // dropping co-located openings/fillers that share a merged id.
  const clipped = occupied.map((span) => ({
    ...span,
    startMm: Math.max(0, span.startMm),
    endMm: Math.min(lengthMm, span.endMm),
  })).filter((span) => span.endMm > span.startMm)
    .sort((a, b) => a.startMm - b.startMm || a.endMm - b.endMm);

  return {
    wall,
    lengthMm: Math.round(lengthMm),
    occupied: clipped,
    openingCount: openings.length,
  };
}

/** Preview remaining free wall space for guided cabinet-run placement. */
export function previewCabinetRunPlacement(
  project: InteriorProject,
  wallId: string,
  options: { runId?: string | null; candidateWidthMm?: number; roomId?: string } = {},
): CabinetRunPlacementPreview | null {
  const storedWall = project.walls.find((item) => item.id === wallId);
  if (!storedWall) return null;
  const roomId = options.roomId ?? roomIdForWall(project, storedWall);
  const collected = collectWallOccupancySpans(project, wallId, roomId);
  if (!collected) return null;
  const { lengthMm, occupied, openingCount } = collected;

  // runId may be used by callers for labeling/candidate context but must NOT
  // exclude other runs from occupied / remaining / free segments (P2-1).
  void options.runId;

  const merged = mergeOccupied(occupied);
  const freeSegments = freeSegmentsAlongWall(lengthMm, merged);
  const remainingMm = Math.round(freeSegments.reduce((sum, segment) => sum + segment.lengthMm, 0));
  const suggestedFillerWidthsMm = freeSegments
    .map((segment) => fillerWidthForGap(segment.lengthMm))
    .filter((width): width is number => width !== null)
    .map((width) => Math.round(width));

  const candidateWidthMm = options.candidateWidthMm;
  let candidateFits: boolean | null = null;
  let bestFreeSegment: FreeWallSegment | null = null;
  if (typeof candidateWidthMm === "number" && candidateWidthMm > 0) {
    const fitting = freeSegments
      .filter((segment) => segment.lengthMm + 0.5 >= candidateWidthMm)
      .sort((a, b) => a.lengthMm - b.lengthMm);
    bestFreeSegment = fitting[0] ?? null;
    candidateFits = Boolean(bestFreeSegment);
  }

  return {
    wallId,
    wallLengthMm: lengthMm,
    occupied: merged.map((span) => ({
      ...span,
      startMm: Math.round(span.startMm),
      endMm: Math.round(span.endMm),
    })),
    freeSegments,
    remainingMm,
    openingCount,
    suggestedFillerWidthsMm,
    candidateFits,
    bestFreeSegment,
  };
}

export function formatRemainingWallLabel(preview: CabinetRunPlacementPreview): string {
  const openingsNote = preview.openingCount
    ? ` · ${preview.openingCount} opening${preview.openingCount === 1 ? "" : "s"}`
    : "";
  return `Remaining on wall: ${preview.remainingMm} mm${openingsNote}`;
}

export { FILLER_MIN_MM, FILLER_MAX_MM };
