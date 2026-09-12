export type FreezeAuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: "freeze" | "refreeze" | "export";
  projectId: string;
  quoteSnapshotId: string;
  revisionLabel?: string;
  detail?: string;
};

export type PremiumAuditKind =
  | "payment"
  | "freeze"
  | "export"
  | "approval"
  | "all";

export type PremiumAuditFilter = {
  kind?: PremiumAuditKind;
  projectId?: string;
  documentId?: string;
  actor?: string;
  action?: string;
  fromIso?: string;
  toIso?: string;
  limit?: number;
};

export type PremiumAuditRow = {
  at: string;
  actor: string;
  source: "payment" | "freeze" | "approval";
  kind: string;
  summary: string;
  projectId?: string;
  documentId?: string;
  paymentId?: string;
  quoteSnapshotId?: string;
  reason?: string;
};

export type ApprovalAuditLike = {
  at: string;
  actor: string;
  kind: string;
  summary: string;
  projectId: string;
  reason?: string;
};
