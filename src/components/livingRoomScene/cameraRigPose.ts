import type { Camera, OrthographicCamera, PerspectiveCamera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CompiledLivingRoomScene } from "../../domain/livingRoom";

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
