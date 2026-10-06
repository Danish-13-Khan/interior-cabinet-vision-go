import type { InteriorProject } from "../interiorProject";
import { resolveCabinetRunFrame } from "../livingRoom/cabinetRunFrame";
import { aabbFitDistanceMm, offsetFromTargetMm } from "../livingRoom/modelViewFitDistance";
import type { RoomSceneLookup } from "../livingRoom/roomSceneCache";
import type { CompiledSceneBounds } from "../livingRoom/sceneTypes";
import { cameraEntityToPose, type CardCameraPose } from "./cameraPathPose";
import { CARD_VIEWPORT } from "./cameraPathsApartment";

/** Total swing of the hover clip around the base angle. */
const ARC_DEG = 16;
/** Raised "dollhouse" view: high enough to read the floor plan, low enough to read fronts. */
const ELEVATION_DEG = 30;
/** A single-wall run is turned off-axis so a side wall and the floor read as a room. */
const SINGLE_WALL_YAW_DEG = 32;
const FOV_DEG = 40;
/** Fit only the lived-in height, so a tall shell does not push the camera away. */
const FIT_HEIGHT_MM = 2400;
const FIT_PADDING = 1.02;

/** Empty shells have no run to look at: stand inside a corner and look across the room. */
const SHELL_INSET_MM = 350;
const SHELL_EYE_MM = 1650;
const SHELL_TARGET_MM = 1050;
const SHELL_FOV_DEG = 58;
const SHELL_ARC_DEG = 10;

type ArcResult = { pose: CardCameraPose; roomId: string; cameraId: string | null };

function rotateY(dir: { x: number; z: number }, radians: number) {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return { x: dir.x * cos - dir.z * sin, z: dir.x * sin + dir.z * cos };
}

function cardCamera(roomId: string, position: CardCameraPose["position"], target: CardCameraPose["target"], fov: number) {
  return { id: "card-capture-arc", roomId, name: "Card arc", position, target, fieldOfViewDegrees: fov, isDefault: false };
}

function shellCornerPose(roomId: string, room: CompiledSceneBounds, t: number): ArcResult {
  const position = {
    x: room.max.x - SHELL_INSET_MM,
    y: room.min.y + SHELL_EYE_MM,
    z: room.max.z - SHELL_INSET_MM,
  };
  const toCentre = { x: room.center.x - position.x, z: room.center.z - position.z };
  const reach = Math.hypot(toCentre.x, toCentre.z) || 1;
  const look = rotateY({ x: toCentre.x / reach, z: toCentre.z / reach }, ((t - 0.5) * SHELL_ARC_DEG * Math.PI) / 180);
  const target = {
    x: position.x + look.x * reach,
    y: room.min.y + SHELL_TARGET_MM,
    z: position.z + look.z * reach,
  };
  return { pose: cameraEntityToPose(cardCamera(roomId, position, target, SHELL_FOV_DEG)), roomId, cameraId: null };
}

/**
 * Card camera for a single room: a raised three-quarter view from the open side
 * of the cabinet run, framed on the whole room. Walls without cabinets are cut
 * away by the client presentation, so the camera can stand outside them.
 */
export function roomArcPose(project: InteriorProject, sceneFor: RoomSceneLookup, t: number): ArcResult {
  const roomId = project.activeRoomId ?? project.rooms[0]!.id;
  const scene = sceneFor(roomId);
  const room = scene.bounds;
  const run = resolveCabinetRunFrame(scene, CARD_VIEWPORT, { audience: "client" });
  if (!run) return shellCornerPose(roomId, room, t);

  const away = { x: run.position.x - run.target.x, z: run.position.z - run.target.z };
  const length = Math.hypot(away.x, away.z) || 1;
  const yaw = run.runSides.size <= 1 ? SINGLE_WALL_YAW_DEG : 0;
  const angle = ((yaw + (t - 0.5) * ARC_DEG) * Math.PI) / 180;
  const flat = rotateY({ x: away.x / length, z: away.z / length }, angle);
  const elevation = (ELEVATION_DEG * Math.PI) / 180;
  const direction = { x: flat.x * Math.cos(elevation), y: Math.sin(elevation), z: flat.z * Math.cos(elevation) };

  const fitMax = { ...room.max, y: Math.min(room.max.y, room.min.y + FIT_HEIGHT_MM) };
  const target = { x: room.center.x, y: (room.min.y + fitMax.y) / 2, z: room.center.z };
  const distance = aabbFitDistanceMm({
    min: room.min,
    max: fitMax,
    viewFromTarget: direction,
    fovDegrees: FOV_DEG,
    aspect: CARD_VIEWPORT.widthPx / CARD_VIEWPORT.heightPx,
    padding: FIT_PADDING,
  });
  const position = offsetFromTargetMm(target, direction, distance);
  return { pose: cameraEntityToPose(cardCamera(roomId, position, target, FOV_DEG)), roomId, cameraId: null };
}
