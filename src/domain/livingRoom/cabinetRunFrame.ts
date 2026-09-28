/**
 * Default 3D / Present framing: look at the cabinet run from the room interior,
 * elevated, sized so the run fills ~70% of the frame. Walls on the camera side
 * are listed for cutaway so nothing blocks the run.
 */

import type { Point3Mm } from "../interiorProject";
import { projectAabbToScreen, screenBoundsFill, type CameraPoseMm } from "./cameraScreenBounds";
import { aabbFitDistanceMm, offsetFromTargetMm } from "./modelViewFitDistance";
import { cabinetSceneBoundsMm, type AabbMm } from "./sceneNodeBounds";
import type { CompiledLivingRoomScene } from "./sceneTypes";

export type RoomSide = "front" | "back" | "left" | "right";
export type CabinetRunAudience = "author" | "client";

export type CabinetRunFrame = CameraPoseMm & {
  runBounds: AabbMm;
  cutawaySides: Set<RoomSide>;
};

export const RUN_FRAME_ELEVATION_DEG: Record<CabinetRunAudience, number> = { author: 35, client: 22 };
export const RUN_FRAME_FILL = 0.7;
/** Wall thickness plus a small service gap between the envelope and a cabinet back. */
const RUN_WALL_TOLERANCE_MM = 450;
const ALL_SIDES: readonly RoomSide[] = ["front", "back", "left", "right"];

function centre(box: { min: Point3Mm; max: Point3Mm }): Point3Mm {
  return { x: (box.min.x + box.max.x) / 2, y: (box.min.y + box.max.y) / 2, z: (box.min.z + box.max.z) / 2 };
}

/** Room sides the run stands against (its back walls). */
export function cabinetRunWallSides(run: AabbMm, room: AabbMm): Set<RoomSide> {
  const sides = new Set<RoomSide>();
  if (run.min.z - room.min.z < RUN_WALL_TOLERANCE_MM) sides.add("back");
  if (room.max.z - run.max.z < RUN_WALL_TOLERANCE_MM) sides.add("front");
  if (run.min.x - room.min.x < RUN_WALL_TOLERANCE_MM) sides.add("left");
  if (room.max.x - run.max.x < RUN_WALL_TOLERANCE_MM) sides.add("right");
  return sides;
}

function inwardDirection(run: AabbMm, room: AabbMm, sides: Set<RoomSide>): { x: number; z: number } {
  let x = (sides.has("left") ? 1 : 0) - (sides.has("right") ? 1 : 0);
  let z = (sides.has("back") ? 1 : 0) - (sides.has("front") ? 1 : 0);
  if (!x && !z) {
    const runC = centre(run);
    const roomC = centre(room);
    x = roomC.x - runC.x;
    z = roomC.z - runC.z;
  }
  const length = Math.hypot(x, z);
  return length > 1e-6 ? { x: x / length, z: z / length } : { x: 0, z: 1 };
}

function cameraSides(position: Point3Mm, room: AabbMm, inward: { x: number; z: number }): Set<RoomSide> {
  const sides = new Set<RoomSide>();
  if (position.z > room.max.z || inward.z > 0.5) sides.add("front");
  if (position.z < room.min.z || inward.z < -0.5) sides.add("back");
  if (position.x > room.max.x || inward.x > 0.5) sides.add("right");
  if (position.x < room.min.x || inward.x < -0.5) sides.add("left");
  return sides;
}

export function resolveCabinetRunFrame(
  scene: Pick<CompiledLivingRoomScene, "nodes" | "bounds">,
  viewport: { widthPx: number; heightPx: number },
  options: { audience?: CabinetRunAudience; fieldOfViewDegrees?: number; fill?: number } = {},
): CabinetRunFrame | null {
  const run = cabinetSceneBoundsMm(scene.nodes);
  if (!run) return null;
  const audience = options.audience ?? "author";
  const fov = options.fieldOfViewDegrees ?? 40;
  const fill = options.fill ?? RUN_FRAME_FILL;
  const aspect = viewport.heightPx > 0 ? viewport.widthPx / viewport.heightPx : 16 / 9;
  const room = scene.bounds;
  const runSides = cabinetRunWallSides(run, room);
  const inward = inwardDirection(run, room, runSides);
  const elevation = (RUN_FRAME_ELEVATION_DEG[audience] * Math.PI) / 180;
  const direction = {
    x: inward.x * Math.cos(elevation),
    y: Math.sin(elevation),
    z: inward.z * Math.cos(elevation),
  };
  const target = centre(run);
  let distance = aabbFitDistanceMm({ min: run.min, max: run.max, viewFromTarget: direction, fovDegrees: fov, aspect, padding: 1 });
  let position = offsetFromTargetMm(target, direction, distance);
  for (let step = 0; step < 4; step += 1) {
    const current = screenBoundsFill(projectAabbToScreen({ position, target, fieldOfViewDegrees: fov }, aspect, run));
    if (!Number.isFinite(current) || current <= 0) break;
    distance *= current / fill;
    position = offsetFromTargetMm(target, direction, distance);
  }
  const near = audience === "client"
    ? new Set(ALL_SIDES.filter((side) => !runSides.has(side)))
    : cameraSides(position, room, inward);
  for (const side of runSides) near.delete(side);
  return { position, target, fieldOfViewDegrees: fov, runBounds: run, cutawaySides: near };
}
