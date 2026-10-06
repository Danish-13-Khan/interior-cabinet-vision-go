import { easeInOutCubic } from "../livingRoom/modelViewCameraEase";

/** Hover clip contract (D10): 4 s at 24 fps. */
export const CARD_CLIP_FPS = 24;
export const CARD_CLIP_FRAME_COUNT = 96;
export const CARD_CLIP_DURATION_MS = 4000;

const HOLD_FRAMES = CARD_CLIP_FPS * 0.5;

/**
 * Overview-to-hero frames whose `t` falls in this range are rendered in both
 * the apartment and the room scene and blended, so the scene swap at t = 0.5
 * reads as a dissolve instead of a cut.
 */
export const CARD_CLIP_CROSSFADE_T: readonly [number, number] = [0.3, 0.7];

export type CardClipPathKind = "overview-to-hero" | "room-arc";

/** Map frame index 0..95 to camera path parameter t in [0, 1]. */
export function clipPathParameter(kind: CardClipPathKind, frameIndex: number): number {
  const i = Math.min(CARD_CLIP_FRAME_COUNT - 1, Math.max(0, frameIndex));
  return kind === "overview-to-hero" ? apartmentOverviewToHeroT(i) : roomArcLoopT(i);
}

/**
 * 0.5 s on overview, 3 s glide, 0.5 s on hero (D5, Phase 3). The only easing
 * on this path: the camera path itself is linear in t.
 */
function apartmentOverviewToHeroT(frameIndex: number): number {
  const motionFrames = CARD_CLIP_FRAME_COUNT - 2 * HOLD_FRAMES;
  if (frameIndex < HOLD_FRAMES) return 0;
  if (frameIndex >= HOLD_FRAMES + motionFrames) return 1;
  const u = (frameIndex - HOLD_FRAMES) / motionFrames;
  return easeInOutCubic(u);
}

/**
 * One sine cycle around the middle of the arc. Frame 0 is t = 0.5, the
 * poster's pose, so hover starts on the picture already showing. It slows
 * into each turn, never repeats a frame back to back, and frame 96 would
 * equal frame 0, so the loop has no seam.
 */
function roomArcLoopT(frameIndex: number): number {
  return (1 + Math.sin((2 * Math.PI * frameIndex) / CARD_CLIP_FRAME_COUNT)) / 2;
}

/**
 * Weight of the room scene for a cross-faded frame (0 = all overview,
 * 1 = all room), or null when the frame renders one scene only.
 */
export function clipCrossfadeWeight(t: number): number | null {
  const [lo, hi] = CARD_CLIP_CROSSFADE_T;
  if (t <= lo || t >= hi) return null;
  const u = (t - lo) / (hi - lo);
  return u * u * (3 - 2 * u);
}
