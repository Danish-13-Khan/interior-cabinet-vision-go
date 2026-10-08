import type { PlanGuide } from "./planGuides";

/** The automatic site centre line is a fallback for plans without guides. */
export function shouldShowAutoCenterLine(guides: readonly PlanGuide[], showCenterLine: boolean | undefined): boolean {
  return showCenterLine !== false && guides.length === 0;
}
