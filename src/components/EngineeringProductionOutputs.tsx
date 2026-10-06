import { useState } from "react";
import type { MachineJobDocument } from "../domain/machineExport";
import type { ProjectReport } from "../domain/projectReport";
import { downloadProductionOutputsPackage } from "../platform/downloadProductionPackage";

type ProductionTab = "materials" | "nesting" | "hardware" | "cutlist" | "machining" | "costing";

const TABS: Array<{ id: ProductionTab; label: string }> = [
  { id: "materials", label: "Materials" },
  { id: "nesting", label: "Nesting" },
  { id: "hardware", label: "Hardware" },
  { id: "cutlist", label: "Cut list" },
  { id: "machining", label: "Machining" },
  { id: "costing", label: "Costing" },
];

type EngineeringProductionOutputsProps = {
  report: ProjectReport;
  machineJob: MachineJobDocument | null;
  onBack: () => void;
  onGoHome: () => void;
  onExportCutlist: () => void;
  onExportDrawings: () => void;
  onExportMachineJson: () => void;
  onExportMachineCsv: () => void;
};

const money = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return <div className="epo-stat"><span>{label}</span><strong>{value}</strong>{note ? <small>{note}</small> : null}</div>;
}

export function EngineeringProductionOutputs(props: EngineeringProductionOutputsProps) {
  const [tab, setTab] = useState<ProductionTab>("materials");
  const report = props.report;
  const cost = report.projectCost;
  const machiningRows = props.machineJob?.parts.flatMap((part) =>
    part.operations.map((operation) => ({ part, operation })),
  ) ?? [];

  return (
    <section className="engineering-production-workspace" aria-label="Production Outputs">
      <header className="epo-header">
        <div className="er-brand"><span className="er-mark">P</span><div><strong>Production Outputs</strong><small data-testid="production-revision">{report.summary.projectNumber} · Rev {report.summary.revision} · {report.summary.customerName}</small></div></div>
        <div className="epo-release"><span>Engineering package</span><strong>{report.summary.cabinetCount} cabinet{report.summary.cabinetCount === 1 ? "" : "s"}</strong><small>{report.productionCutlist.length} cut-list lines</small></div>
        <div className="epo-header-actions">
          <button type="button" data-testid="engineering-landing" onClick={props.onGoHome}>Landing page</button>
          <button type="button" className="epo-back" onClick={props.onBack}>← Back to Engineering Review</button>
        </div>
      </header>

      <nav className="epo-tabs" aria-label="Production output sections">
        {TABS.map((item) => <button key={item.id} type="button" className={tab === item.id ? "is-active" : ""} onClick={() => setTab(item.id)}>{item.label}</button>)}
      </nav>

      <main className="epo-content">
        {tab === "materials" ? <>
          <div className="epo-title"><div><strong>Material takeoff</strong><span>Boards grouped by material and thickness</span></div><b>{report.sheetYield.totalSheets} sheets</b></div>
          <div className="epo-stats"><Stat label="Part area" value={`${report.sheetYield.totalPartAreaM2.toFixed(2)} m²`} /><Stat label="Overall yield" value={`${report.sheetYield.overallYieldPercent.toFixed(1)}%`} /><Stat label="Waste" value={`${report.sheetYield.totalWasteAreaM2.toFixed(2)} m²`} /><Stat label="Reclaimable offcuts" value={`${report.sheetYield.reclaimableOffcutAreaM2.toFixed(2)} m²`} /></div>
          <div className="epo-card-grid">{report.materialSummary.map((row) => <article key={`${row.material}-${row.thicknessMm}`} className="epo-material-card"><i /><div><strong>{row.material}</strong><span>{row.thicknessMm} mm board</span></div><dl><div><dt>Area</dt><dd>{row.totalAreaM2.toFixed(2)} m²</dd></div><div><dt>Sheets</dt><dd>{row.estimatedBoards}</dd></div><div><dt>Lines</dt><dd>{row.lineCount}</dd></div></dl></article>)}</div>
        </> : null}

        {tab === "nesting" ? <>
          <div className="epo-title"><div><strong>Sheet yield planning</strong><span>{report.sheetYield.sheet.label} · usable {report.sheetYield.usableLengthMm} × {report.sheetYield.usableWidthMm} mm</span></div><b>{report.sheetYield.overallYieldPercent.toFixed(1)}% yield</b></div>
          <div className="epo-stats"><Stat label="Sheets" value={String(report.sheetYield.totalSheets)} /><Stat label="Part area" value={`${report.sheetYield.totalPartAreaM2.toFixed(2)} m²`} /><Stat label="Waste" value={`${report.sheetYield.totalWasteAreaM2.toFixed(2)} m²`} /><Stat label="Offcuts" value={`${report.sheetYield.totalOffcutAreaM2.toFixed(2)} m²`} /></div>
          <div className="epo-table-wrap"><table><thead><tr><th>Material group</th><th>Parts</th><th>Sheets</th><th>Yield</th><th>Waste</th><th>Reclaimable</th></tr></thead><tbody>{report.sheetYield.groups.map((row) => <tr key={row.key}><td><strong>{row.material}</strong><small>{row.thicknessMm} mm</small></td><td>{row.partCount}</td><td>{row.sheetsUsed}</td><td><span className="epo-yield"><i style={{ width: `${row.yieldPercent}%` }} /></span>{row.yieldPercent.toFixed(1)}%</td><td>{row.wasteAreaM2.toFixed(2)} m²</td><td>{row.reclaimableOffcutAreaM2.toFixed(2)} m²</td></tr>)}</tbody></table></div>
        </> : null}

        {tab === "hardware" ? <>
          <div className="epo-title"><div><strong>Hardware schedule</strong><span>Resolved fittings, accessories, and consumables</span></div><b>{money.format(cost.totalHardware)}</b></div>
          <div className="epo-table-wrap"><table><thead><tr><th>Hardware</th><th>Kind</th><th>Quantity</th><th>Unit</th><th>Total</th><th>Cabinets</th></tr></thead><tbody>{report.hardwareSchedule.map((row) => <tr key={row.hardwareId}><td><strong>{row.label}</strong><small>{row.hardwareId}{row.unconfirmedDefault ? " · unconfirmed default" : ""}</small></td><td>{row.kind}</td><td>{row.quantity}</td><td>{money.format(row.unitCost)}</td><td><strong>{money.format(row.totalCost)}</strong></td><td>{row.cabinetMarks.join(", ")}</td></tr>)}</tbody></table></div>
        </> : null}

        {tab === "cutlist" ? <>
          <div className="epo-title"><div><strong>Workshop cut list</strong><span>Production parts for the handed-off revision</span></div><button type="button" onClick={props.onExportCutlist}>Export CSV</button></div>
          <div className="epo-table-wrap"><table><thead><tr><th>Reference</th><th>Cabinet</th><th>Part</th><th>Material</th><th>Thickness</th><th>Qty</th><th>Length × width</th><th>Grain</th></tr></thead><tbody>{report.productionCutlist.map((row) => <tr key={row.key} data-cabinet-id={row.cabinetId}><td><code>{row.shopRef}</code></td><td>{row.cabinetName}</td><td><strong>{row.label}</strong><small>{row.category}</small></td><td>{row.material}<small>{row.finish}</small></td><td>{row.thicknessMm} mm</td><td>{row.quantity}</td><td>{row.lengthMm} × {row.widthMm}</td><td>{row.grain}</td></tr>)}</tbody></table></div>
        </> : null}

        {tab === "machining" ? <>
          <div className="epo-title"><div><strong>Machining preview</strong><span>{props.machineJob?.disclaimer ?? "Machine intent is unavailable."}</span></div><div className="epo-title-actions"><button type="button" onClick={props.onExportMachineJson}>Export JSON</button><button type="button" onClick={props.onExportMachineCsv}>Export operations</button></div></div>
          {props.machineJob ? <><div className="epo-stats"><Stat label="Parts" value={String(props.machineJob.summary.partCount)} /><Stat label="Operations" value={String(props.machineJob.summary.operationCount)} /><Stat label="Drill intents" value={String(props.machineJob.summary.drillIntentCount)} /><Stat label="Unverified" value={String(props.machineJob.summary.unverifiedCount)} /></div><div className="epo-table-wrap"><table><thead><tr><th>Shop ref</th><th>Part</th><th>Operation</th><th>Kind</th><th>Status</th><th>Blank</th></tr></thead><tbody>{machiningRows.map(({ part, operation }) => <tr key={operation.id}><td><code>{part.shopRef}</code></td><td><strong>{part.label}</strong><small>{part.cabinetName}</small></td><td>{operation.label}<small>{operation.description}</small></td><td>{operation.kind}</td><td><span className={`epo-status-pill is-${operation.status}`}>{operation.status}</span></td><td>{part.blank.lengthMm} × {part.blank.widthMm} × {part.blank.thicknessMm}</td></tr>)}</tbody></table></div></> : <div className="epo-empty">No machining document is available for this revision.</div>}
        </> : null}

        {tab === "costing" ? <>
          <div className="epo-title"><div><strong>Costing summary</strong><span>Material, hardware, finish, labour, and waste</span></div><b>{money.format(cost.grandTotal)}</b></div>
          <div className="epo-stats epo-cost-stats"><Stat label="Material" value={money.format(cost.totalMaterial)} /><Stat label="Waste" value={money.format(cost.totalWaste)} /><Stat label="Hardware" value={money.format(cost.totalHardware)} /><Stat label="Labour" value={money.format(cost.totalLabour)} /><Stat label="Finish" value={money.format(cost.totalFinish)} /></div>
          <div className="epo-table-wrap"><table><thead><tr><th>Cabinet</th><th>Material</th><th>Finish</th><th>Hardware</th><th>Labour</th><th>Total</th></tr></thead><tbody>{cost.cabinets.map((row) => <tr key={row.cabinetId}><td><strong>{row.cabinetName}</strong></td><td>{money.format(row.materialCost)}</td><td>{money.format(row.finishCost)}</td><td>{money.format(row.hardwareCost)}</td><td>{money.format(row.labourCost)}</td><td><strong>{money.format(row.totalCost)}</strong></td></tr>)}</tbody></table></div>
        </> : null}
      </main>

      <footer className="epo-footer">
        <span>Production data is bound to Rev {report.summary.revision} · {report.summary.customerName}.</span>
        <div>
          <button type="button" onClick={props.onExportDrawings}>Export drawings</button>
          <button type="button" onClick={props.onExportCutlist}>Export cut list</button>
          <button
            type="button"
            className="is-primary"
            data-testid="download-production-outputs"
            onClick={() => { void downloadProductionOutputsPackage(report, props.machineJob); }}
          >
            Download full package
          </button>
        </div>
      </footer>
    </section>
  );
}
