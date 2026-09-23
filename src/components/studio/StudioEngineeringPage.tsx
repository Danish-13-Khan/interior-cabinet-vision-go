import type { ProductionCutlistLine } from "../../domain/productionCutlist";

export function StudioEngineeringPage(props: {
  lines: ProductionCutlistLine[];
  status: string;
}) {
  if (props.lines.length === 0) {
    return <p className="studio-state" data-testid="studio-cutlist-empty">No manufactured parts in this project yet.</p>;
  }
  return (
    <div className="studio-page" data-testid="studio-engineering">
      <h2>Engineering & cut list</h2>
      <p>{props.lines.length} parts from the production cut list. {props.status}</p>
      <table className="studio-table">
        <thead>
          <tr><th>Shop ref</th><th>Cabinet</th><th>Part</th><th>Key</th><th>Qty</th><th>Size</th></tr>
        </thead>
        <tbody>
          {props.lines.map((line) => (
            <tr key={line.key}>
              <td>{line.shopRef}</td>
              <td>{line.cabinetName}</td>
              <td>{line.label}</td>
              <td>{line.key}</td>
              <td>{line.quantity}</td>
              <td>{line.lengthMm}×{line.widthMm}×{line.thicknessMm}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
