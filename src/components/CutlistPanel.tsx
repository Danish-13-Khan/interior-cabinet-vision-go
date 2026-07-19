import type { CabinetCutlistItem } from "../domain/cabinetGeometry";

type CutlistPanelProps = {
  items: CabinetCutlistItem[];
  title?: string;
};

export function CutlistPanel({ items, title = "Cutlist" }: CutlistPanelProps) {
  return (
    <div className="cutlist-panel">
      <div className="section-heading">
        <h2>{title}</h2>
        <span>{items.length} item types</span>
      </div>

      <div className="cutlist-table">
        <div className="cutlist-header">
          <span>Part</span>
          <span>Qty</span>
          <span>Size (mm)</span>
        </div>

        {items.map((item) => (
          <div key={item.key} className="cutlist-row">
            <div>
              <strong>{item.label}</strong>
              <span>{item.material}</span>
            </div>
            <span>{item.quantity}</span>
            <span>
              {item.lengthMm} × {item.widthMm} × {item.thicknessMm}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
