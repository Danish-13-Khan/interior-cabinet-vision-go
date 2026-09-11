import type { RenderQuality } from "../interiorProject";

/** Phase G: idle GPU — Model View Canvas uses demand frameloop + invalidate. */
export const MODEL_VIEW_FRAMELOOP = "demand" as const;

/**
 * Adaptive DPR deferred — fixed Draft/Standard caps stay (Phase B).
 * Revisit only if large-room Standard fails the §8.4 p95 gate.
 */
export const MODEL_VIEW_ADAPTIVE_DPR = false as const;

/** Cap walkthrough frame deltas so demand-frameloop idle gaps cannot teleport. */
export const MODEL_VIEW_WALKTHROUGH_MAX_DELTA_S = 1 / 30;

export function clampWalkthroughMoveDelta(deltaSeconds: number): number {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return 0;
  return Math.min(deltaSeconds, MODEL_VIEW_WALKTHROUGH_MAX_DELTA_S);
}

/** Max simultaneous GLB map-casters in Model View Standard (Draft = 0). */
export function resolveModelViewMaxGlbCasters(
  quality: RenderQuality | null | undefined,
): number {
  return quality === "standard" ? 10 : 0;
}
