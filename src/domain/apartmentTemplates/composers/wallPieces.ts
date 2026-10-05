import {
  orientWallForRoom,
  selectRoomOpenings,
  type InteriorObjectEntity,
  type InteriorProject,
  type WallEntity,
} from "../../interiorProject";
import {
  freeSegmentsAlongWall,
  openingSpanOnOrientedWall,
  type AlongWallSpan,
} from "../../livingRoom/cabinetRunPlacementPreview";
import { isWallPanelObject } from "../../livingRoom/panelAttachment";
import { wallLength } from "../../livingRoom/wallSegmentPlacement";
import { wallsOnSide } from "../wallSide";
import type { WallSide } from "../types";

export type FreeWallPiece = {
  /** Fixed-end wall (lower x / lower z start) from `wallsOnSide`. */
  wall: WallEntity;
  startAlongMm: number;
  lengthMm: number;
};

export type FreePieceOptions = {
  /** Treat wall-hosted objects (not decor panels) as occupied. Default true. */
  avoidObjects?: boolean;
};

/** Wall id an object is hosted on (cabinets, TV units and decor panels share the key). */
export function hostWallId(object: InteriorObjectEntity): string | undefined {
  return (object.extensions?.wallAttachment as { wallId?: string } | undefined)?.wallId;
}

/** Along-wall span of a wall-hosted object, in the given wall's start→end coordinates. */
export function objectSpanOnWall(object: InteriorObjectEntity, wall: WallEntity): { startMm: number; endMm: number } {
  const length = wallLength(wall) || 1;
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  const center = (object.position.x - wall.start.x) * ux + (object.position.z - wall.start.z) * uz;
  const half = object.dimensions.widthMm / 2;
  return { startMm: center - half, endMm: center + half };
}

/** Door, window and arch spans (and optionally hosted objects) on one fixed-end wall. */
function occupiedOnWall(
  project: InteriorProject,
  roomId: string,
  oriented: WallEntity,
  options: FreePieceOptions,
): AlongWallSpan[] {
  const stored = project.walls.find((wall) => wall.id === oriented.id);
  if (!stored) return [];
  const length = wallLength(oriented);
  const spans: AlongWallSpan[] = selectRoomOpenings(project, roomId)
    .filter((opening) => opening.wallId === oriented.id)
    .map((opening) => openingSpanOnOrientedWall(opening, stored, oriented, length));
  if (options.avoidObjects !== false) {
    for (const object of project.objects) {
      if (object.roomId !== roomId || hostWallId(object) !== oriented.id) continue;
      if (isWallPanelObject(object)) continue;
      const span = objectSpanOnWall(object, oriented);
      spans.push({ ...span, kind: "cabinet", id: object.id });
    }
  }
  return spans.sort((a, b) => a.startMm - b.startMm || a.endMm - b.endMm);
}

/** Every free piece on a side at least `neededWidthMm` long, longest first. */
export function freePiecesOnSide(
  project: InteriorProject,
  roomId: string,
  side: WallSide,
  neededWidthMm: number,
  options: FreePieceOptions = {},
): FreeWallPiece[] {
  const pieces: FreeWallPiece[] = [];
  for (const oriented of wallsOnSide(project, roomId, side)) {
    const length = wallLength(oriented);
    for (const segment of freeSegmentsAlongWall(length, occupiedOnWall(project, roomId, oriented, options))) {
      if (segment.lengthMm + 0.5 < neededWidthMm) continue;
      pieces.push({ wall: oriented, startAlongMm: segment.startMm, lengthMm: segment.lengthMm });
    }
  }
  return pieces.sort((a, b) => b.lengthMm - a.lengthMm);
}

/** Longest free span on a side; skips doors, windows, arches and hosted objects. Offsets from fixed end. */
export function longestFreePieceOnSide(
  project: InteriorProject,
  roomId: string,
  side: WallSide,
  neededWidthMm: number,
  options: FreePieceOptions = {},
): FreeWallPiece | null {
  return freePiecesOnSide(project, roomId, side, neededWidthMm, options)[0] ?? null;
}

/** Convert an along-mm measured on a fixed-end wall into orientWallForRoom space. */
export function fixedAlongToRoomAlongMm(
  project: InteriorProject,
  roomId: string,
  fixedWall: WallEntity,
  alongMm: number,
  spanMm = 0,
): number {
  const stored = project.walls.find((wall) => wall.id === fixedWall.id) ?? fixedWall;
  const roomWall = orientWallForRoom(project, roomId, stored);
  const sameStart =
    Math.abs(roomWall.start.x - fixedWall.start.x) < 0.5
    && Math.abs(roomWall.start.z - fixedWall.start.z) < 0.5;
  if (sameStart) return alongMm;
  return wallLength(roomWall) - alongMm - spanMm;
}

/** World point at `alongMm` from a wall's start. */
export function pointAlongWall(wall: WallEntity, alongMm: number): { x: number; z: number } {
  const length = wallLength(wall) || 1;
  return {
    x: wall.start.x + ((wall.end.x - wall.start.x) / length) * alongMm,
    z: wall.start.z + ((wall.end.z - wall.start.z) / length) * alongMm,
  };
}
