/**
 * Proposal camera fitted to a room's joinery (roadmap D2). The eye stands at a
 * fixed photo height inside the room; the field widens, then the eye moves to
 * the standing point the run faces, before a view is marked partial.
 */

import { roomPlanViewBounds, type InteriorProject, type Point3Mm } from "../interiorProject";
import { screenBoundsFill, type CameraPoseMm } from "../livingRoom/cameraScreenBounds";
import { aabbFitDistanceMm } from "../livingRoom/modelViewFitDistance";
import type { AabbMm } from "../livingRoom/sceneNodeBounds";
import { joineryBoundsMm, joineryBoxesMm } from "./joineryBounds";
import { JOINERY_FRAME_ASPECT, JOINERY_FRAME_MARGIN, joineryInsideFrame, projectBoxes } from "./joineryScreenBounds";
import {
  STANDING,
  clearOfJoinery,
  farStandingPoint,
  insideRect,
  inwardDirection,
  standingDepthMm,
  standingRect,
  type PlanPoint,
} from "./joineryStanding";

export { joineryInsideFrame } from "./joineryScreenBounds";

export const JOINERY_FRAME = {
  /** A standing photo, not the cutaway 3D view's elevation angle. */
  eyeHeightMm: 1500,
  /** Low joinery (a shoe cabinet, a shelf) is looked at from here, not down at. */
  minTargetHeightMm: 900,
  /** The joinery box spans this fraction of the frame. */
  fill: 0.8,
  margin: JOINERY_FRAME_MARGIN,
  /** Vertical, as in three.js. Chosen, not inherited: repo values run 35°–46°. */
  fovDegrees: 42,
  maxFovDegrees: 60,
  fovStepDegrees: 6,
  /** Small pieces are not shot from closer than this; the room sets the limit. */
  minDistanceMm: 1800,
  /** A partial run with less floor than this in front of it has no photo at all; the room is not a default view. */
  minStandingDepthMm: 500,
  wallInsetMm: STANDING.wallInsetMm,
  /** Narrow rooms let the eye stand this close to a wall. */
  tightWallInsetMm: STANDING.tightWallInsetMm,
  aspect: JOINERY_FRAME_ASPECT,
} as const;

export type JoineryFrame = CameraPoseMm & {
  source: "joinery";
  /** The cabinets do not fit even from the far standing point at the widest field. */
  partial: boolean;
  /** Partial, and the room leaves no standing room in front of the run (a 1.2 m utility); never a default view. */
  tight: boolean;
  /** Floor in front of the run, from its front face to the far standing edge. */
  standingDepthMm: number;
};

function boxCentre(box: AabbMm): Point3Mm {
  return { x: (box.min.x + box.max.x) / 2, y: (box.min.y + box.max.y) / 2, z: (box.min.z + box.max.z) / 2 };
}

function poseAt(eye: PlanPoint, target: Point3Mm, fieldOfViewDegrees: number): CameraPoseMm {
  return { position: { x: eye.x, y: JOINERY_FRAME.eyeHeightMm, z: eye.z }, target, fieldOfViewDegrees };
}

function eyeAlong(target: Point3Mm, direction: PlanPoint, distance: number): PlanPoint {
  return { x: target.x + direction.x * distance, z: target.z + direction.z * distance };
}

/** Distance along `direction` at which the cabinets fill the frame, never under the minimum. */
function fitDistance(
  box: AabbMm,
  boxes: readonly AabbMm[],
  target: Point3Mm,
  direction: PlanPoint,
  fov: number,
  aspect: number,
): number {
  let distance = aabbFitDistanceMm({
    min: box.min,
    max: box.max,
    viewFromTarget: { x: direction.x, y: 0, z: direction.z },
    fovDegrees: fov,
    aspect,
    padding: 1,
  });
  for (let step = 0; step < 6; step += 1) {
    const fill = screenBoundsFill(projectBoxes(poseAt(eyeAlong(target, direction, distance), target, fov), aspect, boxes));
    if (!Number.isFinite(fill) || fill <= 0) break;
    distance *= fill / JOINERY_FRAME.fill;
  }
  distance = Math.max(distance, JOINERY_FRAME.minDistanceMm);
  // Looking down from above the box centre is not symmetric; step back until the margin holds.
  for (let step = 0; step < 4; step += 1) {
    if (joineryInsideFrame(poseAt(eyeAlong(target, direction, distance), target, fov), boxes, aspect)) break;
    distance *= 1.05;
  }
  return distance;
}

function fieldLadder(): number[] {
  const fields: number[] = [];
  for (let fov = JOINERY_FRAME.fovDegrees; fov <= JOINERY_FRAME.maxFovDegrees; fov += JOINERY_FRAME.fovStepDegrees) {
    fields.push(fov);
  }
  return fields;
}

/** Camera fitted to the room's joinery, or null when the room has no cut-list cabinet. */
export function frameJoineryCamera(
  project: InteriorProject,
  roomId: string,
  aspect: number = JOINERY_FRAME.aspect,
): JoineryFrame | null {
  const box = joineryBoundsMm(project, roomId);
  if (!box) return null;
  const boxes = joineryBoxesMm(project, roomId);
  const room = roomPlanViewBounds(project, roomId);
  const centre = boxCentre(box);
  const rect = standingRect(box, room);
  const direction = inwardDirection(box, boxes, room, rect);
  const depth = standingDepthMm(boxes, room, rect, direction);
  const frame = (pose: CameraPoseMm, partial: boolean): JoineryFrame => ({
    ...pose,
    source: "joinery",
    partial,
    tight: partial && depth < JOINERY_FRAME.minStandingDepthMm,
    standingDepthMm: depth,
  });
  // Low joinery is looked at from the raised target first; when that pushes its floor edge out, aim at its centre.
  const targets = [{ ...centre, y: Math.max(centre.y, JOINERY_FRAME.minTargetHeightMm) }, centre]
    .filter((candidate, index, all) => index === 0 || candidate.y !== all[0]!.y);
  for (const target of targets) {
    for (const fov of fieldLadder()) {
      const eye = eyeAlong(target, direction, fitDistance(box, boxes, target, direction, fov, aspect));
      const pose = poseAt(eye, target, fov);
      // fitDistance steps back a bounded number of times, so the margin is checked here, not assumed.
      if (insideRect(eye, rect) && clearOfJoinery(eye, boxes) && joineryInsideFrame(pose, boxes, aspect)) {
        return frame(pose, false);
      }
    }
  }
  for (const target of targets) {
    const point = farStandingPoint(target, boxes, direction, rect);
    for (const fov of fieldLadder()) {
      const pose = poseAt(point, target, fov);
      if (joineryInsideFrame(pose, boxes, aspect)) return frame(pose, false);
    }
  }
  const target = targets[0]!;
  return frame(poseAt(farStandingPoint(target, boxes, direction, rect), target, JOINERY_FRAME.maxFovDegrees), true);
}
