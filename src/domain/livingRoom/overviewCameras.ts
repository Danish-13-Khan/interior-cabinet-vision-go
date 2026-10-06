import type { CameraEntity } from "../interiorProject";
import { aabbFitDistanceMm, offsetFromTargetMm } from "./modelViewFitDistance";
import type { CompiledLivingRoomScene, CompiledSceneBounds } from "./sceneTypes";

/** High corners of the plan, plus a top-down view. Framed on the union bounds. */
export const OVERVIEW_CORNERS = ["ne", "nw", "se", "sw", "top"] as const;
export type OverviewCorner = (typeof OVERVIEW_CORNERS)[number];

const DIRECTION: Record<OverviewCorner, { x: number; y: number; z: number }> = {
  ne: { x: 1, y: 0.85, z: 1 },
  nw: { x: -1, y: 0.85, z: 1 },
  se: { x: 1, y: 0.85, z: -1 },
  sw: { x: -1, y: 0.85, z: -1 },
  top: { x: 0.02, y: 1, z: 0.05 },
};

const CORNER_LABEL: Record<OverviewCorner, string> = {
  ne: "North-east",
  nw: "North-west",
  se: "South-east",
  sw: "South-west",
  top: "Top",
};

const FIELD_OF_VIEW = 42;
const FRAME_ASPECT = 1280 / 720;

export function apartmentOverviewAvailable(roomCount: number) {
  return roomCount >= 2;
}

export function overviewCameraId(corner: OverviewCorner) {
  return `apartment-overview-${corner}`;
}

export function overviewCornerLabel(corner: OverviewCorner) {
  return CORNER_LABEL[corner];
}

/** One authored camera. Model View shows it with the project-camera composition. */
export function overviewCornerCamera(
  bounds: CompiledSceneBounds,
  corner: OverviewCorner,
  roomId: string,
): CameraEntity {
  const direction = DIRECTION[corner];
  const target = {
    x: bounds.center.x,
    y: bounds.center.y + (corner === "top" ? 0 : bounds.size.heightMm * 0.08),
    z: bounds.center.z,
  };
  const distance = aabbFitDistanceMm({
    min: bounds.min,
    max: bounds.max,
    viewFromTarget: direction,
    fovDegrees: FIELD_OF_VIEW,
    aspect: FRAME_ASPECT,
    padding: corner === "top" ? 1.2 : 1.08,
  });
  return {
    id: overviewCameraId(corner),
    roomId,
    name: CORNER_LABEL[corner],
    position: offsetFromTargetMm(target, direction, distance),
    target,
    fieldOfViewDegrees: FIELD_OF_VIEW,
    isDefault: corner === "ne",
  };
}

export function sceneWithOverviewCameras(scene: CompiledLivingRoomScene): CompiledLivingRoomScene {
  return {
    ...scene,
    cameras: OVERVIEW_CORNERS.map((corner) => overviewCornerCamera(scene.bounds, corner, scene.roomId)),
  };
}
