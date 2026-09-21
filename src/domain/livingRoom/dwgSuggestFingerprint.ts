import type { LivingRoomPlanUnderlay } from "./planUnderlay";
import type { DwgSuggestPlanRegion } from "./dwgSuggestSelection";

/** Pose, scale, layers, and region that locate candidate centerlines. */
export function dwgSuggestGeometryFingerprint(
  underlay: LivingRoomPlanUnderlay | null,
  layers: readonly string[],
  region: DwgSuggestPlanRegion | null,
): string {
  const hidden = [...(underlay?.dwg?.hiddenLayers ?? [])].sort().join(",");
  const selected = [...layers].sort().join(",");
  const box = region
    ? `${region.minX},${region.minZ},${region.maxX},${region.maxZ}`
    : "";
  return [
    underlay?.fileName ?? "",
    underlay?.widthMm ?? "",
    underlay?.heightMm ?? "",
    underlay?.xMm ?? 0,
    underlay?.zMm ?? 0,
    underlay?.rotationDeg ?? 0,
    underlay?.calibrated ? 1 : 0,
    hidden,
    selected,
    box,
  ].join("|");
}
