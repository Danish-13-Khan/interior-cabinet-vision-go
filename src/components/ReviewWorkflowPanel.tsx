import { useMemo, useState } from "react";
import { JOB_STATUS_LABELS } from "../domain/jobMeta";
import {
  compareRevisionFingerprints,
  compareRevisionSnapshots,
  type ProjectReviewState,
  type ReviewNoteSeverity,
  type RevisionFingerprint,
  type RevisionSnapshot,
} from "../domain/projectReview";

type ReviewWorkflowPanelProps = {
  review: ProjectReviewState;
  currentFingerprint: RevisionFingerprint;
  onFreezeRevision: (note: string, bumpRevision: boolean) => void;
  onAddNote: (message: string, severity: ReviewNoteSeverity) => void;
  onResolveNote: (noteId: string, resolved: boolean) => void;
  onApprove: (approvedBy: string) => void;
  onRelease: () => void;
  onExportRevisionSummary: () => void;
  approvalBlockedReasons: string[];
  releaseBlockedReasons: string[];
};

function money(value: number) {
  return `₹${Math.round(value).toLocaleString()}`;
}

function FingerprintCards({ fingerprint }: { fingerprint: RevisionFingerprint }) {
  return (
    <div className="report-summary-grid">
      <div className="report-card">
        <span className="report-card-label">Cabinets</span>
        <strong>{fingerprint.cabinetCount}</strong>
      </div>
      <div className="report-card">
        <span className="report-card-label">Rooms</span>
        <strong>{fingerprint.roomCount}</strong>
      </div>
      <div className="report-card">
        <span className="report-card-label">Parts</span>
        <strong>{fingerprint.partLineCount}</strong>
      </div>
      <div className="report-card">
        <span className="report-card-label">Workshop</span>
        <strong>{money(fingerprint.workshopTotal)}</strong>
      </div>
      <div className="report-card">
        <span className="report-card-label">Sell</span>
        <strong>{money(fingerprint.sellTotal)}</strong>
      </div>
      <div className="report-card">
        <span className="report-card-label">Issues</span>
        <strong>
          {fingerprint.blockerCount}B / {fingerprint.errorCount}E /{" "}
          {fingerprint.warningCount}W
        </strong>
      </div>
    </div>
  );
}

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
}: ReviewWorkflowPanelProps) {
  const [freezeNote, setFreezeNote] = useState("");
  const [bumpRevision, setBumpRevision] = useState(true);
  const [noteMessage, setNoteMessage] = useState("");
  const [noteSeverity, setNoteSeverity] =
    useState<ReviewNoteSeverity>("warning");
  const [approvedBy, setApprovedBy] = useState("");
  const [leftId, setLeftId] = useState<string>("current");
  const [rightId, setRightId] = useState<string>(
    review.history[0]?.id ?? "current",
  );

  const compare = useMemo(() => {
    const resolve = (id: string): { label: string; fingerprint: RevisionFingerprint; snap?: RevisionSnapshot } | null => {
      if (id === "current") {
        return { label: "Current", fingerprint: currentFingerprint };
      }
      const snap = review.history.find((item) => item.id === id);
      if (!snap) return null;
      return { label: `Rev ${snap.revision}`, fingerprint: snap.fingerprint, snap };
    };
    const left = resolve(leftId);
    const right = resolve(rightId);
    if (!left || !right) return null;
    if (left.snap && right.snap) {
      return compareRevisionSnapshots(left.snap, right.snap);
    }
    return compareRevisionFingerprints(
      left.fingerprint,
      right.fingerprint,
      left.label,
      right.label,
    );
  }, [currentFingerprint, leftId, review.history, rightId]);

  const openNotes = review.notes.filter((note) => !note.resolved);
  const resolvedNotes = review.notes.filter((note) => note.resolved);

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

      <section className="review-section">
        <h3>Freeze revision snapshot</h3>
        <div className="review-form-row">
          <input
            type="text"
            value={freezeNote}
            placeholder="Optional freeze note (shop / client)"
            onChange={(event) => setFreezeNote(event.currentTarget.value)}
          />
          <label className="review-check">
            <input
              type="checkbox"
              checked={bumpRevision}
              onChange={(event) => setBumpRevision(event.currentTarget.checked)}
            />
            Bump revision letter
          </label>
          <button
            type="button"
            className="tb-btn tb-accent"
            onClick={() => {
              onFreezeRevision(freezeNote, bumpRevision);
              setFreezeNote("");
            }}
          >
            Freeze Revision
          </button>
        </div>
      </section>

      <section className="review-section">
        <h3>Approval & release</h3>
        <div className="review-form-row">
          <input
            type="text"
            value={approvedBy}
            placeholder="Approved by"
            onChange={(event) => setApprovedBy(event.currentTarget.value)}
          />
          <button
            type="button"
            className="tb-btn"
            disabled={approvalBlockedReasons.length > 0}
            title={approvalBlockedReasons.join("; ") || "Mark approved"}
            onClick={() => onApprove(approvedBy)}
          >
            Approve
          </button>
          <button
            type="button"
            className="tb-btn tb-accent"
            disabled={releaseBlockedReasons.length > 0}
            title={releaseBlockedReasons.join("; ") || "Release for production"}
            onClick={onRelease}
          >
            Release for Production
          </button>
        </div>
        {approvalBlockedReasons.length > 0 ? (
          <p className="helper-note">Approval blocked: {approvalBlockedReasons.join("; ")}</p>
        ) : null}
        {releaseBlockedReasons.length > 0 ? (
          <p className="helper-note">Release blocked: {releaseBlockedReasons.join("; ")}</p>
        ) : null}
      </section>

      <section className="review-section">
        <h3>Issue flags / review notes</h3>
        <div className="review-form-row">
          <input
            type="text"
            value={noteMessage}
            placeholder="Add a review note or issue flag"
            onChange={(event) => setNoteMessage(event.currentTarget.value)}
          />
          <select
            value={noteSeverity}
            onChange={(event) =>
              setNoteSeverity(event.currentTarget.value as ReviewNoteSeverity)
            }
          >
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="blocker">Blocker</option>
          </select>
          <button
            type="button"
            className="tb-btn"
            onClick={() => {
              if (!noteMessage.trim()) return;
              onAddNote(noteMessage.trim(), noteSeverity);
              setNoteMessage("");
            }}
          >
            Add Note
          </button>
        </div>
        <div className="review-note-list">
          {openNotes.length === 0 ? (
            <p className="helper-note">No open review notes.</p>
          ) : (
            openNotes.map((note) => (
              <div key={note.id} className={`review-note severity-${note.severity}`}>
                <div>
                  <strong>{note.severity}</strong>
                  <span>{note.message}</span>
                  <small>
                    {note.source} · {new Date(note.createdAt).toLocaleString()}
                  </small>
                </div>
                <button
                  type="button"
                  className="tb-btn"
                  onClick={() => onResolveNote(note.id, true)}
                >
                  Resolve
                </button>
              </div>
            ))
          )}
        </div>
        {resolvedNotes.length > 0 ? (
          <details className="review-resolved">
            <summary>{resolvedNotes.length} resolved notes</summary>
            {resolvedNotes.map((note) => (
              <div key={note.id} className="review-note is-resolved">
                <span>{note.message}</span>
                <button
                  type="button"
                  className="tb-btn"
                  onClick={() => onResolveNote(note.id, false)}
                >
                  Reopen
                </button>
              </div>
            ))}
          </details>
        ) : null}
      </section>

      <section className="review-section">
        <h3>Compare revisions</h3>
        <div className="review-form-row">
          <label>
            Left
            <select value={leftId} onChange={(event) => setLeftId(event.currentTarget.value)}>
              <option value="current">Current</option>
              {review.history.map((snap) => (
                <option key={snap.id} value={snap.id}>
                  Rev {snap.revision} · {new Date(snap.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </label>
          <label>
            Right
            <select value={rightId} onChange={(event) => setRightId(event.currentTarget.value)}>
              <option value="current">Current</option>
              {review.history.map((snap) => (
                <option key={`r-${snap.id}`} value={snap.id}>
                  Rev {snap.revision} · {new Date(snap.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </label>
        </div>
        {compare ? (
          <div className="review-compare">
            <strong>
              {compare.leftLabel} → {compare.rightLabel}
            </strong>
            <ul>
              {compare.changes.map((change, index) => (
                <li key={`${change.kind}-${index}`}>{change.summary}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="helper-note">Select two revisions to compare.</p>
        )}
      </section>

      <section className="review-section">
        <h3>Revision history / change log</h3>
        {review.history.length === 0 ? (
          <p className="helper-note">
            Freeze a revision to start the project change log and approval trail.
          </p>
        ) : (
          <div className="review-history-list">
            {review.history.map((snap) => (
              <article key={snap.id} className="review-history-card">
                <header>
                  <strong>Rev {snap.revision}</strong>
                  <span className={`job-status-badge status-${snap.status}`}>
                    {JOB_STATUS_LABELS[snap.status]}
                  </span>
                  {snap.releasedForProduction ? (
                    <span className="review-released">Released</span>
                  ) : null}
                </header>
                <p>
                  {new Date(snap.createdAt).toLocaleString()}
                  {snap.approvedBy ? ` · Approved by ${snap.approvedBy}` : ""}
                </p>
                {snap.note ? <p className="review-history-note">{snap.note}</p> : null}
                <FingerprintCards fingerprint={snap.fingerprint} />
                <ul className="review-changelog">
                  {snap.changeLog.map((entry, index) => (
                    <li key={`${snap.id}-${index}`}>{entry.summary}</li>
                  ))}
                </ul>
                {snap.openIssues.length > 0 ? (
                  <p className="helper-note">
                    Open issues at freeze: {snap.openIssues.length}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
