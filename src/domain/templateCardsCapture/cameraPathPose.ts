import type { CameraEntity } from "../interiorProject";

export type CardCameraPose = {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  fieldOfViewDegrees?: number;
  orthographic: boolean;
};

export function cameraEntityToPose(camera: CameraEntity): CardCameraPose {
  const m = (value: number) => value / 1000;
  return {
    position: { x: m(camera.position.x), y: m(camera.position.y), z: m(camera.position.z) },
    target: { x: m(camera.target.x), y: m(camera.target.y), z: m(camera.target.z) },
    fieldOfViewDegrees: camera.fieldOfViewDegrees,
    orthographic: false,
  };
}

export function blendCameraPoses(from: CardCameraPose, to: CardCameraPose, t: number): CardCameraPose {
  const lerp = (a: number, b: number) => a + (b - a) * t;
  return {
    position: {
      x: lerp(from.position.x, to.position.x),
      y: lerp(from.position.y, to.position.y),
      z: lerp(from.position.z, to.position.z),
    },
    target: {
      x: lerp(from.target.x, to.target.x),
      y: lerp(from.target.y, to.target.y),
      z: lerp(from.target.z, to.target.z),
    },
    fieldOfViewDegrees: lerp(from.fieldOfViewDegrees ?? 42, to.fieldOfViewDegrees ?? 42),
    orthographic: false,
  };
}
