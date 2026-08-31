import { clampJobMeta, patchJobMeta, type ProjectJobMeta } from "../jobMeta";
import type { CabinetProject } from "../cabinetDimensions";
import { getProjectReviewState } from "./operations";
import type { ProjectReviewState, ReleaseGateResult } from "./types";

export function canApproveForRelease(project: CabinetProject): ReleaseGateResult {
  const review = getProjectReviewState(project);
  const reasons: string[] = [];
  const open = review.notes.filter((note) => !note.resolved);
  const blockers = open.filter((note) => note.severity === "blocker");
  const errors = open.filter((note) => note.severity === "error");
  if (blockers.length > 0) {
    reasons.push(`${blockers.length} unresolved blocker${blockers.length === 1 ? "" : "s"}`);
  }
  if (errors.length > 0) {
    reasons.push(`${errors.length} unresolved error${errors.length === 1 ? "" : "s"}`);
  }
  if (review.history.length === 0) {
    reasons.push("Freeze at least one revision snapshot before approval");
  }
  return { ok: reasons.length === 0, reasons, canOverride: false };
}

export function approveProjectReview(
  project: CabinetProject,
  approvedBy = "",
): { job: ProjectJobMeta; review: ProjectReviewState } | { error: string } {
  const gate = canApproveForRelease(project);
  if (!gate.ok) {
    return { error: gate.reasons.join("; ") };
  }
  const review = getProjectReviewState(project);
  const history = review.history.map((snapshot, index) =>
    index === 0
      ? {
          ...snapshot,
          status: "approved" as const,
          approvedBy: approvedBy.trim() || snapshot.approvedBy || "Reviewer",
        }
      : snapshot,
  );
  return {
    job: patchJobMeta(clampJobMeta(project.job), { status: "approved" }),
    review: { ...review, history },
  };
}
