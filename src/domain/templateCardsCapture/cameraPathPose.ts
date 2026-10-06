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

/**
 * Overview-to-room glide that never passes through a wall: the camera moves
 * across early (ease-out) and comes down late (ease-in), so it is over the
 * room before it drops below wall height. The target follows the camera across.
 */
export function glideCameraPoses(from: CardCameraPose, to: CardCameraPose, t: number): CardCameraPose {
  const across = 1 - (1 - t) ** 2;
  const down = t * t;
  const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
  return {
    position: {
      x: lerp(from.position.x, to.position.x, across),
      y: lerp(from.position.y, to.position.y, down),
      z: lerp(from.position.z, to.position.z, across),
    },
    target: {
      x: lerp(from.target.x, to.target.x, across),
      y: lerp(from.target.y, to.target.y, across),
      z: lerp(from.target.z, to.target.z, across),
    },
    fieldOfViewDegrees: lerp(from.fieldOfViewDegrees ?? 42, to.fieldOfViewDegrees ?? 42, t),
    orthographic: false,
  };
}
