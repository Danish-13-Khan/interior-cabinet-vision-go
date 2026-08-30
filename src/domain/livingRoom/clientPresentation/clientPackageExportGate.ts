import type { LivingRoomPlanIssue } from "../planConstraints";
import {
  buildPreExportChecklist,
  isPreExportBlocked,
} from "./preExportChecklist";

/** Shared gate for Review + Render Studio — derived from the L3 checklist. */
export function isClientPackageExportBlocked(
  issues: LivingRoomPlanIssue[],
  readyToExport: boolean,
  extras: {
    millworkCount?: number;
    packageDeckCount?: number;
    acceptedStillCount?: number;
    geometryFallbackIds?: string[];
  } = {},
): boolean {
  return isPreExportBlocked(
    buildPreExportChecklist({
      issues,
      millworkCount: extras.millworkCount ?? (readyToExport ? 1 : 0),
      packageDeckCount: extras.packageDeckCount ?? 0,
      acceptedStillCount: extras.acceptedStillCount ?? 0,
      geometryFallbackIds: extras.geometryFallbackIds,
    }),
  );
}
