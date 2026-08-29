import type { InteriorProject } from "../../interiorProject";
import type { LivingRoomPlanIssue } from "../planConstraints";
import { isBlockingLivingRoomPlanIssue } from "../planConstraints";
import { resolvePackageCameraViews } from "../packageCameraBookmarks";

export type PreExportCheckStatus = "pass" | "fail" | "warn";

export type PreExportCheckItem = {
  id: "layout-clear" | "millwork-placed" | "package-deck" | "accepted-stills" | "layout-advisories";
  label: string;
  detail: string;
  status: PreExportCheckStatus;
  blocking: boolean;
  objectIds: string[];
};

export type PreExportChecklist = {
  items: PreExportCheckItem[];
  blockingFailCount: number;
  warnCount: number;
  ready: boolean;
};

export type PreExportChecklistInput = {
  issues: LivingRoomPlanIssue[];
  millworkCount: number;
  packageDeckCount: number;
  acceptedStillCount: number;
};

function uniqueIds(ids: string[]) {
  return [...new Set(ids.filter(Boolean))];
}

/** Deck views that survive package assembly (stale camera bookmarks dropped). */
export function countResolvedPackageDeckViews(project: InteriorProject): number {
  return resolvePackageCameraViews(
    project.renderSettings.packageCameraBookmarks,
    project.cameras,
  ).length;
}

/** Explicit Review checklist so broken layouts cannot export silently. */
export function buildPreExportChecklist(input: PreExportChecklistInput): PreExportChecklist {
  const blocking = input.issues.filter(isBlockingLivingRoomPlanIssue);
  const advisories = input.issues.filter((issue) => !isBlockingLivingRoomPlanIssue(issue));
  const millworkReady = input.millworkCount > 0;

  const items: PreExportCheckItem[] = [
    {
      id: "layout-clear",
      label: "Layout clear",
      detail: blocking.length
        ? `${blocking.length} blocking conflict${blocking.length === 1 ? "" : "s"}`
        : "No overlaps or out-of-room cabinets",
      status: blocking.length ? "fail" : "pass",
      blocking: true,
      objectIds: uniqueIds(blocking.flatMap((issue) => issue.objectIds)),
    },
    {
      id: "millwork-placed",
      label: "Millwork placed",
      detail: millworkReady
        ? `${input.millworkCount} cabinet piece${input.millworkCount === 1 ? "" : "s"}`
        : "Add a TV unit, bookcase, or cabinet",
      status: millworkReady ? "pass" : "fail",
      blocking: true,
      objectIds: [],
    },
    {
      id: "package-deck",
      label: "Package camera deck",
      detail: input.packageDeckCount
        ? `${input.packageDeckCount} named view${input.packageDeckCount === 1 ? "" : "s"}`
        : "Bookmark at least one camera for the client deck",
      status: input.packageDeckCount ? "pass" : "warn",
      blocking: false,
      objectIds: [],
    },
    {
      id: "accepted-stills",
      label: "Accepted stills",
      detail: input.acceptedStillCount
        ? `${input.acceptedStillCount} accepted for package`
        : "Optional · generate and accept a hybrid still",
      status: input.acceptedStillCount ? "pass" : "warn",
      blocking: false,
      objectIds: [],
    },
    {
      id: "layout-advisories",
      label: "Layout advisories",
      detail: advisories.length
        ? `${advisories.length} clearance note${advisories.length === 1 ? "" : "s"}`
        : "No clearance advisories",
      status: advisories.length ? "warn" : "pass",
      blocking: false,
      objectIds: uniqueIds(advisories.flatMap((issue) => issue.objectIds)),
    },
  ];

  const blockingFailCount = items.filter((item) => item.blocking && item.status === "fail").length;
  const warnCount = items.filter((item) => item.status === "warn").length;
  return {
    items,
    blockingFailCount,
    warnCount,
    ready: blockingFailCount === 0,
  };
}

export function isPreExportBlocked(checklist: PreExportChecklist): boolean {
  return !checklist.ready;
}
