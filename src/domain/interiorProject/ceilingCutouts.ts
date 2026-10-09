import { normalizeRoomPolygon } from "./roomDrawing";
import { pointInPolygon, pointInRoomPolygon, polygonsIntersect, roomPlanPolygon } from "./roomGeometry";
import type { InteriorProject, InteriorRoomEntity, InteriorValidationIssue, Point2Mm } from "./types";
import { outerLoopWallsRaised } from "./wallRaise";
import {
  isCeilingCutoutPolygonValid, readCeilingCutouts, writeCeilingCutouts,
  type CeilingCutout, type CeilingCutoutPurpose,
} from "./ceilingCutoutStore";

export {
  MIN_CEILING_CUTOUT_AREA_MM2, ceilingCutoutSizeMm, isCeilingCutoutPolygonValid, readCeilingCutouts,
  type CeilingCutout, type CeilingCutoutPurpose,
} from "./ceilingCutoutStore";

function polygonsOverlap(a: Point2Mm[], b: Point2Mm[]) {
  return polygonsIntersect(a, b) || pointInPolygon(a[0]!, b) || pointInPolygon(b[0]!, a);
}

export type CeilingCutoutFitProblem = "outside" | "overlap";

/**
 * Why a polygon cannot be a cutout of this room, or null when it fits: every
 * vertex and edge midpoint inside the face, no edge crossing the outline (an
 * L-room's inner corner can sit between two sampled points), clear of hole
 * loops and of every other cutout.
 */
export function ceilingCutoutFitProblem(
  project: InteriorProject,
  roomId: string,
  points: Point2Mm[],
  ignoreCutoutId?: string,
): CeilingCutoutFitProblem | null {
  const room = project.rooms.find((item) => item.id === roomId);
  const face = roomPlanPolygon(project, roomId);
  if (!room || !face) return "outside";
  const samples = points.flatMap((point, index) => {
    const next = points[(index + 1) % points.length]!;
    return [point, { x: (point.x + next.x) / 2, z: (point.z + next.z) / 2 }];
  });
  if (!samples.every((point) => pointInRoomPolygon(point, face))) return "outside";
  if (polygonsIntersect(face.outer, points)) return "outside";
  if (face.holes.some((hole) => polygonsOverlap(hole, points))) return "outside";
  const clear = readCeilingCutouts(room)
    .every((other) => other.id === ignoreCutoutId || !polygonsOverlap(other.polygon, points));
  return clear ? null : "overlap";
}

export function ceilingCutoutFitsRoom(
  project: InteriorProject,
  roomId: string,
  points: Point2Mm[],
  ignoreCutoutId?: string,
) {
  return ceilingCutoutFitProblem(project, roomId, points, ignoreCutoutId) === null;
}

/** Stored cutouts that still fit the room; the slab, exports and the estimate use only these. */
export function compiledCeilingCutouts(project: InteriorProject, room: InteriorRoomEntity): CeilingCutout[] {
  return readCeilingCutouts(room)
    .filter((cutout) => ceilingCutoutFitsRoom(project, room.id, cutout.polygon, cutout.id));
}

/** The reason a drawn polygon is refused as a cutout, in the user's words, or null when it can be added. */
export function whyCeilingCutoutRefused(
  project: InteriorProject,
  points: Point2Mm[],
  roomId: string = project.activeRoomId,
): string | null {
  const room = project.rooms.find((item) => item.id === roomId);
  if (!room) return "Draw a room before adding ceiling cutouts.";
  if (!outerLoopWallsRaised(project, room)) return "Raise the room walls to 3D before adding ceiling cutouts.";
  const polygon = normalizeRoomPolygon(points);
  if (!polygon || !isCeilingCutoutPolygonValid(polygon)) {
    return "Ceiling cutouts need a polygon of at least 100 × 100 mm that does not cross itself.";
  }
  const problem = ceilingCutoutFitProblem(project, roomId, polygon);
  if (problem === "outside") return "Ceiling cutouts must stay inside the room.";
  if (problem === "overlap") return "Ceiling cutouts must not overlap another cutout.";
  return null;
}

function nextCutoutId(existing: readonly CeilingCutout[]) {
  const used = new Set(existing.map((cutout) => cutout.id));
  let index = 1;
  while (used.has(`cutout-${index}`)) index += 1;
  return `cutout-${index}`;
}

/** Adds a cutout to the active (or given) room; returns the same project when `whyCeilingCutoutRefused` has a reason. */
export function addCeilingCutout(
  project: InteriorProject,
  points: Point2Mm[],
  options?: { roomId?: string; purpose?: CeilingCutoutPurpose; label?: string },
): InteriorProject {
  const roomId = options?.roomId ?? project.activeRoomId;
  const room = project.rooms.find((item) => item.id === roomId);
  const polygon = normalizeRoomPolygon(points);
  if (!room || !polygon || whyCeilingCutoutRefused(project, points, roomId)) return project;
  const existing = readCeilingCutouts(room);
  const cutout: CeilingCutout = {
    id: nextCutoutId(existing),
    polygon,
    ...(options?.purpose ? { purpose: options.purpose } : {}),
    ...(options?.label ? { label: options.label } : {}),
  };
  return writeCeilingCutouts(project, roomId, [...existing, cutout]);
}

export function deleteCeilingCutout(project: InteriorProject, roomId: string, cutoutId: string): InteriorProject {
  const room = project.rooms.find((item) => item.id === roomId);
  const existing = readCeilingCutouts(room);
  if (!existing.some((cutout) => cutout.id === cutoutId)) return project;
  return writeCeilingCutouts(project, roomId, existing.filter((cutout) => cutout.id !== cutoutId));
}

/** Translates a cutout; refused when the moved polygon leaves the room or lands on another cutout. */
export function moveCeilingCutout(
  project: InteriorProject,
  roomId: string,
  cutoutId: string,
  delta: Point2Mm,
): InteriorProject {
  const room = project.rooms.find((item) => item.id === roomId);
  const existing = readCeilingCutouts(room);
  const target = existing.find((cutout) => cutout.id === cutoutId);
  if (!target) return project;
  const polygon = target.polygon.map((point) => ({ x: point.x + delta.x, z: point.z + delta.z }));
  if (!ceilingCutoutFitsRoom(project, roomId, polygon, cutoutId)) return project;
  return writeCeilingCutouts(project, roomId, existing.map((cutout) => (
    cutout.id === cutoutId ? { ...cutout, polygon } : cutout)));
}

export function validateCeilingCutouts(project: InteriorProject, issues: InteriorValidationIssue[]) {
  for (const room of project.rooms) {
    for (const cutout of readCeilingCutouts(room)) {
      const path = `rooms.${room.id}.extensions.ceilingCutouts.${cutout.id}`;
      if (!isCeilingCutoutPolygonValid(cutout.polygon)) {
        issues.push({ severity: "error", code: "ceiling-cutout-invalid", path,
          message: "Ceiling cutouts need a valid non-crossing polygon of at least 100 × 100 mm.", repaired: false });
        continue;
      }
      const problem = ceilingCutoutFitProblem(project, room.id, cutout.polygon, cutout.id);
      if (problem === "outside") {
        issues.push({ severity: "error", code: "ceiling-cutout-outside-room", path,
          message: "Ceiling cutout sits outside the room; it is left out of the ceiling until moved or deleted.", repaired: false });
      } else if (problem === "overlap") {
        issues.push({ severity: "error", code: "ceiling-cutout-overlap", path,
          message: "Ceiling cutout overlaps another cutout; it is left out of the ceiling until moved or deleted.", repaired: false });
      }
    }
  }
}
