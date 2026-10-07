import {
  projectAabbToScreen,
  screenBoundsInsideFrame,
  type CameraPoseMm,
  type ScreenBounds,
} from "../livingRoom/cameraScreenBounds";
import type { AabbMm } from "../livingRoom/sceneNodeBounds";

/** Proposal stills and Present captures. */
export const JOINERY_FRAME_ASPECT = 16 / 9;
/** Every cabinet corner stays this far (NDC) inside the frame. */
export const JOINERY_FRAME_MARGIN = 0.1;

/**
 * Screen bounds of several boxes together. An L-shaped run is judged by its
 * cabinets, not by the empty quadrant of their common bounding box.
 */
export function projectBoxes(pose: CameraPoseMm, aspect: number, boxes: readonly AabbMm[]): ScreenBounds {
  const merged: ScreenBounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, inFront: true };
  for (const box of boxes) {
    const bounds = projectAabbToScreen(pose, aspect, box);
    merged.minX = Math.min(merged.minX, bounds.minX);
    merged.maxX = Math.max(merged.maxX, bounds.maxX);
    merged.minY = Math.min(merged.minY, bounds.minY);
    merged.maxY = Math.max(merged.maxY, bounds.maxY);
    merged.inFront &&= bounds.inFront;
  }
  return merged;
}

/** True when every cabinet projects inside the frame with the D2 margin. */
export function joineryInsideFrame(
  pose: CameraPoseMm,
  boxes: readonly AabbMm[],
  aspect: number = JOINERY_FRAME_ASPECT,
): boolean {
  return screenBoundsInsideFrame(projectBoxes(pose, aspect, boxes), JOINERY_FRAME_MARGIN);
}
