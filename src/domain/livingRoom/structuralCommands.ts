import { pointInRoomPolygon, roomPlanPolygon, type InteriorProject, type Point2Mm } from "../interiorProject";
import { createLivingRoomObject } from "./catalog";
import { addLivingRoomObject } from "./planCommands";

export const STRUCTURAL_COLUMN_CATALOG_ID = "living:structural-column" as const;

export function placeStructuralColumn(
  project: InteriorProject,
  id: string,
  position: Point2Mm,
) {
  const polygon = roomPlanPolygon(project, project.activeRoomId);
  const room = project.rooms.find((item) => item.id === project.activeRoomId);
  if (!polygon || !room || !pointInRoomPolygon(position, polygon)) return project;
  const created = createLivingRoomObject(STRUCTURAL_COLUMN_CATALOG_ID, {
    id,
    roomId: project.activeRoomId,
    position: { x: position.x, y: 0, z: position.z },
  });
  const column = { ...created, dimensions: { ...created.dimensions, heightMm: room.dimensions.heightMm } };
  return addLivingRoomObject(project, column);
}
