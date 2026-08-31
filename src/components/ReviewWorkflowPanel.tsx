import { useState } from "react";
import type {
  ProjectReviewState,
  ReviewNoteSeverity,
  RevisionFingerprint,
} from "../domain/projectReview";
import { FingerprintCards } from "./reviewWorkflow/FingerprintCards";
import { FreezeSection } from "./reviewWorkflow/FreezeSection";
import { ApprovalSection } from "./reviewWorkflow/ApprovalSection";
import { NotesSection } from "./reviewWorkflow/NotesSection";
import { CompareSection } from "./reviewWorkflow/CompareSection";
import { HistorySection } from "./reviewWorkflow/HistorySection";

type ReviewWorkflowPanelProps = {
  review: ProjectReviewState;
  currentFingerprint: RevisionFingerprint;
  onFreezeRevision: (note: string, bumpRevision: boolean) => void;
  onAddNote: (message: string, severity: ReviewNoteSeverity) => void;
  onResolveNote: (noteId: string, resolved: boolean) => void;
  onApprove: (approvedBy: string) => void;
  onRelease: (overrideReason?: string) => void;
  onExportRevisionSummary: () => void;
  approvalBlockedReasons: string[];
  releaseBlockedReasons: string[];
  canOverrideRelease: boolean;
};

export function ReviewWorkflowPanel({
  review,
  currentFingerprint,
  onFreezeRevision,
  onAddNote,
  onResolveNote,
  onApprove,
  onRelease,
  onExportRevisionSummary,
  approvalBlockedReasons,
  releaseBlockedReasons,
  canOverrideRelease,
}: ReviewWorkflowPanelProps) {
  const [freezeNote, setFreezeNote] = useState("");
  const [bumpRevision, setBumpRevision] = useState(true);
  const [approvedBy, setApprovedBy] = useState("");

  return (
    <div className="report-doc review-workflow-panel">
      <header className="report-doc-header">
        <div>
          <strong>Review / Approval / Revisions</strong>
          <span>
            Freeze snapshots, track issues, compare revisions, and release for
            production
          </span>
        </div>
        <button
          type="button"
          className="tb-btn tb-accent"
          onClick={onExportRevisionSummary}
        >
          Printable Summary
        </button>
      </header>

      <section className="review-section">
        <h3>Current project fingerprint</h3>
        <FingerprintCards fingerprint={currentFingerprint} />
      </section>

      <FreezeSection
        freezeNote={freezeNote}
        bumpRevision={bumpRevision}
        onFreezeNoteChange={setFreezeNote}
        onBumpRevisionChange={setBumpRevision}
        onFreeze={() => {
          onFreezeRevision(freezeNote, bumpRevision);
          setFreezeNote("");
        }}
      />

      <ApprovalSection
        approvedBy={approvedBy}
        onApprovedByChange={setApprovedBy}
        onApprove={() => onApprove(approvedBy)}
        onRelease={onRelease}
        approvalBlockedReasons={approvalBlockedReasons}
        releaseBlockedReasons={releaseBlockedReasons}
        canOverrideRelease={canOverrideRelease}
      />

      <NotesSection
        notes={review.notes}
        onAddNote={onAddNote}
        onResolveNote={onResolveNote}
      />

      <CompareSection review={review} currentFingerprint={currentFingerprint} />

      <HistorySection history={review.history} />
    </div>
  );
}
