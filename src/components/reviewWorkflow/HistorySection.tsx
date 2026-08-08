import { JOB_STATUS_LABELS } from "../../domain/jobMeta";
import type { ProjectReviewState } from "../../domain/projectReview";
import { FingerprintCards } from "./FingerprintCards";

type HistorySectionProps = {
  history: ProjectReviewState["history"];
};

export function HistorySection({ history }: HistorySectionProps) {
  return (
    <section className="review-section">
      <h3>Revision history / change log</h3>
      {history.length === 0 ? (
        <p className="helper-note">
          Freeze a revision to start the project change log and approval trail.
        </p>
      ) : (
        <div className="review-history-list">
          {history.map((snap) => (
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
  );
}
