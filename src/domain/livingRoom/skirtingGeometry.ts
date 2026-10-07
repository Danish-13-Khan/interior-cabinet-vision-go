import {
  clampOpeningVertical,
  orientWallForRoom,
  type InteriorObjectEntity,
  type InteriorProject,
  type InteriorRoomEntity,
  type OpeningEntity,
  type WallEntity,
} from "../interiorProject";
import { isWallPanelObject, readPanelAttachment } from "./panelAttachment";
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

export type SkirtingCut = { start: number; end: number };

/**
 * Wall panels and feature walls that stand on the floor take the skirting's place:
 * real joinery stops the skirting at the panel, and a panel whose depth equals the
 * skirting depth would otherwise share its face with it and flicker (the "speckled
 * strip" under the 2 BHK console). Cuts are along the raw wall from `wall.start`.
 */
export function floorPanelCuts(wall: WallEntity, objects: readonly InteriorObjectEntity[]): SkirtingCut[] {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.hypot(dx, dz);
  if (length < 1) return [];
  return objects
    .filter((object) => {
      if (!isWallPanelObject(object) || object.extensions?.layerVisible === false) return false;
      const attachment = readPanelAttachment(object);
      if (!attachment || attachment.wallId !== wall.id || !attachment.visible) return false;
      return Math.min(object.position.y, attachment.floorOffsetMm) < SKIRTING_HEIGHT_MM;
    })
    .map((object) => {
      const along = ((object.position.x - wall.start.x) * dx + (object.position.z - wall.start.z) * dz) / length;
      const half = object.dimensions.widthMm / 2;
      return {
        start: Math.max(0, Math.min(length, along - half)),
        end: Math.max(0, Math.min(length, along + half)),
      };
    })
    .filter((cut) => cut.end - cut.start > 1);
}

function mergeCuts(cuts: SkirtingCut[]): SkirtingCut[] {
  const merged: SkirtingCut[] = [];
  for (const cut of [...cuts].sort((a, b) => a.start - b.start)) {
    const last = merged[merged.length - 1];
    if (last && cut.start <= last.end + 0.5) last.end = Math.max(last.end, cut.end);
    else merged.push({ ...cut });
  }
  return merged;
}

export function skirtingKeepSpans(
  wallLengthMm: number,
  openings: OpeningEntity[],
  extraCuts: SkirtingCut[] = [],
) {
  const cuts = mergeCuts([...floorOpeningCuts(wallLengthMm, openings), ...extraCuts]);
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
  objects: readonly InteriorObjectEntity[] = [],
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
  return skirtingKeepSpans(length, hosted, floorPanelCuts(wall, objects)).map((span, index) => {
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
