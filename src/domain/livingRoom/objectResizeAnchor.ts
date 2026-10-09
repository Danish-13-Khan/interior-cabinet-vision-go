import type { InteriorProject, ResizeAnchors, Size3Mm } from "../interiorProject";
import { cabinetRunForObject } from "./cabinetRunLayout";
import { setCabinetInlineDimensions } from "./cabinetRunInlineDims";
import { resizeLivingRoomObject } from "./planCommands";
import { isWallPanelObject } from "./panelAttachment";
import { resizeWallPanel } from "./panelCommands";

/**
 * After an object's size changed, shift its centre so the anchored edge stays
 * where it was. Width runs along the object's local X (yaw-rotated), depth
 * along local Z. Centre anchors (the default) leave the position alone.
 */
export function anchorResizedObject(
  project: InteriorProject,
  objectId: string,
  before: Size3Mm,
  anchors: ResizeAnchors | undefined,
): InteriorProject {
  if (!anchors || (anchors.x !== "min" && anchors.x !== "max" && anchors.z !== "min" && anchors.z !== "max")) return project;
  const object = project.objects.find((item) => item.id === objectId);
  if (!object) return project;
  const alongX = anchors.x === "min" ? (object.dimensions.widthMm - before.widthMm) / 2
    : anchors.x === "max" ? -(object.dimensions.widthMm - before.widthMm) / 2 : 0;
  const alongZ = anchors.z === "min" ? (object.dimensions.depthMm - before.depthMm) / 2
    : anchors.z === "max" ? -(object.dimensions.depthMm - before.depthMm) / 2 : 0;
  if (alongX === 0 && alongZ === 0) return project;
  const yaw = (object.rotation.y * Math.PI) / 180;
  const ux = Math.cos(yaw); const uz = -Math.sin(yaw);
  const vx = Math.sin(yaw); const vz = Math.cos(yaw);
  const position = {
    ...object.position,
    x: Math.round(object.position.x + ux * alongX + vx * alongZ),
    z: Math.round(object.position.z + uz * alongX + vz * alongZ),
  };
  return { ...project, objects: project.objects.map((item) => (item.id === objectId ? { ...item, position } : item)) };
}

/** A cabinet inside a run is placed by the run's reflow; an anchor would fight it. */
export function isRunManagedObject(project: InteriorProject, objectId: string) {
  const object = project.objects.find((item) => item.id === objectId);
  return Boolean(object && object.kind === "cabinet" && cabinetRunForObject(object) !== null);
}

/**
 * The editor's resize: wall panels and run cabinets keep their own placement
 * rules; everything else may keep an anchored edge.
 */
export function resizeInteriorObjectAnchored(
  project: InteriorProject,
  objectId: string,
  dimensions: Size3Mm,
  anchors?: ResizeAnchors,
): InteriorProject {
  const object = project.objects.find((item) => item.id === objectId);
  if (!object) return project;
  if (isWallPanelObject(object)) return resizeWallPanel(project, objectId, dimensions);
  const resized = object.kind === "cabinet"
    ? setCabinetInlineDimensions(project, objectId, dimensions)
    : resizeLivingRoomObject(project, objectId, dimensions);
  return isRunManagedObject(project, objectId) ? resized : anchorResizedObject(resized, objectId, object.dimensions, anchors);
}
