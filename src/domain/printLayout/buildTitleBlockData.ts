import type { CabinetProject } from "../cabinetDimensions";
import {
  clampJobMeta,
  formatJobSubtitle,
  formatJobTitle,
  JOB_STATUS_LABELS,
} from "../jobMeta";
import type { TechnicalViewOptions } from "../technicalViews/types";
import type { TitleBlockData } from "./types";

function formatSheetDate(iso?: string) {
  const source = iso ? new Date(iso) : new Date();
  if (Number.isNaN(source.getTime())) {
    return new Date().toLocaleDateString();
  }
  return source.toLocaleDateString();
}

export function buildTitleBlockData(args: {
  project: CabinetProject;
  options?: TechnicalViewOptions;
  sheetTitle: string;
  viewLabel: string;
  scaleText: string;
  sheetCode: string;
  drawnBy?: string;
  checkedBy?: string;
}): TitleBlockData {
  const job = clampJobMeta(args.project.job);
  const projectName =
    args.options?.projectName?.trim() ||
    formatJobTitle(job, "Cabinet Project") ||
    "Cabinet Project";
  return {
    projectName,
    sheetTitle: args.options?.title?.trim() || args.sheetTitle,
    viewLabel: args.viewLabel,
    sheetCode: args.options?.sheetCode?.trim() || args.sheetCode,
    scaleText: args.scaleText,
    projectNumber: job.projectNumber || "—",
    customerName: job.customerName || "—",
    revision: job.revision || "A",
    statusLabel: JOB_STATUS_LABELS[job.status],
    dateText: formatSheetDate(job.updatedAt),
    drawnBy: args.drawnBy?.trim() || "Designer",
    checkedBy: args.checkedBy?.trim() || "—",
    metaLine:
      args.options?.sheetMeta?.trim() ||
      `${formatJobSubtitle(job)} · ${JOB_STATUS_LABELS[job.status]}`,
  };
}
