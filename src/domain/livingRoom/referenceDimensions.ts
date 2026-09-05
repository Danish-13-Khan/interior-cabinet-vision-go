import type { InteriorProject, Point2Mm } from "../interiorProject";
import { selectOpeningsForRoom, selectWallsForRoom } from "../interiorProject";
import { getObjectPlanBounds } from "./planGeometry";

export type PlanDimensionRole = "driving" | "reference";

export type ReferenceDimension = {
  id: string;
  role: PlanDimensionRole;
  kind: "cabinet-to-opening" | "cabinet-to-wall";
  label: string;
  lengthMm: number;
  a: Point2Mm;
  b: Point2Mm;
  objectId: string;
  relatedId: string;
};

function distPointToSegment(point: Point2Mm, a: Point2Mm, b: Point2Mm): { distance: number; foot: Point2Mm } {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len2 = dx * dx + dz * dz;
  if (len2 < 1e-6) {
    return { distance: Math.hypot(point.x - a.x, point.z - a.z), foot: a };
  }
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.z - a.z) * dz) / len2));
  const foot = { x: a.x + t * dx, z: a.z + t * dz };
  return { distance: Math.hypot(point.x - foot.x, point.z - foot.z), foot };
}

function objectEdgeMidpoints(object: InteriorProject["objects"][number]): Point2Mm[] {
  const b = getObjectPlanBounds(object);
  const cx = (b.minX + b.maxX) / 2;
  const cz = (b.minZ + b.maxZ) / 2;
  return [
    { x: cx, z: b.minZ },
    { x: cx, z: b.maxZ },
    { x: b.minX, z: cz },
    { x: b.maxX, z: cz },
  ];
}

function openingEdgePoints(project: InteriorProject, openingId: string): Point2Mm[] {
  const opening = project.openings.find((item) => item.id === openingId);
  const wall = opening ? project.walls.find((item) => item.id === opening.wallId) : null;
  if (!opening || !wall) return [];
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.hypot(dx, dz) || 1;
  const ux = dx / length;
  const uz = dz / length;
  return [
    { x: wall.start.x + ux * opening.offsetMm, z: wall.start.z + uz * opening.offsetMm },
    {
      x: wall.start.x + ux * (opening.offsetMm + opening.widthMm),
      z: wall.start.z + uz * (opening.offsetMm + opening.widthMm),
    },
  ];
}

/** Reference (read-only) dims that update when geometry moves — not driving edits. */
export function collectReferenceDimensions(
  project: InteriorProject,
  roomId = project.activeRoomId,
): ReferenceDimension[] {
  const dims: ReferenceDimension[] = [];
  const cabinets = project.objects.filter(
    (object) => object.roomId === roomId && (object.kind === "cabinet" || object.kind === "furniture"),
  );
  const openings = selectOpeningsForRoom(project, roomId);
  const walls = selectWallsForRoom(project, roomId).filter((wall) => wall.visible);

  for (const cabinet of cabinets) {
    const edges = objectEdgeMidpoints(cabinet);
    let bestOpening: ReferenceDimension | null = null;
    for (const opening of openings) {
      const openPts = openingEdgePoints(project, opening.id);
      for (const edge of edges) {
        for (const openPt of openPts) {
          const lengthMm = Math.hypot(edge.x - openPt.x, edge.z - openPt.z);
          if (!bestOpening || lengthMm < bestOpening.lengthMm) {
            bestOpening = {
              id: `ref:${cabinet.id}:opening:${opening.id}`,
              role: "reference",
              kind: "cabinet-to-opening",
              label: "Cabinet → opening",
              lengthMm,
              a: edge,
              b: openPt,
              objectId: cabinet.id,
              relatedId: opening.id,
            };
          }
        }
      }
    }
    if (bestOpening && bestOpening.lengthMm < 8000) dims.push(bestOpening);

    let bestWall: ReferenceDimension | null = null;
    for (const wall of walls) {
      for (const edge of edges) {
        const hit = distPointToSegment(edge, wall.start, wall.end);
        if (!bestWall || hit.distance < bestWall.lengthMm) {
          bestWall = {
            id: `ref:${cabinet.id}:wall:${wall.id}`,
            role: "reference",
            kind: "cabinet-to-wall",
            label: "Cabinet → wall",
            lengthMm: hit.distance,
            a: edge,
            b: hit.foot,
            objectId: cabinet.id,
            relatedId: wall.id,
          };
        }
      }
    }
    if (bestWall && bestWall.lengthMm < 4000) dims.push(bestWall);
  }

  return dims;
}
