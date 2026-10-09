import { polygonBounds, polygonSelfIntersects, polygonSignedArea } from "./roomGeometry";
import type { InteriorProject, InteriorRoomEntity, Point2Mm } from "./types";

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

export function writeCeilingCutouts(project: InteriorProject, roomId: string, cutouts: CeilingCutout[]): InteriorProject {
  return {
    ...project,
    rooms: project.rooms.map((room) => (room.id === roomId
      ? { ...room, extensions: { ...room.extensions, ceilingCutouts: cutouts } }
      : room)),
  };
}

export function ceilingCutoutSizeMm(cutout: Pick<CeilingCutout, "polygon">) {
  const bounds = polygonBounds(cutout.polygon);
  return { widthMm: bounds.widthMm, depthMm: bounds.depthMm, centerX: (bounds.minX + bounds.maxX) / 2, centerZ: (bounds.minZ + bounds.maxZ) / 2 };
}

export function isCeilingCutoutPolygonValid(points: Point2Mm[]) {
  return points.length >= 3
    && Math.abs(polygonSignedArea(points)) >= MIN_CEILING_CUTOUT_AREA_MM2
    && !polygonSelfIntersects(points);
}
