import {
  orientWallForRoom,
  selectRoomOpenings,
  type InteriorObjectEntity,
  type InteriorProject,
  type OpeningEntity,
} from "../../interiorProject";
import { openingSpanOnOrientedWall } from "../../livingRoom/cabinetRunPlacementPreview";
import { wallLength } from "../../livingRoom/wallSegmentPlacement";
import { hostWallId, objectSpanOnWall } from "./wallPieces";

/** Vertical band an opening cuts in its wall (doors and arches from the floor). */
function openingBand(opening: OpeningEntity): { bottomMm: number; topMm: number } {
  const bottomMm = opening.kind === "window" ? opening.sillHeightMm : 0;
  return { bottomMm, topMm: bottomMm + opening.heightMm };
}

/**
 * True when any wall-hosted object (cabinet, TV unit, niche, decor panel,
 * mirror …) overlaps a door, window or arch on the same wall — along the
 * wall and vertically.
 */
export function objectOverlapsOpeningOnWall(
  project: InteriorProject,
  object: InteriorObjectEntity,
): boolean {
  const wallId = hostWallId(object);
  if (!wallId) return false;
  const stored = project.walls.find((wall) => wall.id === wallId);
  if (!stored) return false;
  const wall = orientWallForRoom(project, object.roomId, stored);
  const length = wallLength(wall);
  if (!length) return false;
  const { startMm, endMm } = objectSpanOnWall(object, wall);
  const bottom = object.position.y;
  const top = bottom + object.dimensions.heightMm;
  for (const opening of selectRoomOpenings(project, object.roomId)) {
    if (opening.wallId !== wallId) continue;
    const span = openingSpanOnOrientedWall(opening, stored, wall, length);
    const band = openingBand(opening);
    const along = startMm < span.endMm - 0.5 && endMm > span.startMm + 0.5;
    const vertical = bottom < band.topMm - 0.5 && top > band.bottomMm + 0.5;
    if (along && vertical) return true;
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
