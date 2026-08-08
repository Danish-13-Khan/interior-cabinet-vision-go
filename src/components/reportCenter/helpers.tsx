import type { ProductionCutlistLine } from "../../domain/productionCutlist";

export type CutlistGroupMode = "material" | "thickness" | "cabinet" | "flat";

export function money(value: number) {
  return `₹${Math.round(value).toLocaleString()}`;
}

export function CutlistTable({
  lines,
  onSelectCabinet,
}: {
  lines: ProductionCutlistLine[];
  onSelectCabinet?: (cabinetId: string) => void;
}) {
  if (lines.length === 0) {
    return <p className="report-empty">No cutlist parts for this project.</p>;
  }

  return (
    <div className="shop-table-wrap">
      <table className="shop-table">
        <thead>
          <tr>
            <th>Ref</th>
            <th>Source</th>
            <th>Part</th>
            <th>Material</th>
            <th>Thk</th>
            <th>Qty</th>
            <th>L × W</th>
            <th>Grain</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.key}>
              <td>
                <code className="shop-ref">{line.shopRef}</code>
              </td>
              <td>
                <button
                  type="button"
                  className="shop-source-btn"
                  onClick={() => onSelectCabinet?.(line.cabinetId)}
                  title="Select cabinet"
                >
                  {line.cabinetName}
                </button>
              </td>
              <td>
                <strong>{line.label}</strong>
                <span className="shop-sub">{line.category}</span>
              </td>
              <td>
                {line.material}
                <span className="shop-sub">{line.finish}</span>
              </td>
              <td>{line.thicknessMm}</td>
              <td>{line.quantity}</td>
              <td>
                {line.lengthMm} × {line.widthMm}
              </td>
              <td>{line.grain}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
