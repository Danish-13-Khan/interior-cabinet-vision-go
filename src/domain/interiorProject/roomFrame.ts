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

/** Near the origin still uses the centred clamp. 1e-12 must not skip it. */
const ORIGIN_TOLERANCE_MM = 0.5;

export function frameIsOrigin(frame: RoomFrame): boolean {
  return Math.abs(frame.centre.x) < ORIGIN_TOLERANCE_MM
    && Math.abs(frame.centre.z) < ORIGIN_TOLERANCE_MM;
}
