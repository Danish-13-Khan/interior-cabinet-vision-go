import type { InteriorProject } from "../interiorProject";
import { selectRoomWalls } from "../interiorProject";
import {
  applyPanelAttachmentPose,
  isWallPanelObject,
  readPanelAttachment,
} from "./panelAttachment";

const DUPLICATE_GAP_MM = 50;

/** Duplicate a wall panel by offsetting alongMm and regenerating pose (not world XYZ). */
export function duplicateWallPanel(
  project: InteriorProject,
  objectId: string,
  duplicateId: string,
): InteriorProject {
  const source = project.objects.find((item) => item.id === objectId);
  if (!source || !isWallPanelObject(source)) return project;
  const attachment = readPanelAttachment(source);
  if (!attachment) return project;
  const draft = {
    ...source,
    id: duplicateId,
    name: `${source.name} Copy`,
    materialSlots: { ...source.materialSlots },
    parameters: { ...source.parameters },
    extensions: source.extensions ? { ...source.extensions } : undefined,
  };
  const placed = applyPanelAttachmentPose(project, draft, {
    ...attachment,
    alongMm: attachment.alongMm + source.dimensions.widthMm + DUPLICATE_GAP_MM,
  });
  return { ...project, objects: [...project.objects, placed] };
}

/** Remove panels attached to a wall before the host is deleted. */
export function removePanelsOnWall(project: InteriorProject, wallId: string): InteriorProject {
  const objects = project.objects.filter((object) => {
    if (!isWallPanelObject(object)) return true;
    return readPanelAttachment(object)?.wallId !== wallId;
  });
  return objects.length === project.objects.length ? project : { ...project, objects };
}

/** Wall ids that share endpoints with `wallId` (plan edits often move neighbors). */
export function wallNeighborhoodIds(project: InteriorProject, wallId: string): string[] {
  const wall = project.walls.find((item) => item.id === wallId);
  if (!wall) return [wallId];
  return project.walls
    .filter((item) =>
      item.id === wallId
      || item.startNodeId === wall.startNodeId
      || item.endNodeId === wall.startNodeId
      || item.startNodeId === wall.endNodeId
      || item.endNodeId === wall.endNodeId)
    .map((item) => item.id);
}

export function panelHostWallIds(project: InteriorProject, roomId?: string): string[] {
  const ids = new Set<string>();
  for (const object of project.objects) {
    if (!isWallPanelObject(object)) continue;
    if (roomId && object.roomId !== roomId) continue;
    const attachment = readPanelAttachment(object);
    if (attachment?.wallId) ids.add(attachment.wallId);
  }
  if (ids.size > 0) return [...ids];
  return (roomId ? selectRoomWalls(project, roomId) : project.walls).map((wall) => wall.id);
}

export function roomWallIds(project: InteriorProject, roomId: string): string[] {
  return selectRoomWalls(project, roomId).map((wall) => wall.id);
}
