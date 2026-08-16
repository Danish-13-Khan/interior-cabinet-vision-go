import type { CameraEntity } from "../interiorProject";

/**
 * Prefer a full-room establishing camera for Model entry.
 * TV Wall stays available in the camera menu for millwork close-ups.
 */
export function preferModelViewCameraId(
  cameras: readonly CameraEntity[],
): string | null {
  const wide = cameras.find((camera) => /wide\s*room/i.test(camera.name));
  if (wide) return wide.id;
  const defaulted = cameras.find((camera) => camera.isDefault);
  return defaulted?.id ?? cameras[0]?.id ?? null;
}
