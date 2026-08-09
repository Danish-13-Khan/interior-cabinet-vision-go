import type { CabinetConfig } from "../cabinetDimensions";
import {
  DEFAULT_BUILD_RULES,
  type CabinetBuildRules,
  type EdgeBandingId,
  type FinishId,
  type GrainDirection,
  type MaterialPresetId,
  type BackPanelType,
} from "../materialSystem";
import type { ProjectStandards } from "../projectStandards";
import type { PropertyFieldValue } from "./types";

function buildRulesOf(config: CabinetConfig): CabinetBuildRules {
  return { ...DEFAULT_BUILD_RULES, ...(config.buildRules ?? {}) };
}

function patchBuildRules(
  config: CabinetConfig,
  patch: Partial<CabinetBuildRules>,
): CabinetConfig {
  return {
    ...config,
    buildRules: {
      ...buildRulesOf(config),
      ...patch,
    },
  };
}

export function getMaterialsEditorValue(
  config: CabinetConfig,
  fieldId: string,
): PropertyFieldValue | null {
  const rules = buildRulesOf(config);
  switch (fieldId) {
    case "materialPreset":
      return rules.materialPresetId;
    case "finishId":
      return rules.finishId;
    case "edgeBandingId":
      return rules.edgeBandingId;
    case "grainDirection":
      return rules.grainDirection;
    case "backPanelType":
      return rules.backPanelType;
    case "carcassThicknessMm":
      return String(rules.carcassThicknessMm);
    case "backPanelThicknessMm":
      return String(rules.backPanelThicknessMm);
    case "shelfThicknessMm":
      return String(rules.shelfThicknessMm);
    case "drawerBoxThicknessMm":
      return String(rules.drawerBoxThicknessMm);
    case "applyProjectStandards":
      return false;
    default:
      return null;
  }
}

export function tryApplyMaterialsEditorChange(
  config: CabinetConfig,
  fieldId: string,
  value: PropertyFieldValue,
  standards?: ProjectStandards | null,
): CabinetConfig | null {
  switch (fieldId) {
    case "materialPreset":
      return patchBuildRules(config, {
        materialPresetId: String(value) as MaterialPresetId,
      });
    case "finishId":
      return patchBuildRules(config, {
        finishId: String(value) as FinishId,
      });
    case "edgeBandingId":
      return patchBuildRules(config, {
        edgeBandingId: String(value) as EdgeBandingId,
      });
    case "grainDirection":
      return patchBuildRules(config, {
        grainDirection: String(value) as GrainDirection,
      });
    case "backPanelType":
      return patchBuildRules(config, {
        backPanelType: String(value) as BackPanelType,
      });
    case "carcassThicknessMm":
      return patchBuildRules(config, {
        carcassThicknessMm: Number(value),
      });
    case "backPanelThicknessMm":
      return patchBuildRules(config, {
        backPanelThicknessMm: Number(value),
      });
    case "shelfThicknessMm":
      return patchBuildRules(config, {
        shelfThicknessMm: Number(value),
      });
    case "drawerBoxThicknessMm":
      return patchBuildRules(config, {
        drawerBoxThicknessMm: Number(value),
      });
    case "applyProjectStandards":
      if (!standards) return config;
      return patchBuildRules(config, {
        carcassThicknessMm: standards.carcassThicknessMm,
        backPanelThicknessMm: standards.backPanelThicknessMm,
        shelfThicknessMm: standards.shelfThicknessMm,
        drawerBoxThicknessMm: standards.drawerBoxThicknessMm,
        materialPresetId: standards.materialPresetId,
        finishId: standards.finishId,
        edgeBandingId: standards.edgeBandingId,
      });
    default:
      return null;
  }
}
