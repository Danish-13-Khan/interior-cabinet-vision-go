import type { StillReviewSession, StillReviewStatus } from "./reviewMachine";

export function isStaleStillAcceptance(
  session: StillReviewSession,
  packageEligibleCount: number,
): boolean {
  return session.status === "accepted" && packageEligibleCount === 0;
}

export function stillReviewPanelStatusLabel(
  session: StillReviewSession,
  packageEligibleCount: number,
): string {
  if (isStaleStillAcceptance(session, packageEligibleCount)) {
    return "stale acceptance · regenerate required";
  }
  return String(session.status).replace(/_/g, " ");
}

export function stillReviewExportStatusMessage(args: {
  sessionStatus: StillReviewStatus;
  packageEligibleCount: number;
  exportStatus: string;
  clientExportStatus: string;
}): string {
  if (args.clientExportStatus) return args.clientExportStatus;
  if (args.sessionStatus === "rejected") {
    return "Still rejected · authored project unchanged.";
  }
  if (args.packageEligibleCount > 0) {
    return "Still accepted · will record provenance on client preview export.";
  }
  if (args.sessionStatus === "accepted") {
    return "Still acceptance is stale · project changed · regenerate and accept again.";
  }
  return args.exportStatus;
}
