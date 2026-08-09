import type { CabinetConfig } from "../cabinetDimensions";
import { DEFAULT_BUILD_RULES } from "../materialSystem";
import type { ProjectStandards } from "../projectStandards";
import type { PropertyFieldIssue } from "./types";
import { compositionOf } from "./helpers";

export type StandardsConflict = {
  fieldId: string;
  message: string;
  cabinetValue: string | number;
  standardsValue: string | number;
};

/** Diff selected cabinet materials / toe kick against project standards. */
export function diffCabinetVsProjectStandards(
  config: CabinetConfig,
  standards: ProjectStandards,
): StandardsConflict[] {
  const rules = { ...DEFAULT_BUILD_RULES, ...(config.buildRules ?? {}) };
  const conflicts: StandardsConflict[] = [];

  function push(
    fieldId: string,
    label: string,
    cabinetValue: string | number,
    standardsValue: string | number,
  ) {
    if (cabinetValue === standardsValue) return;
    conflicts.push({
      fieldId,
      cabinetValue,
      standardsValue,
      message: `${label} differs from project standards (${standardsValue})`,
    });
  }

  push(
    "materialPreset",
    "Material",
    rules.materialPresetId,
    standards.materialPresetId,
  );
  push("finishId", "Finish", rules.finishId, standards.finishId);
  push(
    "edgeBandingId",
    "Edge banding",
    rules.edgeBandingId,
    standards.edgeBandingId,
  );
  push(
    "carcassThicknessMm",
    "Carcass thickness",
    rules.carcassThicknessMm,
    standards.carcassThicknessMm,
  );
  push(
    "backPanelThicknessMm",
    "Back thickness",
    rules.backPanelThicknessMm,
    standards.backPanelThicknessMm,
  );
  push(
    "shelfThicknessMm",
    "Shelf thickness",
    rules.shelfThicknessMm,
    standards.shelfThicknessMm,
  );
  push(
    "drawerBoxThicknessMm",
    "Drawer box thickness",
    rules.drawerBoxThicknessMm,
    standards.drawerBoxThicknessMm,
  );

  const toe = compositionOf(config).toeKick;
  if (toe.enabled) {
    push(
      "toeKickHeight",
      "Toe kick height",
      toe.heightMm,
      standards.toeKickHeightMm,
    );
    push(
      "toeKickInset",
      "Toe kick inset",
      toe.insetMm,
      standards.toeKickInsetMm,
    );
  }

  return conflicts;
}

export function standardsConflictsAsFieldIssues(
  conflicts: StandardsConflict[],
): Record<string, PropertyFieldIssue[]> {
  const map: Record<string, PropertyFieldIssue[]> = {};
  for (const conflict of conflicts) {
    const list = map[conflict.fieldId] ?? [];
    list.push({
      severity: "info",
      message: conflict.message,
      code: "STANDARDS_DIFF",
    });
    map[conflict.fieldId] = list;
  }
  return map;
}
