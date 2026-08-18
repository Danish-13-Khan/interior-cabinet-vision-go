import type { InteriorProject } from "../interiorProject";

export type LivingRoomLayerId = "walls" | "openings" | "furniture";

function withExtensions<T extends { extensions?: Record<string, unknown> }>(entity: T, patch: Record<string, unknown>): T {
  return { ...entity, extensions: { ...entity.extensions, ...patch } };
}

export function setLivingRoomFloorMaterial(project: InteriorProject, materialId: string) {
  return {
    ...project,
    rooms: project.rooms.map((room) => room.id === project.activeRoomId
      ? withExtensions(room, { floorMaterialId: materialId }) : room),
  };
}

export function setLivingRoomWallMaterial(project: InteriorProject, wallId: string, materialId: string) {
  return { ...project, walls: project.walls.map((wall) => wall.id === wallId ? { ...wall, materialId } : wall) };
}

export function setLivingRoomLayerVisibility(project: InteriorProject, layer: LivingRoomLayerId, visible: boolean) {
  if (layer === "walls") return { ...project, walls: project.walls.map((wall) => ({ ...wall, visible })) };
  if (layer === "openings") return {
    ...project,
    openings: project.openings.map((opening) => withExtensions(opening, { layerVisible: visible })),
  };
  return {
    ...project,
    objects: project.objects.map((object) => withExtensions(object, { layerVisible: visible })),
  };
}

export function isLivingRoomLayerVisible(project: InteriorProject, layer: LivingRoomLayerId) {
  if (layer === "walls") return project.walls.some((wall) => wall.visible);
  const entities = layer === "openings" ? project.openings : project.objects;
  return entities.some((entity) => entity.extensions?.layerVisible !== false);
}
