import type { CabinetPart } from "../../domain/cabinetConstruction";

export function PartsSection({ constructionParts }: { constructionParts: CabinetPart[] }) {
  if (constructionParts.length === 0) return null;

  return (
    <div className="control-section">
      <div className="section-heading">
        <h2>Parts</h2>
        <span>{constructionParts.length} lines</span>
      </div>
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
