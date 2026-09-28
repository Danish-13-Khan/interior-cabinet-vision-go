/**
 * Default 3D / Present framing: look at the cabinet run from the room interior,
 * elevated, sized so the run fills ~70% of the frame. Walls on the camera side
 * are listed for cutaway so nothing blocks the run.
 */

import type { Point3Mm } from "../interiorProject";
import { projectAabbToScreen, screenBoundsFill, type CameraPoseMm } from "./cameraScreenBounds";
import { aabbFitDistanceMm, offsetFromTargetMm } from "./modelViewFitDistance";
import { analyseCabinetRunWalls, type RoomSide } from "./cabinetRunWalls";
import { cabinetSceneBoundsMm, isCabinetSceneNode, sceneNodeAabbMm, type AabbMm } from "./sceneNodeBounds";
import type { CompiledLivingRoomScene } from "./sceneTypes";

export type { RoomSide } from "./cabinetRunWalls";
export type CabinetRunAudience = "author" | "client";

export type CabinetRunFrame = CameraPoseMm & {
  runBounds: AabbMm;
  /** Walls the cabinets back onto; never cut away. */
  runSides: Set<RoomSide>;
  cutawaySides: Set<RoomSide>;
};

export const RUN_FRAME_ELEVATION_DEG: Record<CabinetRunAudience, number> = { author: 35, client: 22 };
export const RUN_FRAME_FILL = 0.7;
const ALL_SIDES: readonly RoomSide[] = ["front", "back", "left", "right"];

function centre(box: { min: Point3Mm; max: Point3Mm }): Point3Mm {
  return { x: (box.min.x + box.max.x) / 2, y: (box.min.y + box.max.y) / 2, z: (box.min.z + box.max.z) / 2 };
}

function inwardDirection(run: AabbMm, room: AabbMm, weighted: { x: number; z: number } | null): { x: number; z: number } {
  if (weighted) return weighted;
  const runC = centre(run);
  const roomC = centre(room);
  const x = roomC.x - runC.x;
  const z = roomC.z - runC.z;
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
  const boxes = scene.nodes.filter(isCabinetSceneNode).map(sceneNodeAabbMm).filter((box): box is AabbMm => box !== null);
  const walls = analyseCabinetRunWalls(boxes, room);
  const runSides = walls.sides;
  const inward = inwardDirection(run, room, walls.inward);
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
  return { position, target, fieldOfViewDegrees: fov, runBounds: run, runSides, cutawaySides: near };
}
