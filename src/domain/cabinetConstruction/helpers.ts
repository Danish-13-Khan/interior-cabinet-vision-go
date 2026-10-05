import type { CabinetDimensions } from "../cabinetDimensions";
import type { GrainDirection } from "../materialSystem";
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
