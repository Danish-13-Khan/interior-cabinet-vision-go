import {
  validateInteriorProject,
  type InteriorObjectEntity,
  type InteriorProject,
  type OpeningEntity,
  type Point3Mm,
  type Size3Mm,
} from "../interiorProject";
import { getObjectPlanBounds } from "./planGeometry";

export type LivingRoomAlignMode =
  | "left"
  | "center-x"
  | "right"
  | "top"
  | "center-z"
  | "bottom"
  | "distribute-x"
  | "distribute-z";

function safe(project: InteriorProject) {
  return validateInteriorProject(project).project;
}

function mapObject(
  project: InteriorProject,
  objectId: string,
  update: (object: InteriorObjectEntity) => InteriorObjectEntity,
) {
  return safe({
    ...project,
    objects: project.objects.map((object) =>
      object.id === objectId ? update(object) : object,
    ),
  });
}

export function moveLivingRoomObject(
  project: InteriorProject,
  objectId: string,
  position: Point3Mm,
) {
  return mapObject(project, objectId, (object) => ({ ...object, position }));
}

export function resizeLivingRoomObject(
  project: InteriorProject,
  objectId: string,
  dimensions: Size3Mm,
) {
  return mapObject(project, objectId, (object) => ({
    ...object,
    dimensions: {
      widthMm: Math.max(100, dimensions.widthMm),
      heightMm: Math.max(10, dimensions.heightMm),
      depthMm: Math.max(100, dimensions.depthMm),
    },
  }));
}

export function rotateLivingRoomObject(
  project: InteriorProject,
  objectId: string,
  rotationY: number,
) {
  const snapped = ((Math.round(rotationY / 15) * 15) % 360 + 360) % 360;
  return mapObject(project, objectId, (object) => ({
    ...object,
    rotation: { ...object.rotation, y: snapped },
  }));
}

export function addLivingRoomObject(
  project: InteriorProject,
  object: InteriorObjectEntity,
) {
  return safe({ ...project, objects: [...project.objects, object] });
}

export function duplicateLivingRoomObject(
  project: InteriorProject,
  objectId: string,
  duplicateId: string,
) {
  const source = project.objects.find((object) => object.id === objectId);
  if (!source) return project;
  return addLivingRoomObject(project, {
    ...source,
    id: duplicateId,
    name: `${source.name} Copy`,
    position: { ...source.position, x: source.position.x + 150, z: source.position.z + 150 },
    materialSlots: { ...source.materialSlots },
    parameters: { ...source.parameters },
    extensions: source.extensions ? { ...source.extensions } : undefined,
  });
}

export function deleteLivingRoomObjects(
  project: InteriorProject,
  objectIds: string[],
) {
  const removed = new Set(objectIds);
  return safe({
    ...project,
    objects: project.objects.filter((object) => !removed.has(object.id)),
  });
}

export function alignLivingRoomObjects(
  project: InteriorProject,
  objectIds: string[],
  mode: LivingRoomAlignMode,
) {
  const selected = project.objects.filter((object) => objectIds.includes(object.id));
  if (selected.length < 2) return project;
  const sorted = [...selected].sort((a, b) =>
    mode === "distribute-z" ? a.position.z - b.position.z : a.position.x - b.position.x,
  );
  const centerX = selected.reduce((sum, object) => sum + object.position.x, 0) /
    selected.length;
  const centerZ = selected.reduce((sum, object) => sum + object.position.z, 0) /
    selected.length;
  const bounds = new Map(
    selected.map((object) => [object.id, getObjectPlanBounds(object)]),
  );
  const minX = Math.min(...selected.map((object) => object.position.x));
  const maxX = Math.max(...selected.map((object) => object.position.x));
  const minZ = Math.min(...selected.map((object) => object.position.z));
  const maxZ = Math.max(...selected.map((object) => object.position.z));
  const left = Math.min(...selected.map((object) => bounds.get(object.id)!.minX));
  const right = Math.max(...selected.map((object) => bounds.get(object.id)!.maxX));
  const top = Math.min(...selected.map((object) => bounds.get(object.id)!.minZ));
  const bottom = Math.max(...selected.map((object) => bounds.get(object.id)!.maxZ));
  const distribution = new Map<string, number>();
  if (mode === "distribute-x" || mode === "distribute-z") {
    const start = mode === "distribute-x" ? minX : minZ;
    const end = mode === "distribute-x" ? maxX : maxZ;
    sorted.forEach((object, index) => {
      distribution.set(object.id, start + ((end - start) * index) / (sorted.length - 1));
    });
  }
  return safe({
    ...project,
    objects: project.objects.map((object) => {
      if (!objectIds.includes(object.id)) return object;
      const position = { ...object.position };
      if (mode === "left") position.x += left - bounds.get(object.id)!.minX;
      if (mode === "center-x") position.x = centerX;
      if (mode === "right") position.x += right - bounds.get(object.id)!.maxX;
      if (mode === "top") position.z += top - bounds.get(object.id)!.minZ;
      if (mode === "center-z") position.z = centerZ;
      if (mode === "bottom") position.z += bottom - bounds.get(object.id)!.maxZ;
      if (mode === "distribute-x") position.x = distribution.get(object.id)!;
      if (mode === "distribute-z") position.z = distribution.get(object.id)!;
      return { ...object, position };
    }),
  });
}

export function resizeLivingRoom(
  project: InteriorProject,
  roomId: string,
  dimensions: Size3Mm,
) {
  const widthMm = Math.max(2500, dimensions.widthMm);
  const depthMm = Math.max(2500, dimensions.depthMm);
  const heightMm = Math.max(2200, dimensions.heightMm);
  const halfWidth = widthMm / 2;
  const halfDepth = depthMm / 2;
  const endpoints: Record<string, [{ x: number; z: number }, { x: number; z: number }]> = {
    back: [{ x: -halfWidth, z: -halfDepth }, { x: halfWidth, z: -halfDepth }],
    right: [{ x: halfWidth, z: -halfDepth }, { x: halfWidth, z: halfDepth }],
    front: [{ x: halfWidth, z: halfDepth }, { x: -halfWidth, z: halfDepth }],
    left: [{ x: -halfWidth, z: halfDepth }, { x: -halfWidth, z: -halfDepth }],
  };
  return safe({
    ...project,
    rooms: project.rooms.map((room) =>
      room.id === roomId
        ? { ...room, dimensions: { widthMm, heightMm, depthMm } }
        : room,
    ),
    walls: project.walls.map((wall) => {
      if (wall.roomId !== roomId) return wall;
      const side = String(wall.extensions?.wallSide ?? "");
      const points = endpoints[side];
      return points
        ? { ...wall, start: points[0], end: points[1], heightMm }
        : { ...wall, heightMm };
    }),
  });
}

function wallLength(project: InteriorProject, wallId: string) {
  const wall = project.walls.find((item) => item.id === wallId);
  return wall ? Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z) : 0;
}

function normaliseOpening(project: InteriorProject, opening: OpeningEntity): OpeningEntity {
  const length = wallLength(project, opening.wallId);
  const widthMm = Math.min(Math.max(300, opening.widthMm), Math.max(300, length - 200));
  return {
    ...opening,
    offsetMm: Math.min(Math.max(0, opening.offsetMm), Math.max(0, length - widthMm)),
    widthMm,
    heightMm: Math.max(300, opening.heightMm),
    sillHeightMm: Math.max(0, opening.sillHeightMm),
  };
}

export function addLivingRoomOpening(project: InteriorProject, opening: OpeningEntity) {
  return safe({ ...project, openings: [...project.openings, normaliseOpening(project, opening)] });
}

export function updateLivingRoomOpening(
  project: InteriorProject,
  openingId: string,
  patch: Partial<Pick<OpeningEntity, "kind" | "offsetMm" | "widthMm" | "heightMm" | "sillHeightMm" | "swingDirection">>,
) {
  return safe({
    ...project,
    openings: project.openings.map((opening) => opening.id === openingId
      ? normaliseOpening(project, { ...opening, ...patch })
      : opening),
  });
}

export function deleteLivingRoomOpening(project: InteriorProject, openingId: string) {
  return safe({ ...project, openings: project.openings.filter((opening) => opening.id !== openingId) });
}
