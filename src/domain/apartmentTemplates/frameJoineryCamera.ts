/**
 * Proposal camera fitted to a room's joinery (roadmap D2). The eye stands at a
 * fixed photo height inside the room; the field widens, then the eye moves to
 * the far corner, before a view is marked partial.
 */

import { roomPlanViewBounds, type InteriorProject, type Point3Mm } from "../interiorProject";
import type { RoomPlanViewBounds } from "../interiorProject/roomPlanBounds";
import {
  projectAabbToScreen,
  screenBoundsFill,
  screenBoundsInsideFrame,
  type CameraPoseMm,
  type ScreenBounds,
} from "../livingRoom/cameraScreenBounds";
import { aabbFitDistanceMm } from "../livingRoom/modelViewFitDistance";
import type { AabbMm } from "../livingRoom/sceneNodeBounds";
import { joineryBoundsMm, joineryBoxesMm } from "./joineryBounds";

export const JOINERY_FRAME = {
  /** A standing photo, not the cutaway 3D view's elevation angle. */
  eyeHeightMm: 1500,
  /** The joinery box spans this fraction of the frame. */
  fill: 0.8,
  /** Every corner stays this far (NDC) inside the frame. */
  margin: 0.1,
  /** Vertical, as in three.js. Chosen, not inherited: repo values run 35°–46°. */
  fovDegrees: 42,
  maxFovDegrees: 60,
  fovStepDegrees: 6,
  wallInsetMm: 500,
  /** A run this close to a wall backs onto it. */
  backingGapMm: 150,
  /** The eye never stands closer than this to a cabinet. */
  clearanceMm: 300,
  /** Proposal stills and Present captures. */
  aspect: 16 / 9,
} as const;

export type JoineryFrame = CameraPoseMm & {
  source: "joinery";
  /** The box does not fit even from the far corner at the widest field. */
  partial: boolean;
};

type PlanPoint = { x: number; z: number };

function boxCentre(box: AabbMm): Point3Mm {
  return { x: (box.min.x + box.max.x) / 2, y: (box.min.y + box.max.y) / 2, z: (box.min.z + box.max.z) / 2 };
}

/** Unit direction away from the walls the run backs onto, else toward the room centre. */
function inwardDirection(box: AabbMm, room: RoomPlanViewBounds): PlanPoint {
  const gap = JOINERY_FRAME.backingGapMm;
  let x = 0;
  let z = 0;
  if (box.min.x - room.minX <= gap) x += 1;
  if (room.maxX - box.max.x <= gap) x -= 1;
  if (box.min.z - room.minZ <= gap) z += 1;
  if (room.maxZ - box.max.z <= gap) z -= 1;
  if (!x && !z) {
    const centre = boxCentre(box);
    x = room.centerX - centre.x;
    z = room.centerZ - centre.z;
  }
  const length = Math.hypot(x, z);
  return length > 1e-6 ? { x: x / length, z: z / length } : { x: 0, z: 1 };
}

function poseAt(eye: PlanPoint, target: Point3Mm, fieldOfViewDegrees: number): CameraPoseMm {
  return { position: { x: eye.x, y: JOINERY_FRAME.eyeHeightMm, z: eye.z }, target, fieldOfViewDegrees };
}

/**
 * Screen bounds of several boxes together. An L-shaped run is judged by its
 * cabinets, not by the empty quadrant of their common bounding box.
 */
function projectBoxes(pose: CameraPoseMm, aspect: number, boxes: readonly AabbMm[]): ScreenBounds {
  const merged: ScreenBounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, inFront: true };
  for (const box of boxes) {
    const bounds = projectAabbToScreen(pose, aspect, box);
    merged.minX = Math.min(merged.minX, bounds.minX);
    merged.maxX = Math.max(merged.maxX, bounds.maxX);
    merged.minY = Math.min(merged.minY, bounds.minY);
    merged.maxY = Math.max(merged.maxY, bounds.maxY);
    merged.inFront &&= bounds.inFront;
  }
  return merged;
}

/** True when every cabinet projects inside the frame with the D2 margin. */
export function joineryInsideFrame(pose: CameraPoseMm, boxes: readonly AabbMm[], aspect = JOINERY_FRAME.aspect): boolean {
  return screenBoundsInsideFrame(projectBoxes(pose, aspect, boxes), JOINERY_FRAME.margin);
}

/** True when the eye keeps its clearance from every cabinet in plan. */
function clearOfJoinery(eye: PlanPoint, boxes: readonly AabbMm[]): boolean {
  const gap = JOINERY_FRAME.clearanceMm;
  return boxes.every((box) =>
    eye.x < box.min.x - gap || eye.x > box.max.x + gap || eye.z < box.min.z - gap || eye.z > box.max.z + gap);
}

function eyeAlong(target: Point3Mm, direction: PlanPoint, distance: number): PlanPoint {
  return { x: target.x + direction.x * distance, z: target.z + direction.z * distance };
}

/** Distance along `direction` at which the box fills the frame from the fixed eye height. */
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
  // Looking down from above the box centre is not symmetric; step back until the margin holds.
  for (let step = 0; step < 4; step += 1) {
    if (joineryInsideFrame(poseAt(eyeAlong(target, direction, distance), target, fov), boxes, aspect)) break;
    distance *= 1.05;
  }
  return distance;
}

function insideRoom(eye: PlanPoint, room: RoomPlanViewBounds): boolean {
  const inset = JOINERY_FRAME.wallInsetMm;
  return eye.x >= room.minX + inset && eye.x <= room.maxX - inset
    && eye.z >= room.minZ + inset && eye.z <= room.maxZ - inset;
}

function fieldLadder(): number[] {
  const fields: number[] = [];
  for (let fov = JOINERY_FRAME.fovDegrees; fov <= JOINERY_FRAME.maxFovDegrees; fov += JOINERY_FRAME.fovStepDegrees) {
    fields.push(fov);
  }
  return fields;
}

/**
 * The free-floor corner the run faces: inset room corners clear of every
 * cabinet, the one farthest along the inward direction first.
 */
function farCorner(box: AabbMm, boxes: readonly AabbMm[], direction: PlanPoint, room: RoomPlanViewBounds): PlanPoint {
  const inset = JOINERY_FRAME.wallInsetMm;
  const centre = boxCentre(box);
  const corners: PlanPoint[] = [
    { x: room.minX + inset, z: room.minZ + inset },
    { x: room.maxX - inset, z: room.minZ + inset },
    { x: room.minX + inset, z: room.maxZ - inset },
    { x: room.maxX - inset, z: room.maxZ - inset },
  ];
  const along = (corner: PlanPoint) => (corner.x - centre.x) * direction.x + (corner.z - centre.z) * direction.z;
  const free = corners.filter((corner) => clearOfJoinery(corner, boxes));
  return (free.length ? free : corners).sort((a, b) => along(b) - along(a))[0]!;
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
  const target = boxCentre(box);
  const direction = inwardDirection(box, room);
  for (const fov of fieldLadder()) {
    const eye = eyeAlong(target, direction, fitDistance(box, boxes, target, direction, fov, aspect));
    if (insideRoom(eye, room) && clearOfJoinery(eye, boxes)) {
      return { ...poseAt(eye, target, fov), source: "joinery", partial: false };
    }
  }
  const corner = farCorner(box, boxes, direction, room);
  for (const fov of fieldLadder()) {
    const pose = poseAt(corner, target, fov);
    if (joineryInsideFrame(pose, boxes, aspect)) return { ...pose, source: "joinery", partial: false };
  }
  return { ...poseAt(corner, target, JOINERY_FRAME.maxFovDegrees), source: "joinery", partial: true };
}
