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
import type { QuoteSettings } from "../domain/quoteSettings";
import { formatQuoteMoney } from "../domain/quoteSettings";
import type { SheetOptimizerSettings } from "../domain/sheetStock";
import type { WholeProjectReport } from "../domain/projectRooms";
import type { MachineJobDocument } from "../domain/machineExport";
import { WholeProjectRoomsPanel } from "./WholeProjectRoomsPanel";
import { MachiningPreviewPanel } from "./machineExport/MachiningPreviewPanel";
import { ReviewWorkflowPanel } from "./ReviewWorkflowPanel";
import type { ReviewNoteSeverity } from "../domain/projectReview";
import {
  DEFAULT_SHEET_STOCK,
  getSheetStockDefinition,
} from "../domain/sheetStock";

export type ReportCenterTab =
  | "packet"
  | "rooms"
  | "schedule"
  | "runs"
  | "materials"
  | "optimize"
  | "hardware"
  | "cutlist"
  | "machining"
  | "costing"
  | "quote"
  | "review";

type ReportCenterProps = {
  report: ProjectReport;
  wholeProject?: WholeProjectReport | null;
  machineJob?: MachineJobDocument | null;
  onExportMachineJson?: () => void;
  onExportMachineCsv?: () => void;
  selectedCabinetId?: string | null;
  costingSettings: CostingSettings;
  quoteSettings: QuoteSettings;
  sheetOptimizerSettings: SheetOptimizerSettings;
  onCostingChange: (next: CostingSettings) => void;
  onQuoteChange: (next: QuoteSettings) => void;
  onSheetOptimizerChange: (next: SheetOptimizerSettings) => void;
  onFreezeQuote?: () => void;
  onSelectCabinet?: (cabinetId: string) => void;
  onFreezeRevision?: (note: string, bumpRevision: boolean) => void;
  onAddReviewNote?: (message: string, severity: ReviewNoteSeverity) => void;
  onResolveReviewNote?: (noteId: string, resolved: boolean) => void;
  onApproveReview?: (approvedBy: string) => void;
  onReleaseForProduction?: () => void;
  onExportRevisionSummary?: () => void;
  approvalBlockedReasons?: string[];
  releaseBlockedReasons?: string[];
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
  wholeProject = null,
  machineJob = null,
  onExportMachineJson,
  onExportMachineCsv,
  selectedCabinetId = null,
  costingSettings,
  quoteSettings,
  sheetOptimizerSettings,
  onCostingChange,
  onQuoteChange,
  onSheetOptimizerChange,
  onFreezeQuote,
  onSelectCabinet,
  onFreezeRevision,
  onAddReviewNote,
  onResolveReviewNote,
  onApproveReview,
  onReleaseForProduction,
  onExportRevisionSummary,
  approvalBlockedReasons = [],
  releaseBlockedReasons = [],
}: ReportCenterProps) {
  const [tab, setTab] = useState<ReportCenterTab>("packet");
  const [cutlistMode, setCutlistMode] = useState<CutlistGroupMode>("material");
  const [expandedYieldKey, setExpandedYieldKey] = useState<string | null>(null);

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

  function patchQuote(patch: Partial<QuoteSettings>) {
    onQuoteChange({ ...quoteSettings, ...patch });
  }

  function patchSheetOptimizer(patch: Partial<SheetOptimizerSettings>) {
    onSheetOptimizerChange({ ...sheetOptimizerSettings, ...patch });
  }

  function applyPreset(presetId: string) {
    const preset = getCostingPreset(presetId);
    if (preset) onCostingChange({ ...preset.settings });
  }

  const hingeOptions = HARDWARE_CATALOG.filter((item) => item.id.startsWith("hinge-"));
  const slideOptions = HARDWARE_CATALOG.filter((item) => item.id.startsWith("drawer-slide-"));
  const handleOptions = HARDWARE_CATALOG.filter((item) => item.id.startsWith("handle-"));
  const quote = report.quote;
  const yieldPlan = report.sheetYield;
  const activeSheet = getSheetStockDefinition(sheetOptimizerSettings.sheetId);
  const validUntilLabel = quote.validUntil
    ? new Date(quote.validUntil).toLocaleDateString()
    : "—";

  return (
    <div className="report-center">
      <div className="report-center-tabs" role="tablist" aria-label="Production packet">
        {(
          [
            ["packet", "Packet"],
            ["review", "Review"],
            ["rooms", "Rooms"],
            ["schedule", "Schedule"],
            ["runs", "Runs"],
            ["materials", "Materials"],
            ["optimize", "Optimize"],
            ["hardware", "Hardware"],
            ["cutlist", "Cutlist"],
            ["machining", "Machining"],
            ["costing", "Costing"],
            ["quote", "Quote"],
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
                <span className="report-card-label">Workshop total</span>
                <strong>{money(report.projectCost.grandTotal)}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Quote total</span>
                <strong>{money(quote.sellTotal)}</strong>
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
                <span className="report-card-label">Quote sell</span>
                <strong>{money(quote.sellTotal)}</strong>
              </div>
            </div>
          </div>
        ) : null}

        {tab === "review" ? (
          <ReviewWorkflowPanel
            review={report.review}
            currentFingerprint={report.currentFingerprint}
            onFreezeRevision={(note, bump) => onFreezeRevision?.(note, bump)}
            onAddNote={(message, severity) => onAddReviewNote?.(message, severity)}
            onResolveNote={(noteId, resolved) =>
              onResolveReviewNote?.(noteId, resolved)
            }
            onApprove={(name) => onApproveReview?.(name)}
            onRelease={() => onReleaseForProduction?.()}
            onExportRevisionSummary={() => onExportRevisionSummary?.()}
            approvalBlockedReasons={approvalBlockedReasons}
            releaseBlockedReasons={releaseBlockedReasons}
          />
        ) : null}

        {tab === "rooms" ? (
          wholeProject ? (
            <WholeProjectRoomsPanel wholeProject={wholeProject} />
          ) : (
            <div className="report-doc">
              <p className="rail-empty">Whole-project room data is unavailable.</p>
            </div>
          )
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
                <span>
                  Grouped by material · thickness · sheet yield {yieldPlan.overallYieldPercent}%
                </span>
              </div>
              <strong>{yieldPlan.totalSheets} sheets</strong>
            </header>
            <div className="shop-table-wrap">
              <table className="shop-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Thickness</th>
                    <th>Area</th>
                    <th>Sheets</th>
                    <th>Yield</th>
                    <th>Waste</th>
                    <th>Lines</th>
                  </tr>
                </thead>
                <tbody>
                  {report.materialSummary.map((row) => {
                    const yieldGroup = yieldPlan.groups.find(
                      (group) =>
                        group.material === row.material &&
                        group.thicknessMm === row.thicknessMm,
                    );
                    return (
                      <tr key={`${row.material}-${row.thicknessMm}`}>
                        <td>
                          <strong>{row.material}</strong>
                        </td>
                        <td>{row.thicknessMm} mm</td>
                        <td>{row.totalAreaM2.toFixed(2)} m²</td>
                        <td>{row.estimatedBoards}</td>
                        <td>{yieldGroup ? `${yieldGroup.yieldPercent}%` : "—"}</td>
                        <td>
                          {yieldGroup ? `${yieldGroup.wasteAreaM2.toFixed(2)} m²` : "—"}
                        </td>
                        <td>{row.lineCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {tab === "optimize" ? (
          <div className="report-doc">
            <header className="report-doc-header">
              <div>
                <strong>Sheet Yield Planning</strong>
                <span>
                  {activeSheet.label} · usable {yieldPlan.usableLengthMm}×{yieldPlan.usableWidthMm}{" "}
                  · kerf {sheetOptimizerSettings.kerfMm} mm
                </span>
              </div>
              <strong>{yieldPlan.overallYieldPercent}% yield</strong>
            </header>

            <div className="costing-controls">
              <label>
                Sheet stock
                <select
                  value={sheetOptimizerSettings.sheetId}
                  onChange={(event) =>
                    patchSheetOptimizer({ sheetId: event.currentTarget.value })
                  }
                >
                  {DEFAULT_SHEET_STOCK.map((sheet) => (
                    <option key={sheet.id} value={sheet.id}>
                      {sheet.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Kerf mm
                <input
                  type="number"
                  min={0}
                  max={12}
                  step={1}
                  value={sheetOptimizerSettings.kerfMm}
                  onChange={(event) =>
                    patchSheetOptimizer({ kerfMm: Number(event.currentTarget.value) })
                  }
                />
              </label>
              <label>
                Edge trim mm
                <input
                  type="number"
                  min={0}
                  max={40}
                  step={1}
                  value={sheetOptimizerSettings.trimMm}
                  onChange={(event) =>
                    patchSheetOptimizer({ trimMm: Number(event.currentTarget.value) })
                  }
                />
              </label>
              <label className="optimizer-toggle">
                <span>Rotate free-grain parts</span>
                <input
                  type="checkbox"
                  checked={sheetOptimizerSettings.allowRotateFreeGrain}
                  onChange={(event) =>
                    patchSheetOptimizer({
                      allowRotateFreeGrain: event.currentTarget.checked,
                    })
                  }
                />
              </label>
            </div>

            <div className="report-cost-grid">
              <div className="report-card">
                <span className="report-card-label">Sheets</span>
                <strong>{yieldPlan.totalSheets}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Part area</span>
                <strong>{yieldPlan.totalPartAreaM2.toFixed(2)} m²</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Waste</span>
                <strong>{yieldPlan.totalWasteAreaM2.toFixed(2)} m²</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Reclaimable offcuts</span>
                <strong>{yieldPlan.reclaimableOffcutAreaM2.toFixed(2)} m²</strong>
              </div>
            </div>

            <section className="report-subsection">
              <h3>Yield by material · thickness</h3>
              <div className="shop-table-wrap">
                <table className="shop-table">
                  <thead>
                    <tr>
                      <th>Group</th>
                      <th>Parts</th>
                      <th>Sheets</th>
                      <th>Yield</th>
                      <th>Waste</th>
                      <th>Offcuts</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {yieldPlan.groups.map((group) => (
                      <tr key={group.key}>
                        <td>
                          <strong>
                            {group.material} · {group.thicknessMm} mm
                          </strong>
                        </td>
                        <td>{group.partCount}</td>
                        <td>{group.sheetsUsed}</td>
                        <td>{group.yieldPercent}%</td>
                        <td>{group.wasteAreaM2.toFixed(2)} m²</td>
                        <td>{group.reclaimableOffcutAreaM2.toFixed(2)} m²</td>
                        <td>
                          <button
                            type="button"
                            className="shop-source-btn"
                            onClick={() =>
                              setExpandedYieldKey(
                                expandedYieldKey === group.key ? null : group.key,
                              )
                            }
                          >
                            {expandedYieldKey === group.key ? "Hide sheets" : "Sheets"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {yieldPlan.groups
              .filter((group) => group.key === expandedYieldKey)
              .map((group) => (
                <section key={`${group.key}-sheets`} className="report-subsection">
                  <h3>
                    Cut grouping · {group.material} · {group.thicknessMm} mm
                  </h3>
                  {group.sheets.map((sheet) => (
                    <div key={sheet.label} className="yield-sheet-card">
                      <div className="yield-sheet-header">
                        <strong>{sheet.label}</strong>
                        <span>
                          {sheet.parts.length} parts · yield {sheet.yieldPercent}% · waste{" "}
                          {sheet.wasteAreaM2.toFixed(2)} m²
                        </span>
                      </div>
                      <div className="shop-table-wrap">
                        <table className="shop-table">
                          <thead>
                            <tr>
                              <th>Ref</th>
                              <th>Part</th>
                              <th>Cabinet</th>
                              <th>Pos</th>
                              <th>Size</th>
                              <th>Rot</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sheet.parts.map((part) => (
                              <tr key={part.id}>
                                <td>
                                  <code className="shop-ref">{part.shopRef}</code>
                                </td>
                                <td>{part.label}</td>
                                <td>{part.cabinetName}</td>
                                <td>
                                  {part.xMm},{part.yMm}
                                </td>
                                <td>
                                  {part.placedLengthMm}×{part.placedWidthMm}
                                </td>
                                <td>{part.rotated ? "yes" : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {sheet.offcuts.length > 0 ? (
                        <p className="yield-offcut-note">
                          Offcuts:{" "}
                          {sheet.offcuts
                            .slice(0, 4)
                            .map(
                              (offcut) =>
                                `${offcut.lengthMm}×${offcut.widthMm}${offcut.reclaimable ? "*" : ""}`,
                            )
                            .join(" · ")}
                          {sheet.offcuts.length > 4
                            ? ` · +${sheet.offcuts.length - 4} more`
                            : ""}
                          {" "}(* reclaimable ≥200×200)
                        </p>
                      ) : null}
                    </div>
                  ))}
                </section>
              ))}
          </div>
        ) : null}

        {tab === "hardware" ? (
          <div className="report-doc">
            <header className="report-doc-header">
              <div>
                <strong>Hardware Schedule</strong>
                <span>
                  {report.hardwareSchedule.length} SKUs · project hardware ₹
                  {report.hardwareSchedule
                    .reduce((sum, row) => sum + row.totalCost, 0)
                    .toLocaleString()}
                </span>
              </div>
              <strong>{money(report.projectCost.totalHardware)}</strong>
            </header>

            <div className="shop-table-wrap">
              <table className="shop-table">
                <thead>
                  <tr>
                    <th>Hardware</th>
                    <th>Kind</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Total</th>
                    <th>Cabinets</th>
                  </tr>
                </thead>
                <tbody>
                  {report.hardwareSchedule.map((row) => (
                    <tr key={row.hardwareId}>
                      <td>
                        <strong>{row.label}</strong>
                      </td>
                      <td>{row.kind}</td>
                      <td>{row.quantity}</td>
                      <td>{money(row.unitCost)}</td>
                      <td>
                        <strong>{money(row.totalCost)}</strong>
                      </td>
                      <td>
                        <code className="shop-ref">{row.cabinetMarks.join(" ")}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <section className="report-subsection">
              <h3>By cabinet</h3>
              <div className="shop-table-wrap">
                <table className="shop-table">
                  <thead>
                    <tr>
                      <th>Mark</th>
                      <th>Cabinet</th>
                      <th>Insert</th>
                      <th>Lines</th>
                      <th>Hardware total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.hardwareByCabinet.map((row) => (
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
                        <td>{row.insertKind}</td>
                        <td>{row.lines.length}</td>
                        <td>
                          <strong>{money(row.totalCost)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
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

        {tab === "machining" ? (
          machineJob ? (
            <MachiningPreviewPanel
              document={machineJob}
              onExportJson={onExportMachineJson}
              onExportCsv={onExportMachineCsv}
            />
          ) : (
            <div className="report-doc">
              <p className="rail-empty">
                Machining preview unavailable. Machine export is intent-only and does not
                produce CNC programs.
              </p>
            </div>
          )
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
                Labour allowance
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={costingSettings.labourAllowance}
                  onChange={(event) =>
                    patchCosting({ labourAllowance: Number(event.currentTarget.value) })
                  }
                />
              </label>
              <label>
                Finish rate ×
                <input
                  type="number"
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={costingSettings.finishRateMultiplier}
                  onChange={(event) =>
                    patchCosting({
                      finishRateMultiplier: Number(event.currentTarget.value),
                    })
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
              <div className="report-card">
                <span className="report-card-label">Finish</span>
                <strong>{money(report.projectCost.totalFinish)}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">HW allowance</span>
                <strong>{money(report.projectCost.hardwareAllowance)}</strong>
              </div>
              <div className="report-card">
                <span className="report-card-label">Labour allowance</span>
                <strong>{money(report.projectCost.labourAllowance)}</strong>
              </div>
            </div>

            <div className="shop-table-wrap">
              <table className="shop-table">
                <thead>
                  <tr>
                    <th>Mark</th>
                    <th>Cabinet</th>
                    <th>Material</th>
                    <th>Finish</th>
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
                        <td>{money(cost.finishCost)}</td>
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

        {tab === "quote" ? (
          <div className="report-doc">
            <header className="report-doc-header">
              <div>
                <strong>Quote / Estimate</strong>
                <span>
                  Rev {report.summary.revision} · valid until {validUntilLabel} ·{" "}
                  {quoteSettings.currencyLabel}
                </span>
              </div>
              <div className="quote-header-actions">
                <strong>{formatQuoteMoney(quote.sellTotal, quoteSettings.currencyLabel)}</strong>
                {onFreezeQuote ? (
                  <button type="button" className="tb-btn tb-accent" onClick={onFreezeQuote}>
                    Freeze for revision
                  </button>
                ) : null}
              </div>
            </header>

            <div className="costing-controls quote-controls">
              <label>
                Markup %
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={quoteSettings.markupPercent}
                  onChange={(event) =>
                    patchQuote({ markupPercent: Number(event.currentTarget.value) })
                  }
                />
              </label>
              <label>
                Tax %
                <input
                  type="number"
                  min={0}
                  max={40}
                  step={1}
                  value={quoteSettings.taxPercent}
                  onChange={(event) =>
                    patchQuote({ taxPercent: Number(event.currentTarget.value) })
                  }
                />
              </label>
              <label>
                Discount %
                <input
                  type="number"
                  min={0}
                  max={40}
                  step={1}
                  value={quoteSettings.discountPercent}
                  onChange={(event) =>
                    patchQuote({ discountPercent: Number(event.currentTarget.value) })
                  }
                />
              </label>
              <label>
                Finish premium %
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={quoteSettings.finishPremiumPercent}
                  onChange={(event) =>
                    patchQuote({ finishPremiumPercent: Number(event.currentTarget.value) })
                  }
                />
              </label>
              <label>
                Labour allowance
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={quoteSettings.labourAllowance}
                  onChange={(event) =>
                    patchQuote({ labourAllowance: Number(event.currentTarget.value) })
                  }
                />
              </label>
              <label>
                Validity (days)
                <input
                  type="number"
                  min={1}
                  max={365}
                  step={1}
                  value={quoteSettings.validityDays}
                  onChange={(event) =>
                    patchQuote({ validityDays: Number(event.currentTarget.value) })
                  }
                />
              </label>
            </div>

            <div className="report-cost-grid">
              {quote.summaryCards.map((card) => (
                <div key={card.label} className="report-card">
                  <span className="report-card-label">{card.label}</span>
                  <strong>{money(card.amount)}</strong>
                </div>
              ))}
            </div>

            <section className="report-subsection">
              <h3>Itemized estimate</h3>
              <div className="shop-table-wrap">
                <table className="shop-table">
                  <thead>
                    <tr>
                      <th>Mark</th>
                      <th>Cabinet</th>
                      <th>Workshop</th>
                      <th>Finish</th>
                      <th>Premium</th>
                      <th>Sell</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.cabinetLines.map((line) => (
                      <tr key={line.cabinetId}>
                        <td>
                          <code className="shop-ref">{line.mark}</code>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="shop-source-btn"
                            onClick={() => onSelectCabinet?.(line.cabinetId)}
                          >
                            {line.cabinetName}
                          </button>
                        </td>
                        <td>{money(line.workshopCost)}</td>
                        <td>{money(line.finishCost)}</td>
                        <td>{money(line.finishPremium)}</td>
                        <td>
                          <strong>{money(line.sellPrice)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {quote.hardwareRollup.length > 0 ? (
              <section className="report-subsection">
                <h3>Hardware rollup</h3>
                <div className="shop-table-wrap">
                  <table className="shop-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Unit</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.hardwareRollup.map((line) => (
                        <tr key={line.id}>
                          <td>{line.label}</td>
                          <td>{line.quantity}</td>
                          <td>{money(line.unitCost)}</td>
                          <td>{money(line.totalCost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            <section className="report-subsection quote-terms">
              <h3>Commercial terms</h3>
              <label>
                Inclusions
                <textarea
                  rows={2}
                  value={quoteSettings.inclusions}
                  onChange={(event) => patchQuote({ inclusions: event.currentTarget.value })}
                />
              </label>
              <label>
                Exclusions
                <textarea
                  rows={2}
                  value={quoteSettings.exclusions}
                  onChange={(event) => patchQuote({ exclusions: event.currentTarget.value })}
                />
              </label>
            </section>

            <section className="report-subsection">
              <h3>Revision snapshots</h3>
              {report.quoteHistory.length === 0 ? (
                <p className="report-empty">
                  No frozen quotes yet. Use Freeze for revision to lock pricing against the current
                  revision.
                </p>
              ) : (
                <div className="shop-table-wrap">
                  <table className="shop-table">
                    <thead>
                      <tr>
                        <th>Rev</th>
                        <th>Date</th>
                        <th>Workshop</th>
                        <th>Sell</th>
                        <th>Cabinets</th>
                        <th>Rules</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.quoteHistory.map((snap) => (
                        <tr key={snap.id}>
                          <td>
                            <code className="shop-ref">{snap.revision}</code>
                          </td>
                          <td>{new Date(snap.quotedAt).toLocaleDateString()}</td>
                          <td>{money(snap.workshopTotal)}</td>
                          <td>
                            <strong>{money(snap.sellTotal)}</strong>
                          </td>
                          <td>{snap.cabinetCount}</td>
                          <td>
                            M{snap.markupPercent}% · T{snap.taxPercent}% · F
                            {snap.finishPremiumPercent}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
