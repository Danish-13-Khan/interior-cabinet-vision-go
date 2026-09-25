import { roomPlanPolygon, roomPolygonIsValid } from "./roomGeometry";
import { selectActiveInteriorRoom } from "./selectors";
import type { InteriorProject, WallEntity } from "./types";
import { isWallRaised, outerLoopWallsRaised, setPlanWallsRaised } from "./wallRaise";

function outerLoopWalls(project: InteriorProject, roomId: string): WallEntity[] {
  const room = project.rooms.find((item) => item.id === roomId);
  const loop = project.loops.find((item) => item.id === room?.outerLoopId);
  return (loop?.wallUses ?? [])
    .map((use) => project.walls.find((wall) => wall.id === use.wallId))
    .filter((wall): wall is WallEntity => Boolean(wall));
}

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
  const walls = outerLoopWalls(project, room.id);
  if (walls.length === 0) {
    return { status: "blocked", reason: "This room has no walls to extrude." };
  }
  if (outerLoopWallsRaised(project, room)) return { status: "ready" };
  const unraised = walls.filter((wall) => !isWallRaised(wall));
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
