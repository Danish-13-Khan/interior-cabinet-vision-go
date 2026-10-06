import { supportsShelves } from "../cabinetCapabilities";
import type { CabinetConfig } from "../cabinetDimensions";
import { resolveCabinetMaterialSpec } from "../materialSystem";
import { getMaxUnsupportedShelfSpanMm } from "./limits";

/** Fewest vertical dividers that keep every shelf span within 90 % of the material limit. */
export function getMinDividersForShelfSpan(config: CabinetConfig): number {
  const current = config.composition?.dividers?.count ?? 0;
  if (!supportsShelves(config.type) || config.shelfCount <= 0 || config.type === "corner") {
    return current;
  }
  const materialSpec = resolveCabinetMaterialSpec(config.buildRules);
  const openingWidth = Math.max(
    0,
    config.dimensions.width - config.dimensions.boardThickness * 2,
  );
  const maxSpan = getMaxUnsupportedShelfSpanMm(
    materialSpec.shelfMaterial.thicknessMm,
    materialSpec.shelfMaterial.boardMaterialId,
  );
  // Design to the advisory threshold as well as the hard structural limit.
  // A default cabinet should not arrive in Engineering already within 10% of
  // its material limit; that margin is reserved for intentional overrides.
  const preferredSpan = maxSpan * 0.9;
  if (maxSpan <= 0 || openingWidth <= preferredSpan) {
    return current;
  }
  const needed = Math.ceil(openingWidth / preferredSpan) - 1;
  return Math.max(current, needed);
}
