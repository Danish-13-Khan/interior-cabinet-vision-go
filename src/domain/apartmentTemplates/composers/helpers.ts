import {
  orientWallForRoom,
  selectRoomOpenings,
  type InteriorObjectEntity,
  type InteriorProject,
  type WallEntity,
} from "../../interiorProject";
import { createLivingRoomObject, type LivingRoomCatalogId } from "../../livingRoom/catalog";
import type { LivingRoomIdFactory } from "../../livingRoom/ids";
import {
  freeSegmentsAlongWall,
  openingSpanOnOrientedWall,
} from "../../livingRoom/cabinetRunPlacementPreview";
import { attached, placementAt, wallLength } from "../../livingRoom/wallSegmentPlacement";
import { wallsOnSide } from "../wallSide";
import type { WallSide } from "../types";

export function withActiveRoom(
  project: InteriorProject,
  roomId: string,
): InteriorProject {
  return project.activeRoomId === roomId ? project : { ...project, activeRoomId: roomId };
}

export type FreeWallPiece = {
  wall: WallEntity;
  startAlongMm: number;
  lengthMm: number;
};

/** Longest free span on a side (skips door/window spans); offsets from fixed end. */
export function longestFreePieceOnSide(
  project: InteriorProject,
  roomId: string,
  side: WallSide,
  neededWidthMm: number,
): FreeWallPiece | null {
  let best: FreeWallPiece | null = null;
  for (const oriented of wallsOnSide(project, roomId, side)) {
    const stored = project.walls.find((wall) => wall.id === oriented.id);
    if (!stored) continue;
    const length = wallLength(oriented);
    const occupied = selectRoomOpenings(project, roomId)
      .filter((opening) =>
        opening.wallId === oriented.id
        && (opening.kind === "door" || opening.kind === "window"))
      .map((opening) => openingSpanOnOrientedWall(opening, stored, oriented, length));
    const free = freeSegmentsAlongWall(length, occupied)
      .filter((segment) => segment.lengthMm + 0.5 >= neededWidthMm)
      .sort((a, b) => b.lengthMm - a.lengthMm);
    const segment = free[0];
    if (!segment) continue;
    if (!best || segment.lengthMm > best.lengthMm) {
      best = { wall: oriented, startAlongMm: segment.startMm, lengthMm: segment.lengthMm };
    }
  }
  return best;
}

export function placeCabinetOnWall(
  project: InteriorProject,
  object: InteriorObjectEntity,
  wall: WallEntity,
  alongMm: number,
): InteriorProject {
  const stored = project.walls.find((item) => item.id === wall.id) ?? wall;
  const roomWall = orientWallForRoom(project, object.roomId, stored);
  const width = object.dimensions.widthMm;
  const roomAlong = fixedAlongToRoomAlongMm(
    project, object.roomId, wall, alongMm - width / 2, width,
  ) + width / 2;
  const placed = attached(object, placementAt(roomWall, object, roomAlong));
  const others = project.objects.filter((item) => item.id !== object.id);
  return { ...project, objects: [...others, placed] };
}

export function placeCatalogOnWall(
  project: InteriorProject,
  roomId: string,
  side: WallSide,
  catalogItemId: LivingRoomCatalogId,
  objectKey: string,
  idFactory: LivingRoomIdFactory,
  alongRatio = 0.5,
): InteriorProject {
  const walls = wallsOnSide(project, roomId, side);
  const piece = longestFreePieceOnSide(project, roomId, side, 400)
    ?? (walls[0]
      ? { wall: walls[0], startAlongMm: 0, lengthMm: wallLength(walls[0]) }
      : null);
  if (!piece) return project;
  const draft = createLivingRoomObject(catalogItemId, {
    id: idFactory("object", objectKey),
    roomId,
    position: { x: 0, y: 0, z: 0 },
  });
  const usable = Math.max(0, piece.lengthMm - draft.dimensions.widthMm);
  const alongMm = piece.startAlongMm + usable * alongRatio + draft.dimensions.widthMm / 2;
  return placeCabinetOnWall(project, draft, piece.wall, alongMm);
}

export function placeCatalogInRoom(
  project: InteriorProject,
  roomId: string,
  catalogItemId: LivingRoomCatalogId,
  objectKey: string,
  idFactory: LivingRoomIdFactory,
  offset: { x: number; z: number; y?: number; rotationY?: number },
  bounds: { centerX: number; centerZ: number },
): InteriorProject {
  const object = createLivingRoomObject(catalogItemId, {
    id: idFactory("object", objectKey),
    roomId,
    position: {
      x: bounds.centerX + offset.x,
      y: offset.y ?? 0,
      z: bounds.centerZ + offset.z,
    },
    rotationY: offset.rotationY,
  });
  return { ...project, objects: [...project.objects, object] };
}

/** Plan offset / facing relative to a declared wall side (inward from that wall). */
export function offsetTowardSide(
  side: WallSide,
  bounds: { widthMm: number; depthMm: number },
  inwardRatio: number,
): { x: number; z: number; rotationY: number } {
  const xSpan = bounds.widthMm * inwardRatio;
  const zSpan = bounds.depthMm * inwardRatio;
  if (side === "north") return { x: 0, z: -zSpan, rotationY: 180 };
  if (side === "south") return { x: 0, z: zSpan, rotationY: 0 };
  if (side === "west") return { x: -xSpan, z: 0, rotationY: 90 };
  return { x: xSpan, z: 0, rotationY: 270 };
}

export function oppositeSide(side: WallSide): WallSide {
  if (side === "north") return "south";
  if (side === "south") return "north";
  if (side === "west") return "east";
  return "west";
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

/** True when a wall-hosted object span overlaps a door/window on the same wall. */
export function objectOverlapsOpeningOnWall(
  project: InteriorProject,
  object: InteriorObjectEntity,
): boolean {
  const wallId = (object.extensions?.wallAttachment as { wallId?: string } | undefined)?.wallId;
  if (!wallId) return false;
  const stored = project.walls.find((wall) => wall.id === wallId);
  if (!stored) return false;
  const wall = orientWallForRoom(project, object.roomId, stored);
  const length = wallLength(wall);
  if (!length) return false;
  const ux = (wall.end.x - wall.start.x) / length;
  const uz = (wall.end.z - wall.start.z) / length;
  const center =
    (object.position.x - wall.start.x) * ux + (object.position.z - wall.start.z) * uz;
  const half = object.dimensions.widthMm / 2;
  const start = center - half;
  const end = center + half;
  for (const opening of selectRoomOpenings(project, object.roomId)) {
    if (opening.wallId !== wallId) continue;
    if (opening.kind !== "door" && opening.kind !== "window") continue;
    const span = openingSpanOnOrientedWall(opening, stored, wall, length);
    if (start < span.endMm && end > span.startMm) return true;
  }
  return false;
}

export function roomObjectsOverlapOpenings(
  project: InteriorProject,
  roomId: string,
): InteriorObjectEntity[] {
  return project.objects.filter(
    (object) => object.roomId === roomId && objectOverlapsOpeningOnWall(project, object),
  );
}
