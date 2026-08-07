import { useMemo, useState } from "react";
import type { CostingSettings } from "../domain/costingSettings";
import {
  COSTING_PRESETS,
  getCostingPreset,
} from "../domain/costingSettings";
import { HARDWARE_CATALOG } from "../domain/costing";
import type { ProjectReport } from "../domain/projectReport";
import type { ProductionCutlistLine } from "../domain/productionCutlist";
import { JOB_STATUS_LABELS } from "../domain/jobMeta";

export type ReportCenterTab =
  | "packet"
  | "schedule"
  | "runs"
  | "materials"
  | "cutlist"
  | "costing";

type ReportCenterProps = {
  report: ProjectReport;
  selectedCabinetId?: string | null;
  costingSettings: CostingSettings;
  onCostingChange: (next: CostingSettings) => void;
  onSelectCabinet?: (cabinetId: string) => void;
};

type CutlistGroupMode = "material" | "thickness" | "cabinet" | "flat";

function money(value: number) {
  return `₹${Math.round(value).toLocaleString()}`;
}

function CutlistTable({
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

export function ReportCenter({
  report,
  selectedCabinetId = null,
  costingSettings,
  onCostingChange,
  onSelectCabinet,
}: ReportCenterProps) {
  const [tab, setTab] = useState<ReportCenterTab>("packet");
  const [cutlistMode, setCutlistMode] = useState<CutlistGroupMode>("material");

  const selectedLines = useMemo(() => {
    if (!selectedCabinetId) return [];
    return report.productionCutlist.filter((line) => line.cabinetId === selectedCabinetId);
  }, [report.productionCutlist, selectedCabinetId]);

  const cutlistGroups =
    cutlistMode === "material"
      ? report.groupedByMaterial
      : cutlistMode === "thickness"
        ? report.groupedByThickness
        : cutlistMode === "cabinet"
          ? report.groupedByCabinet
          : null;

  function patchCosting(patch: Partial<CostingSettings>) {
    onCostingChange({ ...costingSettings, ...patch, presetId: patch.presetId ?? "custom" });
  }

  function applyPreset(presetId: string) {
    const preset = getCostingPreset(presetId);
    if (preset) onCostingChange({ ...preset.settings });
  }

  const hingeOptions = HARDWARE_CATALOG.filter((item) => item.id.startsWith("hinge-"));
  const slideOptions = HARDWARE_CATALOG.filter((item) => item.id.startsWith("drawer-slide-"));
  const handleOptions = HARDWARE_CATALOG.filter((item) => item.id.startsWith("handle-"));

  return (
    <div className="report-center">
      <div className="report-center-tabs" role="tablist" aria-label="Production packet">
        {(
          [
            ["packet", "Packet"],
            ["schedule", "Schedule"],
            ["runs", "Runs"],
            ["materials", "Materials"],
            ["cutlist", "Cutlist"],
            ["costing", "Costing"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`report-center-tab ${tab === id ? "is-active" : ""}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="report-center-body">
        {tab === "packet" ? (
          <div className="report-doc">
            <header className="report-doc-header">
              <div>
                <strong>Production Packet</strong>
                <span>
                  {report.jobTitle} · {report.jobSubtitle}
                </span>
              </div>
              <span className={`job-status-badge status-${report.job.status}`}>
                {JOB_STATUS_LABELS[report.job.status]}
              </span>
            </header>

            <div className="report-summary-grid">
              <div className="report-card">
                <span className="report-card-label">Project #</span>
                <strong>{report.summary.projectNumber}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Customer</span>
                <strong>{report.summary.customerName}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Revision</span>
                <strong>{report.summary.revision}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Cabinets</span>
                <strong>{report.summary.cabinetCount}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Runs</span>
                <strong>{report.summary.runCount}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Part lines</span>
                <strong>{report.summary.partLineCount}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Project total</span>
                <strong>{money(report.projectCost.grandTotal)}</strong>
              </div>
              <div className="report-card report-card-wide">
                <span className="report-card-label">Room</span>
                <strong>{report.summary.roomSizeLabel}</strong>
              </div>
            </div>

            {report.job.notes ? (
              <section className="report-subsection">
                <h3>Job notes</h3>
                <p className="job-notes-preview">{report.job.notes}</p>
              </section>
            ) : null}

            <section className="report-subsection">
              <h3>Packet contents</h3>
              <ol className="packet-toc">
                {report.packetSections.map((section) => (
                  <li key={section.id}>
                    <strong>{section.title}</strong>
                    <span>{section.description}</span>
                  </li>
                ))}
              </ol>
            </section>

            <div className="report-cost-grid">
              <div className="report-card">
                <span className="report-card-label">Material</span>
                <strong>{money(report.projectCost.totalMaterial)}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Hardware</span>
                <strong>{money(report.projectCost.totalHardware)}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Labour</span>
                <strong>{money(report.projectCost.totalLabour)}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Allowance</span>
                <strong>{money(report.projectCost.hardwareAllowance)}</strong>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "schedule" ? (
          <div className="report-doc">
            <header className="report-doc-header">
              <div>
                <strong>Cabinet Schedule</strong>
                <span>
                  {report.cabinetSchedule.length} marks · shop-ready sizes and run assignment
                </span>
              </div>
            </header>
            <div className="shop-table-wrap">
              <table className="shop-table">
                <thead>
                  <tr>
                    <th>Mark</th>
                    <th>Cabinet</th>
                    <th>Type</th>
                    <th>Size (mm)</th>
                    <th>Run</th>
                    <th>Parts</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {report.cabinetSchedule.map((row) => (
                    <tr key={row.cabinetId}>
                      <td>
                        <code className="shop-ref">{row.mark}</code>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="shop-source-btn"
                          onClick={() => onSelectCabinet?.(row.cabinetId)}
                        >
                          {row.cabinetName}
                        </button>
                      </td>
                      <td>{row.typeLabel}</td>
                      <td>
                        {row.widthMm} × {row.heightMm} × {row.depthMm}
                      </td>
                      <td>{row.runLabel ?? "—"}</td>
                      <td>{row.partCount}</td>
                      <td>{money(row.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {tab === "runs" ? (
          <div className="report-doc">
            <header className="report-doc-header">
              <div>
                <strong>Room / Run Summary</strong>
                <span>
                  {report.runSummaries.length} detected runs · fillers and countertops
                </span>
              </div>
            </header>
            {report.runSummaries.length === 0 ? (
              <p className="report-empty">
                No cabinet runs detected yet. Place cabinets along a wall to form a run.
              </p>
            ) : (
              <div className="shop-table-wrap">
                <table className="shop-table">
                  <thead>
                    <tr>
                      <th>Run</th>
                      <th>Side</th>
                      <th>Cabinets</th>
                      <th>Length</th>
                      <th>Fillers</th>
                      <th>Tops</th>
                      <th>Corner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.runSummaries.map((run) => (
                      <tr key={run.runId}>
                        <td>
                          <strong>{run.label}</strong>
                          <span className="shop-sub">{run.cabinetNames.join(", ")}</span>
                        </td>
                        <td>{run.side}</td>
                        <td>{run.cabinetCount}</td>
                        <td>{run.lengthMm} mm</td>
                        <td>{run.fillerCount}</td>
                        <td>{run.countertopCount}</td>
                        <td>{run.hasCorner ? "Yes" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {tab === "materials" ? (
          <div className="report-doc">
            <header className="report-doc-header">
              <div>
                <strong>Material Takeoff</strong>
                <span>Board estimates from production cutlist</span>
              </div>
            </header>
            <div className="shop-table-wrap">
              <table className="shop-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Thickness</th>
                    <th>Area</th>
                    <th>Est. boards</th>
                    <th>Lines</th>
                  </tr>
                </thead>
                <tbody>
                  {report.materialSummary.map((row) => (
                    <tr key={`${row.material}-${row.thicknessMm}`}>
                      <td>
                        <strong>{row.material}</strong>
                      </td>
                      <td>{row.thicknessMm} mm</td>
                      <td>{row.totalAreaM2.toFixed(2)} m²</td>
                      <td>{row.estimatedBoards}</td>
                      <td>{row.lineCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {tab === "cutlist" ? (
          <div className="report-doc">
            <header className="report-doc-header">
              <div>
                <strong>Workshop Cutlist</strong>
                <span>
                  {selectedCabinetId
                    ? `${selectedLines.length} lines for selection · ${report.productionCutlist.length} project`
                    : `${report.productionCutlist.length} production lines with shop refs`}
                </span>
              </div>
              <div className="cutlist-mode-toggle">
                {(
                  [
                    ["material", "By material"],
                    ["thickness", "By thickness"],
                    ["cabinet", "By cabinet"],
                    ["flat", "Flat"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    className={cutlistMode === id ? "is-active" : ""}
                    onClick={() => setCutlistMode(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </header>

            {selectedLines.length > 0 ? (
              <section className="report-subsection">
                <h3>Selected cabinet</h3>
                <CutlistTable lines={selectedLines} onSelectCabinet={onSelectCabinet} />
              </section>
            ) : null}

            {cutlistMode === "flat" ? (
              <CutlistTable
                lines={report.productionCutlist}
                onSelectCabinet={onSelectCabinet}
              />
            ) : (
              <div className="cutlist-group-stack">
                {(cutlistGroups ?? []).map((group) => (
                  <section key={group.key} className="cutlist-group-card">
                    <header>
                      <strong>{group.title}</strong>
                      <span>
                        {group.totalQuantity} pcs · {group.totalAreaM2.toFixed(2)} m² ·{" "}
                        {group.lines.length} lines
                      </span>
                    </header>
                    <CutlistTable lines={group.lines} onSelectCabinet={onSelectCabinet} />
                  </section>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {tab === "costing" ? (
          <div className="report-doc">
            <header className="report-doc-header">
              <div>
                <strong>Costing Summary</strong>
                <span>
                  {report.jobTitle} · material, hardware, labour, and allowance
                </span>
              </div>
              <strong>{money(report.projectCost.grandTotal)}</strong>
            </header>

            <div className="costing-controls">
              <label>
                Preset
                <select
                  value={
                    COSTING_PRESETS.some((preset) => preset.id === costingSettings.presetId)
                      ? costingSettings.presetId
                      : "custom"
                  }
                  onChange={(event) => {
                    if (event.currentTarget.value === "custom") return;
                    applyPreset(event.currentTarget.value);
                  }}
                >
                  {COSTING_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
              </label>
              <label>
                Waste %
                <input
                  type="number"
                  min={0}
                  max={40}
                  step={1}
                  value={costingSettings.wastePercent}
                  onChange={(event) =>
                    patchCosting({ wastePercent: Number(event.currentTarget.value) })
                  }
                />
              </label>
              <label>
                Labour %
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={costingSettings.labourPercent}
                  onChange={(event) =>
                    patchCosting({ labourPercent: Number(event.currentTarget.value) })
                  }
                />
              </label>
              <label>
                Material rate ×
                <input
                  type="number"
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={costingSettings.materialRateMultiplier}
                  onChange={(event) =>
                    patchCosting({
                      materialRateMultiplier: Number(event.currentTarget.value),
                    })
                  }
                />
              </label>
              <label>
                Hardware allowance
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={costingSettings.hardwareAllowance}
                  onChange={(event) =>
                    patchCosting({ hardwareAllowance: Number(event.currentTarget.value) })
                  }
                />
              </label>
              <label>
                Hinge
                <select
                  value={costingSettings.hingeId}
                  onChange={(event) => patchCosting({ hingeId: event.currentTarget.value })}
                >
                  {hingeOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label} (₹{item.costPerUnit})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Drawer slide
                <select
                  value={costingSettings.drawerSlideId}
                  onChange={(event) =>
                    patchCosting({ drawerSlideId: event.currentTarget.value })
                  }
                >
                  {slideOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label} (₹{item.costPerUnit})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Handle
                <select
                  value={costingSettings.handleId}
                  onChange={(event) => patchCosting({ handleId: event.currentTarget.value })}
                >
                  {handleOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label} (₹{item.costPerUnit})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="report-cost-grid">
              <div className="report-card">
                <span className="report-card-label">Material</span>
                <strong>{money(report.projectCost.totalMaterial)}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Waste included</span>
                <strong>{money(report.projectCost.totalWaste)}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Hardware</span>
                <strong>{money(report.projectCost.totalHardware)}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Labour</span>
                <strong>{money(report.projectCost.totalLabour)}</strong>
              </div>
            </div>

            <div className="shop-table-wrap">
              <table className="shop-table">
                <thead>
                  <tr>
                    <th>Mark</th>
                    <th>Cabinet</th>
                    <th>Material</th>
                    <th>Hardware</th>
                    <th>Labour</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.projectCost.cabinets.map((cost, index) => {
                    const mark = report.cabinetSchedule.find(
                      (row) => row.cabinetId === cost.cabinetId,
                    )?.mark ?? `C${String(index + 1).padStart(2, "0")}`;
                    return (
                      <tr key={cost.cabinetId}>
                        <td>
                          <code className="shop-ref">{mark}</code>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="shop-source-btn"
                            onClick={() => onSelectCabinet?.(cost.cabinetId)}
                          >
                            {cost.cabinetName}
                          </button>
                        </td>
                        <td>{money(cost.materialCost)}</td>
                        <td>{money(cost.hardwareCost)}</td>
                        <td>{money(cost.labourCost)}</td>
                        <td>
                          <strong>{money(cost.totalCost)}</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
