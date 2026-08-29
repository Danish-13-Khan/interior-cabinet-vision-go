import type { LivingRoomPlanIssue } from "../planConstraints";
import { isBlockingLivingRoomPlanIssue } from "../planConstraints";

/** Shared gate for Review + Render Studio client package export. */
export function isClientPackageExportBlocked(
  issues: LivingRoomPlanIssue[],
  readyToExport: boolean,
): boolean {
  return issues.some(isBlockingLivingRoomPlanIssue) || !readyToExport;
}
