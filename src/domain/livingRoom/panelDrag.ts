import type { InteriorObjectEntity, InteriorProject } from "../interiorProject";
import { orientWallForRoom, selectRoomWalls } from "../interiorProject";
import {
  applyPanelAttachmentPose,
  defaultPanelAttachment,
  isWallPanelObject,
  readPanelAttachment,
  type PanelAttachment,
} from "./panelAttachment";
import { wallLength } from "./wallSegmentPlacement";

type PointXZ = { x: number; y?: number; z: number };

function attachmentFor(project: InteriorProject, object: InteriorObjectEntity): PanelAttachment {
  return readPanelAttachment(object)
    ?? defaultPanelAttachment(project, "", object);
}

/** Project a plan point onto the nearest wall long enough for the panel; preserves §2.1 fields. */
export function dragWallPanel(
  project: InteriorProject,
  object: InteriorObjectEntity,
  desired: PointXZ,
): InteriorObjectEntity {
  if (!isWallPanelObject(object)) return { ...object, position: { x: desired.x, y: desired.y ?? object.position.y, z: desired.z } };
  const current = attachmentFor(project, object);
  const candidates = selectRoomWalls(project, object.roomId)
    .filter((stored) => wallLength(orientWallForRoom(project, object.roomId, stored)) >= object.dimensions.widthMm)
    .map((stored) => {
      const wall = orientWallForRoom(project, object.roomId, stored);
      const length = wallLength(wall);
      const ux = (wall.end.x - wall.start.x) / length;
      const uz = (wall.end.z - wall.start.z) / length;
      const alongMm = (desired.x - wall.start.x) * ux + (desired.z - wall.start.z) * uz;
      const px = wall.start.x + ux * alongMm;
      const pz = wall.start.z + uz * alongMm;
      return { wallId: stored.id, alongMm, distance: Math.hypot(desired.x - px, desired.z - pz) };
    })
    .sort((a, b) => a.distance - b.distance);
  const nearest = candidates[0];
  const host = nearest && nearest.distance <= object.dimensions.depthMm + 350
    ? nearest
    : candidates.find((item) => item.wallId === current.wallId) ?? nearest;
  if (!host?.wallId) return applyPanelAttachmentPose(project, object, current);
  const attachment: PanelAttachment = {
    ...current,
    wallId: host.wallId,
    alongMm: host.alongMm,
  };
  return applyPanelAttachmentPose(project, object, attachment);
}
