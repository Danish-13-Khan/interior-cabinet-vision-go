import type { Camera, OrthographicCamera, PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CompiledLivingRoomScene } from "../../domain/livingRoom";
import {
  easeInOutCubic,
  lerpNumber,
  lerpPoint3,
  MODEL_VIEW_CAMERA_EASE_MS,
} from "../../domain/livingRoom/modelViewCameraEase";
import {
  cameraClearsWallVolume,
  projectedRoomCoverage,
} from "../../domain/livingRoom/modelViewExteriorFrame";
import type { CompiledSceneBounds } from "../../domain/livingRoom/sceneTypes";

export type CameraPoseMeters = {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fieldOfViewDegrees?: number;
  orthographicZoom?: number;
  orthographic: boolean;
};

export function mmToMeters(valueMm: number) {
  return valueMm / 1000;
}

export function applyCameraPose(
  camera: Camera,
  controls: OrbitControlsImpl | null,
  pose: CameraPoseMeters,
) {
  camera.position.set(pose.position.x, pose.position.y, pose.position.z);
  if (pose.orthographic) {
    const ortho = camera as OrthographicCamera;
    if (typeof pose.orthographicZoom === "number") ortho.zoom = pose.orthographicZoom;
    ortho.updateProjectionMatrix();
  } else if (typeof pose.fieldOfViewDegrees === "number") {
    const perspective = camera as PerspectiveCamera;
    perspective.fov = pose.fieldOfViewDegrees;
    perspective.updateProjectionMatrix();
  }
  camera.lookAt(pose.target.x, pose.target.y, pose.target.z);
  camera.updateMatrixWorld();
  if (controls) {
    controls.target.set(pose.target.x, pose.target.y, pose.target.z);
    controls.update();
  }
}

export function readCameraPoseMeters(
  camera: Camera,
  controls: OrbitControlsImpl | null,
  orthographic: boolean,
): CameraPoseMeters {
  const perspective = camera as PerspectiveCamera;
  const ortho = camera as OrthographicCamera;
  return {
    position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
    target: controls
      ? { x: controls.target.x, y: controls.target.y, z: controls.target.z }
      : { x: 0, y: 0, z: 0 },
    fieldOfViewDegrees: orthographic ? undefined : perspective.fov,
    orthographicZoom: orthographic ? ortho.zoom : undefined,
    orthographic,
  };
}

export function stampFrameMetrics(
  canvas: HTMLCanvasElement,
  bounds: CompiledSceneBounds,
  goal: CameraPoseMeters,
  viewport: { widthPx: number; heightPx: number },
  walkthrough: boolean,
) {
  const position = {
    x: goal.position.x * 1000, y: goal.position.y * 1000, z: goal.position.z * 1000,
  };
  const target = { x: goal.target.x * 1000, y: goal.target.y * 1000, z: goal.target.z * 1000 };
  const coverage = projectedRoomCoverage({
    bounds, position, target,
    fovDegrees: goal.fieldOfViewDegrees ?? 42,
    widthPx: viewport.widthPx,
    heightPx: viewport.heightPx,
    orthographicZoom: goal.orthographicZoom,
  });
  canvas.dataset.frameCoverage = coverage.area.toFixed(3);
  canvas.dataset.frameSpan = Math.max(coverage.width, coverage.height).toFixed(3);
  canvas.dataset.cameraOutside = cameraClearsWallVolume(bounds, position, walkthrough) ? "1" : "0";
  canvas.dataset.cameraX = goal.position.x.toFixed(3);
  canvas.dataset.cameraY = goal.position.y.toFixed(3);
  canvas.dataset.cameraZ = goal.position.z.toFixed(3);
  canvas.dataset.frameSettled = "1";
}

export function markCameraFrameUnsettled(canvas: HTMLCanvasElement) {
  canvas.dataset.frameSettled = "0";
}

export function publishLiveCameraFrame(
  canvas: HTMLCanvasElement,
  bounds: CompiledSceneBounds,
  camera: Camera,
  controls: OrbitControlsImpl | null,
  orthographic: boolean,
  viewport: { widthPx: number; heightPx: number },
  walkthrough: boolean,
) {
  const pose = readCameraPoseMeters(camera, controls, orthographic);
  stampFrameMetrics(canvas, bounds, pose, viewport, walkthrough);
}

export function easeTowardCameraGoal(
  from: CameraPoseMeters,
  goal: CameraPoseMeters,
  elapsedMs: number,
): { pose: CameraPoseMeters; settled: boolean } {
  const t = easeInOutCubic(elapsedMs / MODEL_VIEW_CAMERA_EASE_MS);
  const blend = (left: number | undefined, right: number | undefined) => (
    left !== undefined && right !== undefined ? lerpNumber(left, right, t) : right
  );
  return {
    settled: t >= 1,
    pose: {
      position: lerpPoint3(from.position, goal.position, t),
      target: lerpPoint3(from.target, goal.target, t),
      fieldOfViewDegrees: blend(from.fieldOfViewDegrees, goal.fieldOfViewDegrees),
      orthographicZoom: blend(from.orthographicZoom, goal.orthographicZoom),
      orthographic: goal.orthographic,
    },
  };
}

export function fallbackFraming(scene: CompiledLivingRoomScene) {
  const { center, size } = scene.bounds;
  const distance = Math.max(size.widthMm, size.depthMm, size.heightMm) * 1.05;
  return {
    position: {
      x: center.x + distance,
      y: center.y + distance * 0.55,
      z: center.z + distance,
    },
    target: center,
    fieldOfViewDegrees: undefined as number | undefined,
    spanMm: Math.max(size.widthMm, size.depthMm, size.heightMm),
  };
}
