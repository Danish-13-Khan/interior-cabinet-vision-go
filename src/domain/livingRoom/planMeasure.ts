import type { InteriorProject, Point2Mm } from "../interiorProject";
import { selectOpeningsForRoom, selectWallsForRoom } from "../interiorProject";
import { getObjectPlanBounds } from "./planGeometry";

export type MeasureSnapKind =
  | "grid"
  | "wall-end"
  | "corner"
  | "opening-edge"
  | "cabinet-edge"
  | "cabinet-centre";

export type MeasureSnapPoint = Point2Mm & {
  kind: MeasureSnapKind;
  label: string;
};

export type MeasureSegment = {
  a: Point2Mm;
  b: Point2Mm;
  lengthMm: number;
};

export function measureLengthMm(a: Point2Mm, b: Point2Mm): number {
  return Math.hypot(b.x - a.x, b.z - a.z);
}

export function formatMeasureLengthMm(lengthMm: number): string {
  const rounded = Math.round(lengthMm);
  return `${rounded.toLocaleString("en-US")} mm`;
}

export function appendMeasurePoint(points: readonly Point2Mm[], next: Point2Mm): Point2Mm[] {
  if (points.length === 0) return [next];
  const last = points[points.length - 1]!;
  if (Math.hypot(next.x - last.x, next.z - last.z) < 0.5) return [...points];
  return [...points, next];
}

export function measureSegmentsFromPoints(points: readonly Point2Mm[]): MeasureSegment[] {
  const segments: MeasureSegment[] = [];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1]!;
    const b = points[i]!;
    segments.push({ a, b, lengthMm: measureLengthMm(a, b) });
  }
  return segments;
}

/**
 * Semantic snap candidates only — never materialize a full grid lattice
 * (a 30m envelope at 25mm would be millions of points).
 */
export function collectMeasureSnapPoints(
  project: InteriorProject,
  _gridSizeMm = 50,
  roomId = project.activeRoomId,
): MeasureSnapPoint[] {
  const points: MeasureSnapPoint[] = [];
  const seen = new Set<string>();

  function push(point: Point2Mm, kind: MeasureSnapKind, label: string) {
    const key = `${Math.round(point.x)}:${Math.round(point.z)}:${kind}`;
    if (seen.has(key)) return;
    seen.add(key);
    points.push({ x: point.x, z: point.z, kind, label });
  }

  const walls = selectWallsForRoom(project, roomId);
  for (const wall of walls) {
    if (!wall.visible) continue;
    push(wall.start, "wall-end", "Wall end");
    push(wall.end, "wall-end", "Wall end");
    push(wall.start, "corner", "Corner");
    push(wall.end, "corner", "Corner");
  }

  for (const opening of selectOpeningsForRoom(project, roomId)) {
    const wall = project.walls.find((item) => item.id === opening.wallId);
    if (!wall) continue;
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.z - wall.start.z;
    const length = Math.hypot(dx, dz) || 1;
    const ux = dx / length;
    const uz = dz / length;
    const startOffset = opening.offsetMm;
    const endOffset = opening.offsetMm + opening.widthMm;
    push(
      { x: wall.start.x + ux * startOffset, z: wall.start.z + uz * startOffset },
      "opening-edge",
      `${opening.kind} edge`,
    );
    push(
      { x: wall.start.x + ux * endOffset, z: wall.start.z + uz * endOffset },
      "opening-edge",
      `${opening.kind} edge`,
    );
  }

  for (const object of project.objects) {
    if (object.roomId !== roomId) continue;
    const bounds = getObjectPlanBounds(object);
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cz = (bounds.minZ + bounds.maxZ) / 2;
    push({ x: bounds.minX, z: bounds.minZ }, "cabinet-edge", "Cabinet edge");
    push({ x: bounds.maxX, z: bounds.minZ }, "cabinet-edge", "Cabinet edge");
    push({ x: bounds.minX, z: bounds.maxZ }, "cabinet-edge", "Cabinet edge");
    push({ x: bounds.maxX, z: bounds.maxZ }, "cabinet-edge", "Cabinet edge");
    push({ x: cx, z: cz }, "cabinet-centre", "Cabinet centre");
    push({ x: cx, z: bounds.minZ }, "cabinet-edge", "Cabinet edge");
    push({ x: cx, z: bounds.maxZ }, "cabinet-edge", "Cabinet edge");
    push({ x: bounds.minX, z: cz }, "cabinet-edge", "Cabinet edge");
    push({ x: bounds.maxX, z: cz }, "cabinet-edge", "Cabinet edge");
  }

  return points;
}

const SNAP_PRIORITY: Record<MeasureSnapKind, number> = {
  "wall-end": 0,
  corner: 1,
  "opening-edge": 2,
  "cabinet-edge": 3,
  "cabinet-centre": 4,
  grid: 5,
};

/** Snap to semantic candidates; round to grid on demand if nothing nearer. */
export function snapMeasurePoint(
  desired: Point2Mm,
  candidates: readonly MeasureSnapPoint[],
  thresholdMm: number,
  gridSizeMm = 50,
): MeasureSnapPoint {
  let best: MeasureSnapPoint | null = null;
  let bestDist = thresholdMm;
  for (const candidate of candidates) {
    if (candidate.kind === "grid") continue;
    const dist = Math.hypot(candidate.x - desired.x, candidate.z - desired.z);
    if (dist > bestDist) continue;
    if (
      !best
      || dist < bestDist - 0.01
      || (Math.abs(dist - bestDist) <= 0.01 && SNAP_PRIORITY[candidate.kind] < SNAP_PRIORITY[best.kind])
    ) {
      best = candidate;
      bestDist = dist;
    }
  }
  if (best) return best;

  const grid = Math.max(1, gridSizeMm);
  const gx = Math.round(desired.x / grid) * grid;
  const gz = Math.round(desired.z / grid) * grid;
  const gridDist = Math.hypot(gx - desired.x, gz - desired.z);
  if (gridDist <= thresholdMm) {
    return { x: gx, z: gz, kind: "grid", label: "Grid" };
  }
  return { ...desired, kind: "grid", label: "Free" };
}
