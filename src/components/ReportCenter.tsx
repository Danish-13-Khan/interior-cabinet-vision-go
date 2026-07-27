import { useMemo, useState } from "react";
import type { CostingSettings } from "../domain/costingSettings";
import {
  COSTING_PRESETS,
  getCostingPreset,
} from "../domain/costingSettings";
import { HARDWARE_CATALOG } from "../domain/costing";
import type { ProjectReport } from "../domain/projectReport";
import type { ProductionCutlistLine } from "../domain/productionCutlist";

export type ReportCenterTab =
  | "summary"
  | "cabinets"
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
  const [tab, setTab] = useState<ReportCenterTab>("summary");
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
      <div className="report-center-tabs" role="tablist" aria-label="Production reports">
        {(
          [
            ["summary", "Summary"],
            ["cabinets", "Cabinets"],
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
        {tab === "summary" ? (
          <div className="report-doc">
            <header className="report-doc-header">
              <div>
                <strong>Production Report</strong>
                <span>Shop summary · {report.summary.roomSizeLabel}</span>
              </div>
              <span>{report.summary.partLineCount} part lines</span>
            </header>

            <div className="report-summary-grid">
              <div className="report-card">
                <span className="report-card-label">Project Items</span>
                <strong>{report.summary.itemCount}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Cabinet Items</span>
                <strong>{report.summary.cabinetCount}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Project Total</span>
                <strong>{money(report.projectCost.grandTotal)}</strong>
              </div>
              <div className="report-card report-card-wide">
                <span className="report-card-label">Room Size</span>
                <strong>{report.summary.roomSizeLabel}</strong>
              </div>
            </div>

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

        {tab === "cabinets" ? (
          <div className="report-doc">
            <header className="report-doc-header">
              <div>
                <strong>Cabinet List</strong>
                <span>{report.itemList.length} items with cutlist and cost</span>
              </div>
            </header>
            <div className="shop-table-wrap">
              <table className="shop-table">
                <thead>
                  <tr>
                    <th>Cabinet</th>
                    <th>Type</th>
                    <th>Size (mm)</th>
                    <th>Parts</th>
                    <th>Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {report.perItemCutlists.map((row) => {
                    const item = report.itemList.find((entry) => entry.id === row.cabinetId);
                    return (
                      <tr key={row.cabinetId}>
                        <td>
                          <button
                            type="button"
                            className="shop-source-btn"
                            onClick={() => onSelectCabinet?.(row.cabinetId)}
                          >
                            {row.cabinetName}
                          </button>
                        </td>
                        <td>{item?.typeLabel ?? "—"}</td>
                        <td>
                          {item
                            ? `${item.widthMm} × ${item.heightMm} × ${item.depthMm}`
                            : "—"}
                        </td>
                        <td>{row.lines.length}</td>
                        <td>{money(row.cost.totalCost)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {tab === "materials" ? (
          <div className="report-doc">
            <header className="report-doc-header">
              <div>
                <strong>Material Summary</strong>
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
                    : `${report.productionCutlist.length} production lines`}
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
                <strong>Costing</strong>
                <span>Material, hardware, labour, and project allowance</span>
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
                    <th>Cabinet</th>
                    <th>Material</th>
                    <th>Hardware</th>
                    <th>Labour</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {report.projectCost.cabinets.map((cost) => (
                    <tr key={cost.cabinetId}>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
