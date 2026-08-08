import { useMemo, useState } from "react";
import {
  compareRevisionFingerprints,
  compareRevisionSnapshots,
  type ProjectReviewState,
  type RevisionFingerprint,
  type RevisionSnapshot,
} from "../../domain/projectReview";

type CompareSectionProps = {
  review: ProjectReviewState;
  currentFingerprint: RevisionFingerprint;
};

export function CompareSection({ review, currentFingerprint }: CompareSectionProps) {
  const [leftId, setLeftId] = useState<string>("current");
  const [rightId, setRightId] = useState<string>(
    review.history[0]?.id ?? "current",
  );

  const compare = useMemo(() => {
    const resolve = (
      id: string,
    ): { label: string; fingerprint: RevisionFingerprint; snap?: RevisionSnapshot } | null => {
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

  return (
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
  );
}
