import { clampJobMeta, type JobStatus } from "../jobMeta";
import {
  MAX_REVIEW_NOTES,
  MAX_REVISION_HISTORY,
  type ProjectReviewState,
  type ReviewNote,
  type ReviewNoteSeverity,
  type ReviewNoteSource,
  type RevisionChangeEntry,
  type RevisionChangeKind,
  type RevisionFingerprint,
  type RevisionSnapshot,
} from "./types";
import { clampGateOverride } from "./gateOverride";

const SEVERITIES: ReviewNoteSeverity[] = ["info", "warning", "error", "blocker"];
const SOURCES: ReviewNoteSource[] = ["manual", "manufacturing", "validation"];
const CHANGE_KINDS: RevisionChangeKind[] = [
  "cabinets",
  "rooms",
  "cost",
  "job",
  "materials",
  "issues",
  "other",
];

export function createReviewNoteId() {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createRevisionSnapshotId() {
  return `rev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function clampReviewNote(
  value: Partial<ReviewNote> | null | undefined,
): ReviewNote | null {
  if (!value) return null;
  const message = String(value.message ?? "").trim();
  if (!message) return null;
  const severity = SEVERITIES.includes(value.severity as ReviewNoteSeverity)
    ? (value.severity as ReviewNoteSeverity)
    : "info";
  const source = SOURCES.includes(value.source as ReviewNoteSource)
    ? (value.source as ReviewNoteSource)
    : "manual";
  return {
    id: String(value.id ?? createReviewNoteId()),
    severity,
    source,
    code: value.code ? String(value.code) : undefined,
    message,
    cabinetId:
      typeof value.cabinetId === "string" && value.cabinetId.trim()
        ? value.cabinetId
        : null,
    resolved: Boolean(value.resolved),
    createdAt:
      typeof value.createdAt === "string" && value.createdAt
        ? value.createdAt
        : new Date().toISOString(),
    resolvedAt:
      typeof value.resolvedAt === "string" && value.resolvedAt
        ? value.resolvedAt
        : undefined,
  };
}

export function clampReviewNotes(
  value: Array<Partial<ReviewNote>> | null | undefined,
): ReviewNote[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => clampReviewNote(item))
    .filter((item): item is ReviewNote => Boolean(item))
    .slice(0, MAX_REVIEW_NOTES);
}

export function clampRevisionFingerprint(
  value: Partial<RevisionFingerprint> | null | undefined,
): RevisionFingerprint {
  const names = Array.isArray(value?.cabinetNames)
    ? value!.cabinetNames.filter((name): name is string => typeof name === "string").slice(0, 80)
    : [];
  const materials = Array.isArray(value?.materialKeys)
    ? value!.materialKeys.filter((key): key is string => typeof key === "string").slice(0, 80)
    : [];
  return {
    cabinetCount: Math.max(0, Math.round(Number(value?.cabinetCount) || 0)),
    roomCount: Math.max(0, Math.round(Number(value?.roomCount) || 0)),
    partLineCount: Math.max(0, Math.round(Number(value?.partLineCount) || 0)),
    workshopTotal: Math.max(0, Math.round(Number(value?.workshopTotal) || 0)),
    sellTotal: Math.max(0, Math.round(Number(value?.sellTotal) || 0)),
    errorCount: Math.max(0, Math.round(Number(value?.errorCount) || 0)),
    warningCount: Math.max(0, Math.round(Number(value?.warningCount) || 0)),
    blockerCount: Math.max(0, Math.round(Number(value?.blockerCount) || 0)),
    cabinetNames: names,
    materialKeys: materials,
  };
}

export function clampRevisionChangeEntry(
  value: Partial<RevisionChangeEntry> | null | undefined,
): RevisionChangeEntry | null {
  if (!value) return null;
  const summary = String(value.summary ?? "").trim();
  if (!summary) return null;
  const kind = CHANGE_KINDS.includes(value.kind as RevisionChangeKind)
    ? (value.kind as RevisionChangeKind)
    : "other";
  return { kind, summary };
}

export function clampRevisionSnapshot(
  value: Partial<RevisionSnapshot> | null | undefined,
): RevisionSnapshot | null {
  if (!value) return null;
  const revision = String(value.revision ?? "").trim() || "A";
  const status = clampJobMeta({ status: value.status as JobStatus }).status;
  const changeLog = Array.isArray(value.changeLog)
    ? value.changeLog
        .map((entry) => clampRevisionChangeEntry(entry))
        .filter((entry): entry is RevisionChangeEntry => Boolean(entry))
        .slice(0, 40)
    : [];
  return {
    id: String(value.id ?? createRevisionSnapshotId()),
    revision,
    createdAt:
      typeof value.createdAt === "string" && value.createdAt
        ? value.createdAt
        : new Date().toISOString(),
    status,
    note: String(value.note ?? "").trim(),
    approvedBy:
      typeof value.approvedBy === "string" && value.approvedBy.trim()
        ? value.approvedBy.trim()
        : undefined,
    releasedForProduction: Boolean(value.releasedForProduction),
    productionFingerprint:
      typeof value.productionFingerprint === "string" && value.productionFingerprint.trim()
        ? value.productionFingerprint.trim().slice(0, 80)
        : undefined,
    releaseOverride: clampGateOverride(value.releaseOverride),
    fingerprint: clampRevisionFingerprint(value.fingerprint),
    changeLog,
    openIssues: clampReviewNotes(value.openIssues),
  };
}

export function clampRevisionHistory(
  value: Array<Partial<RevisionSnapshot>> | null | undefined,
): RevisionSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => clampRevisionSnapshot(item))
    .filter((item): item is RevisionSnapshot => Boolean(item))
    .slice(0, MAX_REVISION_HISTORY);
}

export function clampProjectReviewState(
  value: Partial<ProjectReviewState> | null | undefined,
): ProjectReviewState {
  return {
    notes: clampReviewNotes(value?.notes),
    history: clampRevisionHistory(value?.history),
  };
}

export function emptyProjectReviewState(): ProjectReviewState {
  return { notes: [], history: [] };
}
