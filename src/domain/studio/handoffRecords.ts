import type { JobStatus } from "../jobMeta";

export type QuoteAcceptanceDocument = {
  id?: string;
  projectId: string;
  revisionLabel: string;
  threadStatus: string;
  quoteSnapshotId?: string;
  kind?: string;
  supersedesDocumentId?: string;
};

/**
 * Client acceptance belongs to one issued quote snapshot.
 * A later freeze can reuse the revision label with a new snapshot id.
 * Invoice conversion keeps that snapshot id and points back at the accepted quote.
 */
export function quoteSnapshotClientAccepted(
  documents: readonly QuoteAcceptanceDocument[],
  projectId: string,
  quoteSnapshotId: string | null,
) {
  if (!quoteSnapshotId) return false;
  const acceptedIds = new Set(
    documents
      .filter((doc) => doc.id && doc.projectId === projectId && doc.quoteSnapshotId === quoteSnapshotId && doc.threadStatus === "accepted")
      .map((doc) => doc.id as string),
  );
  return documents.some((doc) => {
    if (doc.projectId !== projectId || doc.quoteSnapshotId !== quoteSnapshotId) return false;
    if (doc.threadStatus === "accepted") return true;
    return doc.kind === "invoice"
      && Boolean(doc.supersedesDocumentId)
      && acceptedIds.has(doc.supersedesDocumentId as string);
  });
}

/**
 * Three revision-bound milestones. Engineering handoff must not count as
 * production release, and engineering approval must not count as client acceptance.
 */
export function revisionHandoffRecords(input: {
  designRevision: string;
  quoteSnapshotId: string | null;
  projectId: string;
  jobRevision: string;
  jobStatus: JobStatus;
  productionAt?: string;
  engineeringSent: boolean;
  documents: readonly QuoteAcceptanceDocument[];
}) {
  const sameDesign = input.jobRevision === input.designRevision;
  return {
    clientAccepted: quoteSnapshotClientAccepted(input.documents, input.projectId, input.quoteSnapshotId),
    engineeringSent: input.engineeringSent && sameDesign,
    productionReleased: sameDesign && input.jobStatus === "production",
  };
}
