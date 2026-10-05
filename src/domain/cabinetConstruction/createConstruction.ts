import type { CabinetConfig } from "../cabinetDimensions";
import { clampCabinetConfig } from "../cabinetDimensions";
import { resolveCabinetComposition } from "../cabinetComposition";
import { BACK_PANEL_RULES, resolveCabinetMaterialSpec } from "../materialSystem";
import { resolveCabinetBuildRules } from "./buildRules";
import {
  SHELF_PIN_SETBACK_MM,
  getCaseJoineryNote,
  normalizeConstructionSpec,
} from "../cabinetConstructionSpec";
import { getInnerMeasurements } from "./helpers";
import { appendCaseParts } from "./partsCase";
import { appendInteriorParts } from "./partsInterior";
import { appendExtraParts } from "./partsExtras";
import { appendGolaNotchNotes } from "./golaParts";
import type { ConstructionContext } from "./context";
import type { CabinetConstruction, CabinetPart } from "./types";

export function createCabinetConstruction(config: CabinetConfig): CabinetConstruction {
  const safeConfig = clampCabinetConfig(config);
  const buildRules = resolveCabinetBuildRules(safeConfig);
  const constructionSpec = normalizeConstructionSpec(
    safeConfig.type,
    safeConfig.construction,
    { shelvesAdjustable: resolveCabinetComposition(safeConfig).shelves.adjustable },
  );
  const materialSpec = resolveCabinetMaterialSpec(buildRules);
  const { dimensions } = safeConfig;
  const { innerWidth, innerHeight, innerDepth } = getInnerMeasurements(dimensions);
  const backRule = BACK_PANEL_RULES[buildRules.backPanelType];
  const rebateMm = buildRules.backPanelType === "grooved" ? backRule.rebateMm : 0;
  const backWidth = buildRules.backPanelType === "none" ? 0 : innerWidth + rebateMm;
  const backHeight = buildRules.backPanelType === "none"
    ? 0
    : innerHeight - (safeConfig.toeKickHeight > 0 ? safeConfig.toeKickHeight : 0) + rebateMm;
  const caseNote = getCaseJoineryNote(constructionSpec.caseJoinery);
  const shelfAdjustable = constructionSpec.shelfMount === "adjustable-pins";
  const shelfDepth = shelfAdjustable
    ? Math.max(80, innerDepth - SHELF_PIN_SETBACK_MM)
    : Math.max(80, innerDepth - (constructionSpec.shelfMount === "fixed-dado" ? 4 : 10));
  const faceFrameEnabled = constructionSpec.carcassStyle === "face-frame";
  const stile = constructionSpec.faceFrame.stileWidthMm;
  const rail = constructionSpec.faceFrame.railWidthMm;
  const parts: CabinetPart[] = [];

  const ctx: ConstructionContext = {
    safeConfig,
    buildRules,
    constructionSpec,
    materialSpec,
    dimensions,
    innerWidth,
    innerHeight,
    innerDepth,
    backRule,
    rebateMm,
    backWidth,
    backHeight,
    caseNote,
    shelfAdjustable,
    shelfDepth,
    faceFrameEnabled,
    stile,
    rail,
    parts,
  };

  appendCaseParts(ctx);
  appendInteriorParts(ctx);
  appendExtraParts(ctx);
  appendGolaNotchNotes(parts, safeConfig);

  return {
    buildRules,
    constructionSpec,
    parts,
  };
}
