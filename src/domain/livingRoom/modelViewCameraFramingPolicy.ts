/** When the orbit pose is user-owned vs when CameraRig may reframe. */

export type CameraFramingApplyInput = {
  orthoSwitched: boolean;
  intentChanged: boolean;
  userOwnedPose: boolean;
  userNavigating: boolean;
};

export function modelViewFramingIntentKey(parts: {
  activeCameraId: string | null | undefined;
  viewPreset: string | undefined;
  fitVersion: number;
  fitMode: string | undefined;
  cameraHeightMm: number | undefined;
  fieldOfViewDegrees: number | undefined;
  composition: string;
  renderMode: string;
  projectId: string;
  roomId: string;
  cameraFingerprint: string;
}): string {
  return [
    parts.activeCameraId ?? "",
    parts.viewPreset ?? "",
    String(parts.fitVersion),
    parts.fitMode ?? "",
    String(parts.cameraHeightMm ?? ""),
    String(parts.fieldOfViewDegrees ?? ""),
    parts.composition,
    parts.renderMode,
    parts.projectId,
    parts.roomId,
    parts.cameraFingerprint,
  ].join("|");
}

export function cameraPoseFingerprint(camera: {
  id: string;
  fieldOfViewDegrees?: number;
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
} | undefined): string {
  if (!camera) return "";
  return [
    camera.id,
    String(camera.fieldOfViewDegrees ?? ""),
    camera.position.x, camera.position.y, camera.position.z,
    camera.target.x, camera.target.y, camera.target.z,
  ].join(":");
}

/** Preset / camera / fit changes reframe; orbit ownership blocks asset/resize snaps. */
export function shouldApplyCameraFramingPose(input: CameraFramingApplyInput): boolean {
  if (input.orthoSwitched || input.intentChanged) return true;
  return !input.userOwnedPose && !input.userNavigating;
}

export function nextUserOwnedCameraPose(input: {
  intentChanged: boolean;
  userNavigating: boolean;
  orbitCancelled: boolean;
  wasOwned: boolean;
}): boolean {
  if (input.intentChanged) return false;
  return input.wasOwned || input.userNavigating || input.orbitCancelled;
}

/** Keep using the Fit pose on resize/load until a new camera intent or a new Fit. */
export function shouldHoldFitFraming(input: {
  applyFitShot: boolean;
  intentChanged: boolean;
  wasHoldingFit: boolean;
}): boolean {
  if (input.applyFitShot) return true;
  if (input.intentChanged) return false;
  return input.wasHoldingFit;
}
