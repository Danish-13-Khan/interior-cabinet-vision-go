import type { ManufacturingIssue } from "../manufacturingRules";
import type { PropertyFieldIssue } from "./types";
import {
  diffCabinetVsProjectStandards,
  standardsConflictsAsFieldIssues,
} from "./standardsConflicts";
import type { CabinetConfig } from "../cabinetDimensions";
import type { ProjectStandards } from "../projectStandards";

/** Map manufacturing rule `field` names onto schema property field ids. */
const ISSUE_FIELD_ALIASES: Record<string, string[]> = {
  width: ["width"],
  height: ["height"],
  depth: ["depth"],
  shelfCount: ["shelfCount"],
  hasDoors: ["doorsEnabled", "doorStyle"],
  doors: ["doorsEnabled", "doorStyle", "doorCount"],
  drawerCount: ["drawerCount"],
  toeKickHeight: ["toeKickHeight", "toeKickEnabled"],
  toeKickInset: ["toeKickInset"],
  material: ["materialPreset", "finishId"],
  attachment: ["attachment"],
  backPanelThickness: ["backPanelThicknessMm", "backPanelType"],
  placementY: ["placementY"],
  openings: [
    "openingTree",
    "openingContentType",
    "openingRatio",
    "activeOpening",
    "splitVertical",
    "splitHorizontal",
  ],
};

export function mapManufacturingIssuesToFields(
  issues: ManufacturingIssue[],
): Record<string, PropertyFieldIssue[]> {
  const map: Record<string, PropertyFieldIssue[]> = {};

  for (const issue of issues) {
    if (issue.severity === "info") continue;
    const keys = issue.field
      ? (ISSUE_FIELD_ALIASES[issue.field] ?? [issue.field])
      : [];
    if (keys.length === 0) continue;

    const entry: PropertyFieldIssue = {
      severity: issue.severity,
      message: issue.message,
      code: issue.code,
    };
    for (const key of keys) {
      const list = map[key] ?? [];
      list.push(entry);
      map[key] = list;
    }
  }

  return map;
}

export function collectPropertyFieldIssues(
  config: CabinetConfig,
  manufacturingIssues: ManufacturingIssue[],
  standards?: ProjectStandards | null,
): Record<string, PropertyFieldIssue[]> {
  const map = mapManufacturingIssuesToFields(manufacturingIssues);
  if (!standards) return map;

  const standardsMap = standardsConflictsAsFieldIssues(
    diffCabinetVsProjectStandards(config, standards),
  );
  for (const [fieldId, issues] of Object.entries(standardsMap)) {
    map[fieldId] = [...(map[fieldId] ?? []), ...issues];
  }
  return map;
}

export function worstFieldSeverity(
  issues: PropertyFieldIssue[] | undefined,
): PropertyFieldIssue["severity"] | null {
  if (!issues || issues.length === 0) return null;
  if (issues.some((issue) => issue.severity === "error")) return "error";
  if (issues.some((issue) => issue.severity === "warning")) return "warning";
  return "info";
}
