import type { CameraEntity } from "../interiorProject";
import type { OverviewCorner } from "../livingRoom/overviewCameras";

type HeroTweak = {
  /** Scale camera offset from target (>1 pulls back). */
  pullBack?: number;
  /** Orbit the camera around its target, degrees (positive turns counter-clockwise seen from above). */
  yawDeg?: number;
  targetOffsetMm?: { x?: number; y?: number; z?: number };
  fovDelta?: number;
};

/**
 * Thumbnail-only tweaks applied after the tour hero camera is resolved; the
 * tour itself is unchanged. All relative to the authored camera, so they
 * follow the room wherever the plan places it.
 */
const HERO_TWEAKS: Record<string, HeroTweak> = {
  /**
   * The tour looks at the media wall from the far left, so the TV screen
   * crosses the display niche beside it (they stand 112 mm apart). Turning
   * toward the wall's normal separates them; moving in keeps the camera
   * inside the room, and a wider lens keeps the sofa in frame.
   */
  "2bhk": { yawDeg: -10, pullBack: 0.9, fovDelta: 2, targetOffsetMm: { y: 30 } },
};

/** Overview corner for the plan still; the default "ne" looks at the shaded faces of some plans. */
const PLAN_CORNERS: Record<string, OverviewCorner> = {};

export function planCornerFor(apartmentSlug: string): OverviewCorner {
  return PLAN_CORNERS[apartmentSlug] ?? "ne";
}

export function applyHeroCompositionOverride(camera: CameraEntity, apartmentSlug: string): CameraEntity {
  const tweak = HERO_TWEAKS[apartmentSlug];
  if (!tweak) return camera;
  const target = {
    x: camera.target.x + (tweak.targetOffsetMm?.x ?? 0),
    y: camera.target.y + (tweak.targetOffsetMm?.y ?? 0),
    z: camera.target.z + (tweak.targetOffsetMm?.z ?? 0),
  };
  const pull = tweak.pullBack ?? 1;
  const yaw = ((tweak.yawDeg ?? 0) * Math.PI) / 180;
  const dx = (camera.position.x - camera.target.x) * pull;
  const dz = (camera.position.z - camera.target.z) * pull;
  return {
    ...camera,
    target,
    position: {
      x: target.x + dx * Math.cos(yaw) - dz * Math.sin(yaw),
      y: camera.position.y,
      z: target.z + dx * Math.sin(yaw) + dz * Math.cos(yaw),
    },
    fieldOfViewDegrees: camera.fieldOfViewDegrees + (tweak.fovDelta ?? 0),
  };
}
