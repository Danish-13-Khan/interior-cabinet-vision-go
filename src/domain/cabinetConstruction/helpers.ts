import type { CabinetDimensions } from "../cabinetDimensions";
import type { GrainDirection } from "../materialSystem";
import { DOOR_GAP, type DoorMount } from "../cabinetConstructionSpec";
import type { CabinetPart, PartCategory } from "./types";

export function createPart(
  id: string,
  label: string,
  category: PartCategory,
  quantity: number,
  lengthMm: number,
  widthMm: number,
  thicknessMm: number,
  grain: GrainDirection,
  materialLabel: string,
  finishLabel: string,
  edgeBandingLabel: string,
  notes?: string,
): CabinetPart {
  return {
    id,
    label,
    category,
    quantity,
    lengthMm: Math.max(0, Math.round(lengthMm)),
    widthMm: Math.max(0, Math.round(widthMm)),
    thicknessMm: Math.max(1, Math.round(thicknessMm)),
    grain,
    materialLabel,
    finishLabel,
    edgeBandingLabel,
    notes,
  };
}

export function getInnerMeasurements(dimensions: CabinetDimensions) {
  const innerWidth = dimensions.width - dimensions.boardThickness * 2;
  const innerHeight = dimensions.height - dimensions.boardThickness * 2;
  const innerDepth = dimensions.depth - dimensions.backPanelThickness;

  return {
    innerWidth,
    innerHeight,
    innerDepth,
  };
}

export function doorFrontSize(
  mount: DoorMount,
  cabinetWidth: number,
  cabinetHeight: number,
  toeKickHeight: number,
  doorQty: number,
  faceInsetWidthMm: number,
  faceInsetHeightMm: number,
) {
  const gaps = DOOR_GAP[mount];
  if (mount === "inset") {
    const width =
      doorQty === 1
        ? faceInsetWidthMm - gaps.sideMm * 2
        : (faceInsetWidthMm - gaps.sideMm * 2 - gaps.centerMm * (doorQty - 1)) / doorQty;
    const height = faceInsetHeightMm - gaps.bottomMm;
    return { width, height };
  }

  const width =
    doorQty === 1
      ? cabinetWidth - gaps.sideMm * 2
      : (cabinetWidth - gaps.sideMm * 2 - gaps.centerMm * (doorQty - 1)) / doorQty;
  const height = cabinetHeight - toeKickHeight - gaps.bottomMm;
  return { width, height };
}
