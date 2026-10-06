import type { RenderQuality } from "../interiorProject";

/**
 * The whole-apartment view opens in Draft (Model View's own default): an
 * overhead view of every room does not need per-model shadows, and Standard
 * missed the 33 ms orbit budget on the 3 BHK. A quality picked while in the
 * overview lasts until leaving; leaving restores the room view's quality.
 */
export const OVERVIEW_DEFAULT_QUALITY: RenderQuality = "draft";

export type OverviewQualityStep = {
  /** Quality to set now, or null to leave it alone. */
  set: RenderQuality | null;
  /** Room-view quality to restore on leaving (null when not in the overview). */
  saved: RenderQuality | null;
};

export function overviewQualityStep(
  showApartment: boolean,
  current: RenderQuality,
  saved: RenderQuality | null,
): OverviewQualityStep {
  if (showApartment && saved === null) {
    return { set: current === OVERVIEW_DEFAULT_QUALITY ? null : OVERVIEW_DEFAULT_QUALITY, saved: current };
  }
  if (!showApartment && saved !== null) {
    return { set: current === saved ? null : saved, saved: null };
  }
  return { set: null, saved };
}
