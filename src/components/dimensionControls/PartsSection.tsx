import type { CabinetPart } from "../../domain/cabinetConstruction";

export function PartsSection({ constructionParts }: { constructionParts: CabinetPart[] }) {
  if (constructionParts.length === 0) {
    return (
      <div className="control-section">
        <div className="section-heading">
          <h2>Parts report</h2>
        </div>
        <p className="engineering-note">No shop parts for this cabinet yet.</p>
      </div>
    );
  }

  return (
    <div className="control-section">
      <div className="section-heading">
        <h2>Parts report</h2>
        <span>{constructionParts.length} lines</span>
      </div>
      <p className="engineering-note">
        Read-only cut preview. Full schedule lives in the status dock Report Center.
      </p>
      <div className="parts-list">
        {constructionParts.map((part) => (
          <div key={part.id} className="parts-list-item">
            <strong>{part.label}</strong>
            <span>
              {part.quantity}x · {part.lengthMm} × {part.widthMm} × {part.thicknessMm} mm
            </span>
            <span>
              {part.materialLabel} · {part.finishLabel} · {part.edgeBandingLabel}
            </span>
            {part.notes ? <span className="parts-list-note">{part.notes}</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
