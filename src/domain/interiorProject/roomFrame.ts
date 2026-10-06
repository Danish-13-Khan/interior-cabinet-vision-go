import { roomPlanViewBounds } from "./roomPlanBounds";
import type { InteriorProject } from "./types";

/** Classic cabinet space for one room: origin at the plan centre. */
export type RoomFrame = {
  centre: { x: number; z: number };
  widthMm: number;
  depthMm: number;
};

/** Plan centre and span. A room already on the origin has centre (0, 0). */
export function roomFrame(project: InteriorProject, roomId: string): RoomFrame {
  const bounds = roomPlanViewBounds(project, roomId);
  return {
    centre: { x: bounds.centerX, z: bounds.centerZ },
    widthMm: bounds.widthMm,
    depthMm: bounds.depthMm,
  };
}

export function frameIsOrigin(frame: RoomFrame): boolean {
  return frame.centre.x === 0 && frame.centre.z === 0;
}
