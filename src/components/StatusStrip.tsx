import type { CostingSettings } from "../domain/costingSettings";
import type { QuoteSettings } from "../domain/quoteSettings";
import type { SheetOptimizerSettings } from "../domain/sheetStock";
import type { ProjectReport } from "../domain/projectReport";
import type { WholeProjectReport } from "../domain/projectRooms";
import type { MachineJobDocument } from "../domain/machineExport";
import type { ReviewNoteSeverity } from "../domain/projectReview";
import type { ViewportHudState } from "../domain/desktopUx";
import { ReportCenter } from "./ReportCenter";
import { PaneResizeHandle } from "./PaneResizeHandle";
import { StatusHudSegments } from "./StatusHudSegments";
import { EngineeringDriftChip } from "./EngineeringDriftChip";
import type { PostApprovalDrift } from "../domain/livingRoom/handoff";

type StatusStripProps = {
  workbenchMode?: import("../domain/desktopUx").WorkbenchMode;
  projectStatus: string;
  workspaceLabel: string;
  jobTitle: string;
  jobStatusLabel: string;
  cabinetCount: number;
  selectionSummary: string;
  validationMessages: string[];
  drift?: PostApprovalDrift | null;
  hud: ViewportHudState;
  onCycleSnap?: () => void;
  onToggleGrid?: () => void;
  statusDockOpen: boolean;
  dockHeightPx?: number;
  onToggleStatusDock: () => void;
  onDockHeightChange?: (heightPx: number) => void;
  onSave: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
  report: ProjectReport;
  selectedCabinetId: string | null;
  costingSettings: CostingSettings;
  quoteSettings: QuoteSettings;
  sheetOptimizerSettings: SheetOptimizerSettings;
  onCostingChange: (next: CostingSettings) => void;
  onQuoteChange: (next: QuoteSettings) => void;
  onSheetOptimizerChange: (next: SheetOptimizerSettings) => void;
  onFreezeQuote: () => void;
  onSelectCabinet: (cabinetId: string) => void;
  wholeProject?: WholeProjectReport | null;
  machineJob?: MachineJobDocument | null;
  onExportMachineJson?: () => void;
  onExportMachineCsv?: () => void;
  onFreezeRevision?: (note: string, bumpRevision: boolean) => void;
  onAddReviewNote?: (message: string, severity: ReviewNoteSeverity) => void;
  onResolveReviewNote?: (noteId: string, resolved: boolean) => void;
  onApproveReview?: (approvedBy: string) => void;
  onReleaseForProduction?: () => void;
  onExportRevisionSummary?: () => void;
  approvalBlockedReasons?: string[];
  releaseBlockedReasons?: string[];
  sheets?: import("../domain/sheetDocuments").SheetDocument[];
  onOpenSheet?: (sheetId: string) => void;
};

export function StatusStrip({
  workbenchMode = "cabinets",
  projectStatus,
  workspaceLabel,
  jobTitle,
  jobStatusLabel,
  cabinetCount,
  selectionSummary,
  validationMessages,
  drift = null,
  hud,
  onCycleSnap,
  onToggleGrid,
  statusDockOpen,
  dockHeightPx = 280,
  onDockHeightChange,
  report,
  selectedCabinetId,
  costingSettings,
  quoteSettings,
  sheetOptimizerSettings,
  onCostingChange,
  onQuoteChange,
  onSheetOptimizerChange,
  onFreezeQuote,
  onSelectCabinet,
  wholeProject = null,
  machineJob = null,
  onExportMachineJson,
  onExportMachineCsv,
  onFreezeRevision,
  onAddReviewNote,
  onResolveReviewNote,
  onApproveReview,
  onReleaseForProduction,
  onExportRevisionSummary,
  approvalBlockedReasons = [],
  releaseBlockedReasons = [],
  sheets = [],
  onOpenSheet,
}: StatusStripProps) {
  return (
    <footer className="status-strip">
      <div className="output-bar">
        <span className="output-status">{projectStatus || "Ready"}</span>
        <StatusHudSegments
          hud={hud}
          workbenchMode={workbenchMode}
          onCycleSnap={onCycleSnap}
          onToggleGrid={onToggleGrid}
        />
        <span className="output-stats">
          {workspaceLabel} · {jobTitle} · {jobStatusLabel} · {cabinetCount} items ·{" "}
          {selectionSummary}
        </span>
        <span className="output-bar-actions">
          {drift ? <EngineeringDriftChip drift={drift} /> : null}
          <span className={validationMessages.length > 0 ? "status-warning-count" : "status-ready"}>
            {validationMessages.length > 0
              ? `${validationMessages.length} warning${validationMessages.length === 1 ? "" : "s"}`
              : "No warnings"}
          </span>
        </span>
      </div>
      {validationMessages.length > 0 ? (
        <div className="output-warnings">
          {validationMessages.map((message, index) => (
            <span
              key={`${index}-${message}`}
              className={`output-warn ${message.startsWith("Error:") ? "output-warn-error" : ""}`}
            >
              {message}
            </span>
          ))}
        </div>
      ) : null}
      {statusDockOpen ? (
        <>
          {onDockHeightChange ? (
            <PaneResizeHandle
              axis="y"
              value={dockHeightPx}
              min={160}
              max={520}
              ariaLabel="Resize status dock"
              onChange={onDockHeightChange}
            />
          ) : null}
          <div
            className="status-dock"
            style={{ height: dockHeightPx, maxHeight: "none" }}
          >
            <ReportCenter
              report={report}
              wholeProject={wholeProject}
              machineJob={machineJob}
              onExportMachineJson={onExportMachineJson}
              onExportMachineCsv={onExportMachineCsv}
              selectedCabinetId={selectedCabinetId}
              costingSettings={costingSettings}
              quoteSettings={quoteSettings}
              sheetOptimizerSettings={sheetOptimizerSettings}
              onCostingChange={onCostingChange}
              onQuoteChange={onQuoteChange}
              onSheetOptimizerChange={onSheetOptimizerChange}
              onFreezeQuote={onFreezeQuote}
              onSelectCabinet={onSelectCabinet}
              onFreezeRevision={onFreezeRevision}
              onAddReviewNote={onAddReviewNote}
              onResolveReviewNote={onResolveReviewNote}
              onApproveReview={onApproveReview}
              onReleaseForProduction={onReleaseForProduction}
              onExportRevisionSummary={onExportRevisionSummary}
              approvalBlockedReasons={approvalBlockedReasons}
              releaseBlockedReasons={releaseBlockedReasons}
              sheets={sheets}
              onOpenSheet={onOpenSheet}
            />
          </div>
        </>
      ) : null}
    </footer>
  );
}
