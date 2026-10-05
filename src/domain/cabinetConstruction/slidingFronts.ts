import type { CabinetConfig } from "../cabinetDimensions";
import {
  SLIDING_DEFAULTS,
  slidingLeafCount,
  slidingLeafWidth,
  type SlidingDoorSpec,
} from "../frontSystem/slidingDefaults";
import type { CabinetElevationFaceLayout } from "../openingLayout";
import type { FrontLeaf, ResolvedOpeningFronts } from "./frontGaps";

export const SLIDING_OPENING_ID = "sliding";

/** Track plane of a leaf: 0 = rear track, 1 = front track. Leaves alternate so neighbours pass. */
export function slidingPlaneForLeaf(index: number): 0 | 1 {
  return index % 2 === 0 ? 0 : 1;
}

/**
 * Sliding branch of the one front resolver (§3.4). The shutters cover the whole
 * carcass face (W × face height), so the door openings behind them get no fronts
 * of their own. Leaf count `clamp(ceil(W / max), 2, 3)` unless overridden; leaf
 * width `(W + overlap × (n − 1)) / n`; height = face height − height deduction.
 */
export function resolveSlidingFronts(
  config: CabinetConfig,
  face: CabinetElevationFaceLayout,
  spec: SlidingDoorSpec,
): ResolvedOpeningFronts | null {
  const doorOpening = face.openings.find((opening) => opening.contentType === "door");
  if (!doorOpening) return null;
  const widthMm = config.dimensions.width;
  const faceHeightMm = config.dimensions.height - config.toeKickHeight;
  const count = slidingLeafCount(widthMm, spec);
  const leafWidthMm = slidingLeafWidth(widthMm, count, spec.overlapMm);
  const heightMm = Math.max(120, faceHeightMm - SLIDING_DEFAULTS.heightDeductionMm);
  const yMm = (faceHeightMm - heightMm) / 2;
  const left = -face.leftFillerMm;
  const leaves: FrontLeaf[] = Array.from({ length: count }, (_, index) => ({
    xMm: left + index * (leafWidthMm - spec.overlapMm),
    yMm,
    widthMm: leafWidthMm,
    heightMm,
    slidingPlane: slidingPlaneForLeaf(index),
  }));
  return {
    opening: {
      ...doorOpening,
      id: SLIDING_OPENING_ID,
      label: "Sliding shutter",
      xMm: left,
      yMm: 0,
      widthMm,
      heightMm: faceHeightMm,
      doorStyle: "sliding",
    },
    kind: "door",
    leaves,
  };
}

/** Sliding leaves across resolved fronts (one roller set and one flush pull each). */
export function slidingLeaves(openings: ResolvedOpeningFronts[]): FrontLeaf[] {
  return openings.flatMap((entry) => entry.leaves.filter((leaf) => leaf.slidingPlane !== undefined));
}

const PULL_EDGE_INSET_MM = 40;

/** Flush pull x (face mm) on the edge of the leaf its neighbour never covers (3D and elevations). */
export function slidingPullXMm(leaf: FrontLeaf, index: number, count: number, overlapMm: number): number {
  if (index === count - 1) return leaf.xMm + leaf.widthMm - PULL_EDGE_INSET_MM;
  if (index === 0) return leaf.xMm + PULL_EDGE_INSET_MM;
  return leaf.xMm + overlapMm + PULL_EDGE_INSET_MM;
}
