import {
  clampOpeningVertical,
  orientWallForRoom,
  type InteriorProject,
  type InteriorRoomEntity,
  type OpeningEntity,
  type WallEntity,
} from "../interiorProject";
import { wallPoint } from "./sceneCompilerOpenings";
import { boxPrimitive } from "./scenePrimitives";
import type { CompiledBoxPrimitive } from "./sceneTypes";

export const SKIRTING_HEIGHT_MM = 90;
export const SKIRTING_DEPTH_MM = 18;
const CORNER_INSET_MM = 10;

export function floorOpeningCuts(wallLengthMm: number, openings: OpeningEntity[]) {
  const cuts = openings
    .filter((opening) => opening.extensions?.layerVisible !== false
      && opening.heightMm > 0 && opening.sillHeightMm < SKIRTING_HEIGHT_MM)
    .map((opening) => ({
      start: Math.max(0, Math.min(wallLengthMm, opening.offsetMm)),
      end: Math.max(0, Math.min(wallLengthMm, opening.offsetMm + opening.widthMm)),
    }))
    .filter((cut) => cut.end - cut.start > 1)
    .sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [];
  for (const cut of cuts) {
    const last = merged[merged.length - 1];
    if (last && cut.start <= last.end + 0.5) last.end = Math.max(last.end, cut.end);
    else merged.push({ ...cut });
  }
  return merged;
}

export function skirtingKeepSpans(wallLengthMm: number, openings: OpeningEntity[]) {
  const cuts = floorOpeningCuts(wallLengthMm, openings);
  const raw: { from: number; to: number }[] = [];
  let cursor = 0;
  for (const cut of cuts) {
    if (cut.start > cursor) raw.push({ from: cursor, to: cut.start });
    cursor = Math.max(cursor, cut.end);
  }
  if (cursor < wallLengthMm) raw.push({ from: cursor, to: wallLengthMm });
  return raw
    .map((span) => ({
      from: span.from <= 0 ? span.from + CORNER_INSET_MM : span.from,
      to: span.to >= wallLengthMm ? span.to - CORNER_INSET_MM : span.to,
    }))
    .filter((span) => span.to - span.from > 1);
}

export function compileWallSkirtingPrimitives(
  project: InteriorProject,
  room: InteriorRoomEntity,
  wall: WallEntity,
  openings: OpeningEntity[],
  materialId: string,
): CompiledBoxPrimitive[] {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
  const oriented = orientWallForRoom(project, room.id, wall);
  const dx = oriented.end.x - oriented.start.x;
  const dz = oriented.end.z - oriented.start.z;
  const run = Math.max(1, Math.hypot(dx, dz));
  const inset = wall.thicknessMm / 2 + SKIRTING_DEPTH_MM / 2;
  const nx = -dz / run * inset;
  const nz = dx / run * inset;
  const rotationY = -Math.atan2(
    wall.end.z - wall.start.z,
    wall.end.x - wall.start.x,
  ) * 180 / Math.PI;
  const hosted = openings.filter((opening) => opening.wallId === wall.id)
    .map((opening) => ({ ...opening, ...clampOpeningVertical(opening, wall.heightMm) }));
  return skirtingKeepSpans(length, hosted).map((span, index) => {
    const mid = wallPoint(wall, (span.from + span.to) / 2);
    return boxPrimitive(`skirting:${wall.id}:${index}`, {
      width: span.to - span.from,
      height: SKIRTING_HEIGHT_MM,
      depth: SKIRTING_DEPTH_MM,
    }, {
      x: mid.x + nx, y: SKIRTING_HEIGHT_MM / 2, z: mid.z + nz,
    }, materialId, { rotationDegrees: { x: 0, y: rotationY, z: 0 } });
  });
}
