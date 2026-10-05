import { supportsDoors, supportsDrawers, type CabinetConfig } from "../cabinetDimensions";
import { DOOR_GAP, normalizeConstructionSpec, type DoorMount } from "../cabinetConstructionSpec";
import { layoutCabinetElevationFace, type OpeningFaceRect } from "../openingLayout";

export type FrontGapSpec = { sideMm: number; centerMm: number; bottomMm: number; topMm: number };

/** Fronts sit flush with the carcass top; the worktop / next unit provides the top reveal. */
export function frontGapSpec(mount: DoorMount): FrontGapSpec {
  return { ...DOOR_GAP[mount], topMm: 0 };
}

/** Same origin as `OpeningFaceRect`: bottom-left of the face (after left filler, above toe kick), mm. */
export type FrontLeaf = { xMm: number; yMm: number; widthMm: number; heightMm: number };

export type ResolvedOpeningFronts = {
  opening: OpeningFaceRect;
  kind: "door" | "drawer";
  leaves: FrontLeaf[];
};

export type ResolvedFronts = {
  mount: DoorMount;
  gaps: FrontGapSpec;
  openings: ResolvedOpeningFronts[];
};

function splitRow(xMm: number, yMm: number, spanMm: number, heightMm: number, count: number, gaps: FrontGapSpec): FrontLeaf[] {
  const widthMm = (spanMm - gaps.sideMm * 2 - gaps.centerMm * (count - 1)) / count;
  return Array.from({ length: count }, (_, index) => ({
    xMm: xMm + gaps.sideMm + index * (widthMm + gaps.centerMm),
    yMm,
    widthMm,
    heightMm,
  }));
}

/** A single full-face door follows the mount: overlay covers the carcass, inset sits in the face opening. */
function fullFaceDoorRow(config: CabinetConfig, mount: DoorMount, gaps: FrontGapSpec, count: number, leftFillerMm: number) {
  const { width, height, boardThickness } = config.dimensions;
  const toeKick = config.toeKickHeight;
  if (mount !== "inset") {
    return splitRow(-leftFillerMm, gaps.bottomMm, width, height - toeKick - gaps.bottomMm - gaps.topMm, count, gaps);
  }
  const spec = normalizeConstructionSpec(config.type, config.construction);
  const faceFrame = spec.carcassStyle === "face-frame";
  const stile = faceFrame ? spec.faceFrame.stileWidthMm : boardThickness;
  const rail = faceFrame ? spec.faceFrame.railWidthMm : boardThickness;
  const openingWidth = faceFrame ? Math.max(120, width - stile * 2) : width - boardThickness * 2;
  const openingHeight = Math.max(120, height - toeKick - rail * 2);
  return splitRow(stile - leftFillerMm, rail + gaps.bottomMm, openingWidth, openingHeight - gaps.bottomMm - gaps.topMm, count, gaps);
}

function drawerColumn(opening: OpeningFaceRect, gaps: FrontGapSpec): FrontLeaf[] {
  const count = Math.max(1, opening.drawerCount);
  const available = opening.heightMm - gaps.bottomMm - gaps.topMm - (count - 1) * gaps.centerMm;
  const ratios = opening.drawerRatios?.length === count
    ? opening.drawerRatios
    : Array.from({ length: count }, () => 1 / count);
  let cursor = opening.yMm + gaps.bottomMm;
  return ratios.map((ratio) => {
    const leaf = {
      xMm: opening.xMm + gaps.sideMm,
      yMm: cursor,
      widthMm: opening.widthMm - gaps.sideMm * 2,
      heightMm: available * ratio,
    };
    cursor += leaf.heightMm + gaps.centerMm;
    return leaf;
  });
}

/**
 * The one front-gap rule. Production parts, the 3D model, the legacy cut list
 * and elevations all size doors and drawer fronts from this.
 */
export function resolveFrontGaps(config: CabinetConfig): ResolvedFronts {
  const mount = normalizeConstructionSpec(config.type, config.construction).doorMount;
  const gaps = frontGapSpec(mount);
  const face = layoutCabinetElevationFace(config);
  const openings: ResolvedOpeningFronts[] = [];
  for (const opening of face.openings) {
    if (opening.contentType === "door" && supportsDoors(config.type)) {
      const count = opening.doorStyle === "single" ? 1 : 2;
      const leaves = face.openings.length === 1
        ? fullFaceDoorRow(config, mount, gaps, count, face.leftFillerMm)
        : splitRow(opening.xMm, opening.yMm + gaps.bottomMm, opening.widthMm, opening.heightMm - gaps.bottomMm - gaps.topMm, count, gaps);
      openings.push({ opening, kind: "door", leaves });
    } else if (opening.contentType === "drawer-stack" && supportsDrawers(config.type)) {
      openings.push({ opening, kind: "drawer", leaves: drawerColumn(opening, gaps) });
    }
  }
  return { mount, gaps, openings };
}
