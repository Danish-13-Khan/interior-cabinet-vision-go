import { useState } from "react";
import { engineeringCutlistState } from "../../domain/studio/engineeringCutlistState";
import { cutlistGroups, type CutlistGroupMode } from "../../domain/studio/cutlistView";
import type { ProductionCutlistLine } from "../../domain/productionCutlist";

export function StudioEngineeringPage(props: {
  lines: ProductionCutlistLine[];
  status: string;
  selectedKey: string | null;
  machineSummary: string;
  machineJson: string | null;
  machineError: string | null;
  onSelectLine: (key: string) => void;
}) {
  const [mode, setMode] = useState<CutlistGroupMode>("cabinet");
  const presentation = engineeringCutlistState({
    lineCount: props.lines.length,
    status: props.status,
    machineError: props.machineError,
  });
  if (presentation.kind !== "ready") {
    return (
      <section className="studio-page" data-testid={presentation.kind === "blocked" ? "studio-cutlist-blocked" : "studio-cutlist-empty"}>
        <h2>Engineering & cut list</h2>
        <p className={presentation.kind === "blocked" ? "studio-state is-error" : "studio-state"}>{presentation.message}</p>
      </section>
    );
  }
  const groups = cutlistGroups(props.lines, mode);

  function downloadMachine() {
    if (!props.machineJson) return;
    const blob = new Blob([props.machineJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "machine-export.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="studio-page" data-testid="studio-engineering">
      <header className="studio-cutlist-toolbar">
        <div>
          <h2>Engineering & cut list</h2>
          <p>{props.lines.length} parts. {props.status} {props.machineSummary}</p>
          {props.machineError ? <p className="studio-state is-error">{props.machineError}</p> : null}
        </div>
        <div className="studio-tabs" role="tablist" aria-label="Cut list grouping">
          {(["cabinet", "material", "thickness"] as const).map((item) => (
            <button key={item} type="button" className={`studio-btn${mode === item ? " is-primary" : ""}`} onClick={() => setMode(item)}>
              {item}
            </button>
          ))}
          <button type="button" className="studio-btn" onClick={downloadMachine} disabled={!props.machineJson}>Machine JSON</button>
        </div>
      </header>
      {groups.map((group) => (
        <section key={group.key} className="studio-card">
          <h3>{group.title}</h3>
          <p>{group.totalQuantity} pieces · {group.totalAreaM2} m²</p>
          <table className="studio-table">
            <thead>
              <tr>
                <th>Shop ref</th><th>Cabinet</th><th>Part</th><th>Material</th><th>Thickness</th>
                <th>Qty</th><th>Size</th><th>Edge</th><th>Grain</th><th>Category</th>
              </tr>
            </thead>
            <tbody>
              {group.lines.map((line) => (
                <tr
                  key={line.key}
                  className={props.selectedKey === line.key ? "is-selected" : ""}
                  onClick={() => props.onSelectLine(line.key)}
                >
                  <td>{line.shopRef}</td>
                  <td>{line.cabinetName}</td>
                  <td>{line.label}</td>
                  <td>{line.material}</td>
                  <td>{line.thicknessMm}</td>
                  <td>{line.quantity}</td>
                  <td>{line.lengthMm}×{line.widthMm}</td>
                  <td>{line.edgeBanding}</td>
                  <td>{line.grain}</td>
                  <td>{line.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
