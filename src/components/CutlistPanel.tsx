import type { ProductionCutlistLine } from "../domain/productionCutlist";

type CutlistPanelProps = {
  items: ProductionCutlistLine[];
  title?: string;
};

/** Compact cutlist preview; prefer ReportCenter for production inspection. */
export function CutlistPanel({ items, title = "Cutlist" }: CutlistPanelProps) {
  return (
    <div className="cutlist-panel">
      <div className="section-heading">
        <h2>{title}</h2>
        <span>{items.length} lines</span>
      </div>

      <div className="cutlist-table">
        <div className="cutlist-header">
          <span>Ref / Part</span>
          <span>Qty</span>
          <span>Size (mm)</span>
        </div>

        {items.map((item) => (
          <div key={item.key} className="cutlist-row">
            <div>
              <strong>
                {item.shopRef ? `${item.shopRef} · ` : ""}
                {item.label}
              </strong>
              <span>
                {item.material} · {item.cabinetName}
              </span>
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
