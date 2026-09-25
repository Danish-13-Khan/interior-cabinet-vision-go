import { roomPlanPolygon, roomPolygonIsValid } from "./roomGeometry";
import { selectActiveInteriorRoom, selectRoomWalls } from "./selectors";
import type { InteriorProject } from "./types";
import { isWallRaised, setPlanWallsRaised } from "./wallRaise";

export type RoomModelRaisePlan =
  | { status: "ready" }
  | { status: "raise"; wallIds: string[]; heightMm: number }
  | { status: "blocked"; reason: string };

/** Closed, valid rooms can use the same raise command as WallRaiseControls. */
export function planClosedRoomModelRaise(project: InteriorProject): RoomModelRaisePlan {
  const room = selectActiveInteriorRoom(project);
  if (!room) {
    return { status: "blocked", reason: "Draw a closed room in 2D before opening 3D." };
  }
  const walls = selectRoomWalls(project, room.id).filter((wall) => wall.visible);
  if (walls.length === 0) {
    return { status: "blocked", reason: "This room has no walls to extrude." };
  }
  const unraised = walls.filter((wall) => !isWallRaised(wall));
  if (unraised.length === 0) return { status: "ready" };
  const polygon = roomPlanPolygon(project, room.id);
  if (!polygon || !roomPolygonIsValid(polygon)) {
    return {
      status: "blocked",
      reason: "The outline is open or invalid, so it cannot be raised to 3D.",
    };
  }
  return {
    status: "raise",
    wallIds: unraised.map((wall) => wall.id),
    heightMm: room.dimensions.heightMm,
  };
}

/** One undoable step. Returns null when the room should stay unchanged. */
export function raiseClosedRoomForModel(project: InteriorProject): InteriorProject | null {
  const plan = planClosedRoomModelRaise(project);
  if (plan.status !== "raise") return null;
  return setPlanWallsRaised(project, plan.wallIds, true, plan.heightMm);
}
