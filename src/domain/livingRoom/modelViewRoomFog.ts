import type { CompiledSceneBounds } from "./sceneTypes";

/** Eye is inside the shell, so distance fog would grey the room the camera is in. */
export function cameraInsideRoomMeters(
  camera: { x: number; y: number; z: number },
  bounds: CompiledSceneBounds,
  padMeters = 0.2,
): boolean {
  const minX = bounds.min.x / 1000 - padMeters;
  const maxX = bounds.max.x / 1000 + padMeters;
  const minY = bounds.min.y / 1000 - padMeters;
  const maxY = bounds.max.y / 1000 + padMeters;
  const minZ = bounds.min.z / 1000 - padMeters;
  const maxZ = bounds.max.z / 1000 + padMeters;
  return camera.x > minX && camera.x < maxX
    && camera.y > minY && camera.y < maxY
    && camera.z > minZ && camera.z < maxZ;
}
