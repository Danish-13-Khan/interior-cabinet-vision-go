import type { WallEntity } from "../../domain/interiorProject";

/**
 * Split copies the source wall (`splitPlanWallResult`) and does not stamp
 * `extensions.createdBy` or any remap marker, so a segment is not recorded
 * as a section. The control always deletes the selected wall.
 */
export function wallDeleteActionLabel(_wall: WallEntity): string {
  return "Delete wall";
}
