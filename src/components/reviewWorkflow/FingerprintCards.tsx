import type { RevisionFingerprint } from "../../domain/projectReview";

function money(value: number) {
  return `₹${Math.round(value).toLocaleString()}`;
}

export function FingerprintCards({ fingerprint }: { fingerprint: RevisionFingerprint }) {
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
