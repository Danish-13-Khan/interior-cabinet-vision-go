import type { JobStatus } from "../jobMeta";

export const MAX_REVISION_HISTORY = 16;
export const MAX_REVIEW_NOTES = 80;

export type ReviewNoteSeverity = "info" | "warning" | "error" | "blocker";
export type ReviewNoteSource = "manual" | "manufacturing" | "validation";

export type ReviewNote = {
  id: string;
  severity: ReviewNoteSeverity;
  source: ReviewNoteSource;
  code?: string;
  message: string;
  cabinetId?: string | null;
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
};

export type RevisionChangeKind =
  | "cabinets"
  | "rooms"
  | "cost"
  | "job"
  | "materials"
  | "issues"
  | "other";

export type RevisionChangeEntry = {
  kind: RevisionChangeKind;
  summary: string;
};

export type RevisionFingerprint = {
  cabinetCount: number;
  roomCount: number;
  partLineCount: number;
  workshopTotal: number;
  sellTotal: number;
  errorCount: number;
  warningCount: number;
  blockerCount: number;
  cabinetNames: string[];
  materialKeys: string[];
};

export type GateOverride = {
  reason: string;
  overriddenAt: string;
  user?: string;
};

export type RevisionSnapshot = {
  id: string;
  revision: string;
  createdAt: string;
  status: JobStatus;
  note: string;
  approvedBy?: string;
  releasedForProduction: boolean;
  productionFingerprint?: string;
  releaseOverride?: GateOverride;
  fingerprint: RevisionFingerprint;
  changeLog: RevisionChangeEntry[];
  openIssues: ReviewNote[];
};

export type ProjectReviewState = {
  notes: ReviewNote[];
  history: RevisionSnapshot[];
};

export type RevisionCompareResult = {
  leftLabel: string;
  rightLabel: string;
  changes: RevisionChangeEntry[];
  left: RevisionFingerprint;
  right: RevisionFingerprint;
};

export type ReleaseGateResult = {
  ok: boolean;
  reasons: string[];
  canOverride: boolean;
};

export type ProductionGateItem = {
  id: string;
  label: string;
  detail: string;
  blocking: boolean;
  overridable: boolean;
  status: "pass" | "fail";
};

export type ProductionReadinessGate = {
  items: ProductionGateItem[];
  blockingCount: number;
  ready: boolean;
  canOverride: boolean;
  reasons: string[];
};
