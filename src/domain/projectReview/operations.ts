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
