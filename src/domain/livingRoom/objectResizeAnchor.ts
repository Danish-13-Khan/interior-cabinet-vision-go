import type { InteriorProject, Size3Mm } from "../interiorProject";
import type { ResizeAnchors } from "../interiorProject";

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
