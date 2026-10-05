import {
  type InteriorProject,
  type OpeningEntity,
} from "../interiorProject";
import type { LivingRoomIdFactory } from "../livingRoom/ids";
import { sharedWallBetween } from "./sharedWall";
import type { ApartmentOpeningSpec } from "./types";
import { exteriorWallOnSide } from "./wallSide";

function roomIdForKey(
  rooms: Map<string, string>,
  key: string,
): string {
  const id = rooms.get(key);
  if (!id) throw new Error(`Unknown room key "${key}" for opening`);
  return id;
}

/**
 * Place doors/windows/arches on shared or exterior walls (§3.1).
 * Values are kept as authored (no silent squeeze); the shell builder rejects
 * out-of-range / overlap warnings.
 */
export function applyApartmentOpenings(
  project: InteriorProject,
  openings: readonly ApartmentOpeningSpec[],
  roomKeyToId: Map<string, string>,
  idFactory: LivingRoomIdFactory,
): InteriorProject {
  let next = project;
  openings.forEach((spec, index) => {
    const wall = resolveOpeningWall(next, spec, roomKeyToId);
    if (!wall) {
      throw new Error(`No wall for opening #${index} (${spec.kind})`);
    }
    const roomHint = Array.isArray(spec.between)
      ? roomIdForKey(roomKeyToId, spec.between[0])
      : roomIdForKey(roomKeyToId, spec.between.room);
    const opening: OpeningEntity = {
      id: idFactory("opening", `o${index}`),
      roomId: roomHint,
      wallId: wall.id,
      kind: spec.kind,
      offsetMm: spec.offsetMm,
      widthMm: spec.widthMm,
      heightMm: spec.heightMm ?? (spec.kind === "window" ? 1300 : 2100),
      sillHeightMm: spec.sillHeightMm ?? (spec.kind === "window" ? 900 : 0),
      catalogItemId: spec.catalogItemId,
      swingDirection: spec.kind === "door" ? "in" : undefined,
    };
    next = { ...next, openings: [...next.openings, opening] };
  });
  return next;
}

function resolveOpeningWall(
  project: InteriorProject,
  spec: ApartmentOpeningSpec,
  roomKeyToId: Map<string, string>,
) {
  if (Array.isArray(spec.between)) {
    const a = roomIdForKey(roomKeyToId, spec.between[0]);
    const b = roomIdForKey(roomKeyToId, spec.between[1]);
    return sharedWallBetween(project, a, b);
  }
  const roomId = roomIdForKey(roomKeyToId, spec.between.room);
  return exteriorWallOnSide(project, roomId, spec.between.side);
}
