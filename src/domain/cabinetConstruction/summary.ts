import type { CabinetDimensions } from "../cabinetDimensions";
import { describeConstructionSpec } from "../cabinetConstructionSpec";
import { createCabinetConstruction } from "./createConstruction";
import type { CabinetConstruction } from "./types";

export function defaultConstruction(outerDims: CabinetDimensions): CabinetConstruction {
  return createCabinetConstruction({
    type: "base",
    dimensions: outerDims,
    shelfCount: 1,
    hasDoors: true,
    drawerCount: 0,
    toeKickHeight: 100,
    toeKickInset: 60,
    leftEndPanel: false,
    rightEndPanel: false,
  });
}

export function getConstructionFlatParts(construction: CabinetConstruction) {
  return construction.parts.map((part) => ({
    label: part.label,
    key: part.id,
    qty: part.quantity,
    lengthMm: part.lengthMm,
    widthMm: part.widthMm,
    thicknessMm: part.thicknessMm,
    grain: part.grain,
    category: part.category,
    material: part.materialLabel,
    finish: part.finishLabel,
    edgeBanding: part.edgeBandingLabel,
    notes: part.notes,
  }));
}

export function getConstructionSummary(construction: CabinetConstruction): string {
  return describeConstructionSpec(construction.constructionSpec);
}
