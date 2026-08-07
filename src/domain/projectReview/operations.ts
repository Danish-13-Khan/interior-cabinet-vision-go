import {
  clampProjectReviewState,
  clampReviewNotes,
  createReviewNoteId,
  createRevisionSnapshotId,
  emptyProjectReviewState,
} from "./clamp";
import {
  MAX_REVISION_HISTORY,
  type ProjectReviewState,
  type ReleaseGateResult,
  type ReviewNote,
  type ReviewNoteSeverity,
  type RevisionSnapshot,
} from "./types";
import { buildChangeLogFromFingerprints } from "./compare";
import { createRevisionFingerprint } from "./fingerprint";
import type { CabinetProject } from "../cabinetDimensions";
import { clampJobMeta, patchJobMeta, type ProjectJobMeta } from "../jobMeta";
import { evaluateProjectRules } from "../manufacturingRules";

export function getProjectReviewState(project: CabinetProject): ProjectReviewState {
  return clampProjectReviewState({
    notes: project.reviewNotes,
    history: project.revisionHistory,
  });
}

export function bumpRevisionLabel(current: string): string {
  const trimmed = current.trim() || "A";
  const match = trimmed.match(/^(.*?)([A-Za-z])(\d*)$/);
  if (!match) {
    return `${trimmed}-1`;
  }
  const [, prefix, letter, suffix] = match;
  if (suffix) {
    return `${prefix}${letter}${Number(suffix) + 1}`;
  }
  if (letter === "Z" || letter === "z") {
    return `${prefix}${letter}2`;
  }
  return `${prefix}${String.fromCharCode(letter.charCodeAt(0) + 1)}`;
}

export function collectLiveReviewIssues(
  project: CabinetProject,
  existingNotes: ReviewNote[] = [],
): ReviewNote[] {
  const manufacturing = evaluateProjectRules(project).filter(
    (issue) => issue.severity === "error" || issue.severity === "warning",
  );
  const fromRules: ReviewNote[] = manufacturing.map((issue) => ({
    id: createReviewNoteId(),
    severity: (issue.severity === "error" ? "error" : "warning") as ReviewNoteSeverity,
    source: "manufacturing",
    code: issue.code,
    message: issue.message,
    cabinetId: null,
    resolved: false,
    createdAt: new Date().toISOString(),
  }));
  return clampReviewNotes([
    ...existingNotes.filter(
      (note) => !note.resolved && note.source !== "manufacturing",
    ),
    ...fromRules,
  ]);
}

export function createRevisionSnapshot(
  project: CabinetProject,
  options: {
    note?: string;
    bumpRevision?: boolean;
    approvedBy?: string;
  } = {},
): { snapshot: RevisionSnapshot; nextJob: ProjectJobMeta; nextReview: ProjectReviewState } {
  const review = getProjectReviewState(project);
  const job = clampJobMeta(project.job);
  const openIssues = collectLiveReviewIssues(project, review.notes);
  const fingerprint = createRevisionFingerprint(project, openIssues);
  const previous = review.history[0] ?? null;
  const changeLog = buildChangeLogFromFingerprints(previous?.fingerprint, fingerprint);
  const nextRevision = options.bumpRevision
    ? bumpRevisionLabel(job.revision)
    : job.revision;
  const snapshot: RevisionSnapshot = {
    id: createRevisionSnapshotId(),
    revision: nextRevision,
    createdAt: new Date().toISOString(),
    status: job.status,
    note: String(options.note ?? "").trim(),
    approvedBy: options.approvedBy?.trim() || undefined,
    releasedForProduction: false,
    fingerprint,
    changeLog,
    openIssues,
  };
  const nextHistory = [snapshot, ...review.history].slice(0, MAX_REVISION_HISTORY);
  const nextJob = patchJobMeta(job, {
    revision: nextRevision,
    status:
      job.status === "draft"
        ? "quoted"
        : job.status,
  });
  return {
    snapshot,
    nextJob,
    nextReview: {
      notes: openIssues,
      history: nextHistory,
    },
  };
}

export function addReviewNote(
  review: ProjectReviewState,
  input: {
    message: string;
    severity?: ReviewNoteSeverity;
    cabinetId?: string | null;
  },
): ProjectReviewState {
  const note: ReviewNote = {
    id: createReviewNoteId(),
    severity: input.severity ?? "info",
    source: "manual",
    message: input.message.trim(),
    cabinetId: input.cabinetId ?? null,
    resolved: false,
    createdAt: new Date().toISOString(),
  };
  if (!note.message) return clampProjectReviewState(review);
  return clampProjectReviewState({
    ...review,
    notes: [note, ...review.notes],
  });
}

export function setReviewNoteResolved(
  review: ProjectReviewState,
  noteId: string,
  resolved: boolean,
): ProjectReviewState {
  const now = new Date().toISOString();
  return clampProjectReviewState({
    ...review,
    notes: review.notes.map((note) =>
      note.id === noteId
        ? {
            ...note,
            resolved,
            resolvedAt: resolved ? now : undefined,
          }
        : note,
    ),
  });
}

export function canApproveForRelease(
  project: CabinetProject,
): ReleaseGateResult {
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
  return { ok: reasons.length === 0, reasons };
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
    job: patchJobMeta(project.job, { status: "approved" }),
    review: { ...review, history },
  };
}

export function canReleaseForProduction(
  project: CabinetProject,
): ReleaseGateResult {
  const job = clampJobMeta(project.job);
  const review = getProjectReviewState(project);
  const reasons: string[] = [];
  if (job.status !== "approved" && job.status !== "production") {
    reasons.push("Project must be approved before release for production");
  }
  const approveGate = canApproveForRelease(project);
  if (!approveGate.ok) {
    reasons.push(...approveGate.reasons);
  }
  const manufacturingErrors = evaluateProjectRules(project).filter(
    (issue) => issue.severity === "error" && !issue.autoFixed,
  );
  if (manufacturingErrors.length > 0) {
    reasons.push(
      `${manufacturingErrors.length} manufacturing error${manufacturingErrors.length === 1 ? "" : "s"} still open`,
    );
  }
  if (!review.history[0]) {
    reasons.push("No revision snapshot available to release");
  }
  return { ok: reasons.length === 0, reasons: Array.from(new Set(reasons)) };
}

export function releaseForProduction(
  project: CabinetProject,
): { job: ProjectJobMeta; review: ProjectReviewState } | { error: string } {
  const gate = canReleaseForProduction(project);
  if (!gate.ok) {
    return { error: gate.reasons.join("; ") };
  }
  const review = getProjectReviewState(project);
  const history = review.history.map((snapshot, index) =>
    index === 0
      ? {
          ...snapshot,
          status: "production" as const,
          releasedForProduction: true,
        }
      : snapshot,
  );
  return {
    job: patchJobMeta(project.job, { status: "production" }),
    review: { ...review, history },
  };
}

export function applyReviewStateToProject(
  project: CabinetProject,
  review: ProjectReviewState,
  job?: ProjectJobMeta,
): CabinetProject {
  const safe = clampProjectReviewState(review);
  return {
    ...project,
    reviewNotes: safe.notes,
    revisionHistory: safe.history,
    job: job ? clampJobMeta(job) : project.job,
  };
}

export { emptyProjectReviewState };
