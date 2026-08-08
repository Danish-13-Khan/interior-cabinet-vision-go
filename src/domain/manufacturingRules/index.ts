export type {
  ManufacturingSeverity,
  ManufacturingRuleCode,
  ManufacturingIssue,
  ManufacturingRuleContext,
  FamilyDimensionLimits,
} from "./types";

export {
  getFamilyDimensionLimits,
  getMaxUnsupportedShelfSpanMm,
} from "./limits";

export {
  evaluateCabinetRules,
  evaluateProjectRules,
  formatManufacturingIssues,
} from "./evaluate";

export {
  applyManufacturingFixes,
  applyWallMountPlacementFix,
  getMinDividersForShelfSpan,
} from "./fixes";
