type Props = {
  blocking: number;
  warnings: number;
  ready: boolean;
};

/** Review step headline: Blocking · Warnings · Ready. */
export function ReviewSummaryBar({ blocking, warnings, ready }: Props) {
  return (
    <div className="review-summary-bar" aria-label="Review summary" data-testid="review-summary-bar">
      <div className={blocking > 0 ? "is-blocking" : ""} data-review-count="blocking">
        <strong>{blocking}</strong><span>Blocking</span>
      </div>
      <div className={warnings > 0 ? "is-warning" : ""} data-review-count="warnings">
        <strong>{warnings}</strong><span>Warnings</span>
      </div>
      <div className={ready ? "is-ready" : ""} data-review-count="ready">
        <strong aria-hidden>{ready ? "✓" : "–"}</strong><span>{ready ? "Ready" : "Not ready"}</span>
      </div>
    </div>
  );
}
