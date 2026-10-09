import { normalizeRoomPolygon } from "./roomDrawing";
import {
  pointInPolygon, pointInRoomPolygon, polygonBounds, polygonSelfIntersects, polygonSignedArea,
  polygonsIntersect, roomPlanPolygon,
} from "./roomGeometry";
import type { InteriorProject, InteriorRoomEntity, InteriorValidationIssue, Point2Mm } from "./types";

export type CeilingCutoutPurpose = "light" | "service" | "feature";

/** A hole in the room's ceiling slab, stored on `room.extensions.ceilingCutouts` (roadmap §4.1). */
export type CeilingCutout = {
  id: string;
  /** Plan mm, world frame, ≥ 3 points. */
  polygon: Point2Mm[];
  purpose?: CeilingCutoutPurpose;
  label?: string;
};

/** Smallest cutout that still reads in plan and 3D: 100 × 100 mm. */
export const MIN_CEILING_CUTOUT_AREA_MM2 = 10_000;
const PURPOSES: ReadonlySet<string> = new Set(["light", "service", "feature"]);

function isPoint(value: unknown): value is Point2Mm {
  return typeof value === "object" && value !== null
    && typeof (value as Point2Mm).x === "number" && typeof (value as Point2Mm).z === "number";
}

/** Reads the stored list; malformed entries are skipped, never thrown. */
export function readCeilingCutouts(
  room: Pick<InteriorRoomEntity, "extensions"> | null | undefined,
): CeilingCutout[] {
  const raw = room?.extensions?.ceilingCutouts;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item): CeilingCutout[] => {
    if (typeof item !== "object" || item === null) return [];
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || !Array.isArray(record.polygon)) return [];
    const polygon = record.polygon.filter(isPoint).map((point) => ({ x: point.x, z: point.z }));
    if (polygon.length < 3) return [];
    return [{
      id: record.id,
      polygon,
      ...(typeof record.purpose === "string" && PURPOSES.has(record.purpose)
        ? { purpose: record.purpose as CeilingCutoutPurpose } : {}),
      ...(typeof record.label === "string" ? { label: record.label } : {}),
    }];
  });
}

function writeCeilingCutouts(project: InteriorProject, roomId: string, cutouts: CeilingCutout[]): InteriorProject {
  return {
    ...project,
    rooms: project.rooms.map((room) => (room.id === roomId
      ? { ...room, extensions: { ...room.extensions, ceilingCutouts: cutouts } }
      : room)),
  };
}

function polygonsOverlap(a: Point2Mm[], b: Point2Mm[]) {
  return polygonsIntersect(a, b) || pointInPolygon(a[0]!, b) || pointInPolygon(b[0]!, a);
}

export function isCeilingCutoutPolygonValid(points: Point2Mm[]) {
  return points.length >= 3
    && Math.abs(polygonSignedArea(points)) >= MIN_CEILING_CUTOUT_AREA_MM2
    && !polygonSelfIntersects(points);
}

/** Inside the room face (vertices and edge midpoints), clear of hole loops and of every other cutout. */
export function ceilingCutoutFitsRoom(
  project: InteriorProject,
  roomId: string,
  points: Point2Mm[],
  ignoreCutoutId?: string,
) {
  const room = project.rooms.find((item) => item.id === roomId);
  const face = roomPlanPolygon(project, roomId);
  if (!room || !face) return false;
  const samples = points.flatMap((point, index) => {
    const next = points[(index + 1) % points.length]!;
    return [point, { x: (point.x + next.x) / 2, z: (point.z + next.z) / 2 }];
  });
  if (!samples.every((point) => pointInRoomPolygon(point, face))) return false;
  if (face.holes.some((hole) => polygonsOverlap(hole, points))) return false;
  return readCeilingCutouts(room)
    .every((other) => other.id === ignoreCutoutId || !polygonsOverlap(other.polygon, points));
}

function nextCutoutId(existing: readonly CeilingCutout[]) {
  const used = new Set(existing.map((cutout) => cutout.id));
  let index = 1;
  while (used.has(`cutout-${index}`)) index += 1;
  return `cutout-${index}`;
}

/** Adds a cutout to the active (or given) room; returns the same project when it would not fit. */
export function addCeilingCutout(
  project: InteriorProject,
  points: Point2Mm[],
  options?: { roomId?: string; purpose?: CeilingCutoutPurpose; label?: string },
): InteriorProject {
  const roomId = options?.roomId ?? project.activeRoomId;
  const room = project.rooms.find((item) => item.id === roomId);
  if (!room) return project;
  const polygon = normalizeRoomPolygon(points);
  if (!polygon || !isCeilingCutoutPolygonValid(polygon)) return project;
  if (!ceilingCutoutFitsRoom(project, roomId, polygon)) return project;
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

export function ceilingCutoutSizeMm(cutout: Pick<CeilingCutout, "polygon">) {
  const bounds = polygonBounds(cutout.polygon);
  return { widthMm: bounds.widthMm, depthMm: bounds.depthMm, centerX: (bounds.minX + bounds.maxX) / 2, centerZ: (bounds.minZ + bounds.maxZ) / 2 };
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
      if (!ceilingCutoutFitsRoom(project, room.id, cutout.polygon, cutout.id)) {
        issues.push({ severity: "error", code: "ceiling-cutout-outside-room", path,
          message: "Ceiling cutouts must stay inside the room and clear of other cutouts.", repaired: false });
      }
    }
  }
}
