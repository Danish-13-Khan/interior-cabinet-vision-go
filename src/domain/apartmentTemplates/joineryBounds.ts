import { CABINET_IDENTITY_EXTENSION } from "../cabinetIdentity/types";
import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";
import type { AabbMm } from "../livingRoom/sceneNodeBounds";
import { objectBox, type ObjectBox } from "./composers/objectBounds";

/**
 * A cabinet the quote prices: it carries a cabinet identity, so it reaches the
 * cut list and the proposal's cabinet lines. Catalog display pieces with cabinet
 * kind (TV niches, feature walls, decorative panels) do not.
 */
export function isCutListCabinet(object: InteriorObjectEntity): boolean {
  return object.kind === "cabinet" && Boolean(object.extensions?.[CABINET_IDENTITY_EXTENSION]);
}

/** Cut-list cabinets in a room: the joinery the customer pays for. Fillers belong to the run but are not counted. */
export function cutListCabinets(project: InteriorProject, roomId: string): InteriorObjectEntity[] {
  return project.objects.filter(
    (object) => object.roomId === roomId && isCutListCabinet(object) && object.category !== "filler",
  );
}

function toAabb(box: ObjectBox): AabbMm {
  return { min: { x: box.minX, y: box.minY, z: box.minZ }, max: { x: box.maxX, y: box.maxY, z: box.maxZ } };
}

/** World box of each cut-list cabinet in the room (fillers included). */
export function joineryBoxesMm(project: InteriorProject, roomId: string): AabbMm[] {
  return project.objects
    .filter((object) => object.roomId === roomId && isCutListCabinet(object))
    .map((object) => toAabb(objectBox(object)));
}

/**
 * Bounds of the room's whole joinery run, or null when the room has no
 * cut-list cabinet. Catalog objects (TV units, vanities, desks) never pull the frame.
 */
export function joineryBoundsMm(project: InteriorProject, roomId: string): AabbMm | null {
  if (!cutListCabinets(project, roomId).length) return null;
  const boxes = joineryBoxesMm(project, roomId);
  return {
    min: {
      x: Math.min(...boxes.map((box) => box.min.x)),
      y: Math.min(...boxes.map((box) => box.min.y)),
      z: Math.min(...boxes.map((box) => box.min.z)),
    },
    max: {
      x: Math.max(...boxes.map((box) => box.max.x)),
      y: Math.max(...boxes.map((box) => box.max.y)),
      z: Math.max(...boxes.map((box) => box.max.z)),
    },
  };
}
